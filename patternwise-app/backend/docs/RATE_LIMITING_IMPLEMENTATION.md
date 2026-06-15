# Rate Limiting Implementation Guide

## Quick Start

### 1. Environment Configuration

```bash
# .env (development - disabled)
RATE_LIMIT_ENABLED=false

# .env.production
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100    # Maximum requests per window
```

### 2. Default Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /api/patterns | 100 | 15 min |
| GET /api/patterns/:id | 50 | 15 min |

### 3. Enable Rate Limiting

```bash
# Start server with rate limiting enabled
NODE_ENV=production npm start

# Verify it's working
curl -I http://localhost:5000/api/patterns

# Check headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
```

## Configuration Guide

### Basic Configuration

```bash
# Moderate limits (default)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Strict limits
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=600000     # 10 minutes
RATE_LIMIT_MAX_REQUESTS=50

# Lenient limits
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=1800000    # 30 minutes
RATE_LIMIT_MAX_REQUESTS=200

# Disabled (development)
RATE_LIMIT_ENABLED=false
```

### Advanced Configuration

**Custom per-endpoint limits:**

Edit `routes/api.js`:

```javascript
const limiters = {
  patterns: createRateLimiter({
    ...baseLimiter,
    maxRequests: 150,  // Custom: 150 instead of 100
  }),
  patternDetails: createRateLimiter({
    ...baseLimiter,
    maxRequests: 75,   // Custom: 75 instead of 50
  }),
};
```

**Skip rate limiting for certain requests:**

```javascript
const limiters = {
  patterns: createRateLimiter({
    ...baseLimiter,
    skip: (req) => {
      // Skip for health checks
      if (req.get('X-Health-Check')) return true;
      // Skip for internal service
      if (req.ip === '10.0.0.1') return true;
      return false;
    },
  }),
};
```

**Custom key generator (e.g., by user ID instead of IP):**

```javascript
const limiters = {
  patterns: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    },
  }),
};
```

## Testing Rate Limits

### Test Script 1: Basic Rate Limit Test

```bash
#!/bin/bash
# test-rate-limit.sh

echo "Testing rate limits..."
echo "Endpoint: /api/patterns"
echo "Limit: 100 requests / 15 minutes"
echo ""

# Make requests until rate limited
for i in {1..105}; do
  response=$(curl -s -w "\n%{http_code}" http://localhost:5000/api/patterns)
  status=$(echo "$response" | tail -1)
  
  if [ "$status" = "429" ]; then
    echo "✅ Rate limit triggered at request $i"
    echo "Response:"
    echo "$response" | head -1 | jq '.'
    break
  else
    echo "Request $i: $status ✓"
  fi
done
```

### Test Script 2: Verify Headers

```bash
#!/bin/bash
# test-headers.sh

echo "Checking rate limit headers..."
curl -i http://localhost:5000/api/patterns 2>/dev/null | grep -i "x-ratelimit\|retry-after"

# Expected output:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1704067800
```

### Test Script 3: Endpoint Comparison

```bash
#!/bin/bash
# test-endpoints.sh

echo "Testing different endpoints..."

echo ""
echo "1. Testing /api/patterns (100 req/15min):"
for i in {1..5}; do
  curl -s http://localhost:5000/api/patterns | jq '.data | length'
done

echo ""
echo "2. Testing /api/patterns/:id (50 req/15min):"
for i in {1..5}; do
  curl -s http://localhost:5000/api/patterns/sliding-window | jq '.data.name'
done

echo ""
echo "Both should complete successfully with different rate limits"
```

### Test Script 4: Rate Limit Response

```bash
#!/bin/bash
# test-rate-limit-response.sh

echo "Making requests to trigger rate limit..."

# Make 101 requests to trigger 429
for i in {1..101}; do
  curl -s http://localhost:5000/api/patterns > /dev/null
done

echo ""
echo "Checking rate limit response (should be 429):"
curl -i http://localhost:5000/api/patterns 2>/dev/null | head -15

echo ""
echo "Expected response:"
echo "HTTP/1.1 429 Too Many Requests"
echo "Retry-After: 899"
echo "X-RateLimit-Limit: 100"
echo "X-RateLimit-Remaining: 0"
```

## Client Implementation Examples

### JavaScript Fetch

```javascript
// Simple request with rate limit handling
async function getPatterns() {
  try {
    const response = await fetch('https://api.example.com/api/patterns');
    
    // Check rate limit headers
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    
    console.log(`Requests: ${remaining}/${limit}`);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.error(`Rate limited. Retry after ${retryAfter}s`);
      throw new Error('Rate limited');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
}

// With exponential backoff
async function getPatternWithRetry(retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://api.example.com/api/patterns');
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
        
        if (attempt < retries) {
          console.log(`Rate limited. Retrying in ${retryAfter}s...`);
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          continue;
        }
      }
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === retries) throw error;
    }
  }
}

// Batch requests with throttling
async function getMultiplePatterns(ids) {
  const results = [];
  
  for (const id of ids) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`https://api.example.com/api/patterns/${id}`);
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After'));
        console.log(`Rate limited. Waiting ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue; // Retry
      }
      
      results.push(await response.json());
    } catch (error) {
      console.error(`Error fetching pattern ${id}:`, error);
    }
    
    // Throttle requests (1 per second)
    const elapsed = Date.now() - startTime;
    const delay = Math.max(0, 1000 - elapsed);
    await new Promise(r => setTimeout(r, delay));
  }
  
  return results;
}
```

### Python Requests

```python
import requests
import time
from datetime import datetime

def get_patterns():
    """Get patterns with rate limit handling"""
    response = requests.get('https://api.example.com/api/patterns')
    
    # Check rate limit headers
    limit = response.headers.get('X-RateLimit-Limit')
    remaining = response.headers.get('X-RateLimit-Remaining')
    
    print(f"Requests: {remaining}/{limit}")
    
    if response.status_code == 429:
        retry_after = response.headers.get('Retry-After')
        print(f"Rate limited. Retry after {retry_after}s")
        raise Exception('Rate limited')
    
    return response.json()

def get_pattern_with_retry(retries=3):
    """Get pattern with exponential backoff"""
    for attempt in range(retries + 1):
        try:
            response = requests.get('https://api.example.com/api/patterns')
            
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 60))
                
                if attempt < retries:
                    print(f"Rate limited. Retrying in {retry_after}s...")
                    time.sleep(retry_after)
                    continue
                else:
                    raise Exception('Max retries exceeded')
            
            response.raise_for_status()
            return response.json()
        except Exception as e:
            if attempt == retries:
                raise
            time.sleep(2 ** attempt)

def get_multiple_patterns(ids):
    """Get multiple patterns with throttling"""
    results = []
    
    for id in ids:
        start_time = time.time()
        
        try:
            response = requests.get(f'https://api.example.com/api/patterns/{id}')
            
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After'))
                print(f"Rate limited. Waiting {retry_after}s...")
                time.sleep(retry_after)
                continue
            
            results.append(response.json())
        except Exception as e:
            print(f"Error fetching pattern {id}: {e}")
        
        # Throttle requests (1 per second)
        elapsed = time.time() - start_time
        delay = max(0, 1 - elapsed)
        time.sleep(delay)
    
    return results
```

## Monitoring and Debugging

### View Rate Limit Status

```javascript
// In development, add status endpoint
app.get('/api/rate-limit-status/:ip', (req, res) => {
  const { ip } = req.params;
  const status = limiters.patterns.getStatus(ip);
  res.json(status);
});

// Usage
curl http://localhost:5000/api/rate-limit-status/192.168.1.1
// Returns: { count: 45, limit: 100, active: true }
```

### Reset Rate Limits (Admin)

```javascript
// Admin endpoint to reset rate limits (development only)
app.post('/api/admin/rate-limit-reset', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Not allowed' });
  }
  
  const { ip } = req.body;
  
  if (ip) {
    limiters.patterns.reset(ip);
    res.json({ message: `Rate limit reset for ${ip}` });
  } else {
    limiters.patterns.resetAll();
    res.json({ message: 'All rate limits reset' });
  }
});

// Usage
curl -X POST http://localhost:5000/api/admin/rate-limit-reset \
  -H "Content-Type: application/json" \
  -d '{"ip":"192.168.1.1"}'
```

### Logging Rate Limit Events

```javascript
// Add custom logging middleware
function logRateLimitEvents(limiter) {
  const originalCheck = limiter.check.bind(limiter);
  
  limiter.check = function(key) {
    const result = originalCheck(key);
    
    if (result.allowed) {
      console.log(
        `[RATE_LIMIT] Allowed: IP=${key} ` +
        `Count=${result.current}/${result.limit}`
      );
    } else {
      console.warn(
        `[RATE_LIMIT] Exceeded: IP=${key} ` +
        `Count=${result.current}/${result.limit} ` +
        `RetryAfter=${result.retryAfter}s`
      );
    }
    
    return result;
  };
  
  return limiter;
}
```

## Deployment Checklist

- [ ] Rate limiting enabled in production
- [ ] RATE_LIMIT_ENABLED=true
- [ ] RATE_LIMIT_WINDOW_MS set to appropriate value
- [ ] RATE_LIMIT_MAX_REQUESTS set to appropriate value
- [ ] Rate limit headers verified in responses
- [ ] Reverse proxy correctly forwarding X-Forwarded-For
- [ ] Clients updated to handle 429 responses
- [ ] Monitoring/alerts configured for rate limit exceeded events
- [ ] Load testing performed with rate limiting active
- [ ] Documentation updated for API consumers
- [ ] Rate limit policies communicated to users
- [ ] Fallback plan if rate limiting too strict

## Performance Tuning

### If Rate Limiting Too Aggressive

```bash
# Increase limit
RATE_LIMIT_MAX_REQUESTS=150

# Increase window
RATE_LIMIT_WINDOW_MS=1200000  # 20 minutes

# Or disable for specific endpoints
# (Edit routes/api.js)
```

### If Memory Usage High

```bash
# Increase cleanup interval
cleanupInterval: 5 * 60 * 1000  # Clean every 5 minutes (instead of 1)

# Monitor cleanup logs
[RATE_LIMIT_CLEANUP] Cleaned up 100 expired entries
```

### If Response Latency High

```bash
# Verify rate limiter overhead (<1ms per request)
# Profile with: console.time/console.timeEnd

// In production, this should be <1ms:
const start = Date.now();
limiter.check(key);
console.log(`Rate limit check: ${Date.now() - start}ms`);
```

## References

- Implementation: `middleware/rateLimiter.js`
- Route Integration: `routes/api.js`
- Configuration: `config/index.js`
- Documentation: `docs/RATE_LIMITING_ENFORCEMENT.md`
