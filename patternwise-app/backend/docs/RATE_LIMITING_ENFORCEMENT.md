# Rate Limiting Enforcement Guide

## Overview

PatternWise implements configurable rate limiting on API routes to prevent abuse, ensure fair resource usage, and protect against DoS attacks. Rate limiting is applied per-IP address with configurable limits and windows.

## Architecture

### Rate Limiting Stack

```
Incoming Request
  ↓
CORS / Security Headers Middleware
  ↓
Rate Limiter Middleware
  ├─ Extract client IP
  ├─ Check current request count for IP
  ├─ If exceeded: Return 429 Too Many Requests
  ├─ If allowed: Increment counter, add headers, continue
  ↓
Route Handler / API Logic
  ↓
Response with Rate Limit Headers
```

## Components

### 1. In-Memory Rate Limiter (`middleware/rateLimiter.js`)

**Purpose:** Track requests per IP address with time-windowed reset

**Features:**
- Per-IP request tracking
- Configurable time window
- Automatic cleanup of expired entries
- Rate limit headers in responses
- Multiple endpoint-specific limiters

**How it works:**
```
Request from IP 192.168.1.1
  ↓
Lookup entry for 192.168.1.1
  ├─ No entry → Create new: count=0, resetTime=now+15min
  ├─ Entry expired → Reset: count=0, resetTime=now+15min
  ├─ Entry active → Use existing
  ↓
Increment count
  ↓
Check count <= maxRequests
  ├─ Yes → Allow request, add headers
  └─ No → Return 429, add Retry-After header
```

### 2. Rate Limiter Middleware

**File:** `middleware/rateLimiter.js`

**Main Classes/Functions:**

#### InMemoryRateLimiter
```javascript
new InMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,        // 15 minute window
  maxRequests: 100,                 // 100 requests per window
  message: 'Too many requests...',  // Error message
  keyGenerator: (req) => req.ip,    // How to identify client
  skip: (req) => false,             // Skip rate limiting for certain requests
  cleanupInterval: 60 * 1000        // Cleanup every 1 minute
})
```

**Methods:**
```javascript
check(key)              // Returns { allowed, current, limit, resetTime, retryAfter }
reset(key)              // Reset limits for single key
resetAll()              // Reset all limits
getStatus(key)          // Get current status for key
stopCleanup()           // Stop cleanup timer (for testing)
```

#### createRateLimiter(options)
```javascript
const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  skip: (req) => req.method === 'OPTIONS'
});

// Returns Express middleware
app.use(limiter);
```

#### createEndpointLimiters(config)
```javascript
const limiters = createEndpointLimiters(config);

// Returns object with endpoint-specific limiters
{
  patterns: rateLimiter,        // 100 req/15min
  patternDetails: rateLimiter,  // 50 req/15min
  api: rateLimiter              // Configurable
}
```

### 3. Route Integration (`routes/api.js`)

**Rate Limits Applied:**

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| GET /api/patterns | 100 | 15 min | List all patterns |
| GET /api/patterns/:id | 50 | 15 min | Get pattern details |

**Implementation:**
```javascript
const limiters = createEndpointLimiters(config);

router.get('/patterns', 
  limiters.patterns,  // Apply rate limiter middleware
  patternController.getPatterns
);
```

## Configuration

### Environment Variables

```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true

# Time window in milliseconds (default: 15 minutes)
RATE_LIMIT_WINDOW_MS=900000

# Max requests per window (default: 100)
RATE_LIMIT_MAX_REQUESTS=100
```

### Configuration Examples

**Development (Relaxed):**
```bash
RATE_LIMIT_ENABLED=false  # Disabled for development
```

**Production (Standard):**
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # 100 requests
```

**Production (Strict):**
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=600000     # 10 minutes
RATE_LIMIT_MAX_REQUESTS=50      # 50 requests
```

**Production (Lenient):**
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=1800000    # 30 minutes
RATE_LIMIT_MAX_REQUESTS=200     # 200 requests
```

## Request/Response Flow

### Allowed Request

```
Request:
  GET /api/patterns
  X-Forwarded-For: 192.168.1.1

Rate Limiter Check:
  Current: 42/100 requests
  Reset: 15 minutes ago
  ✅ Allowed

Response:
  HTTP/1.1 200 OK
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 57
  X-RateLimit-Reset: 1704067800
  {
    "status": "success",
    "data": [...]
  }
```

### Rate Limit Exceeded

```
Request:
  GET /api/patterns
  X-Forwarded-For: 192.168.1.1

Rate Limiter Check:
  Current: 100/100 requests
  Reset: 5 minutes remaining
  ❌ Limit exceeded

Response:
  HTTP/1.1 429 Too Many Requests
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1704067800
  Retry-After: 300
  {
    "status": "error",
    "error": {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Too many pattern list requests, please try again later",
      "details": {
        "limit": 100,
        "current": 100,
        "retryAfter": 300,
        "resetTime": "2024-01-15T10:30:00Z"
      }
    }
  }
```

## Rate Limiting Headers

### Response Headers

**X-RateLimit-Limit:**
```
Total number of requests allowed in window
Example: 100
```

**X-RateLimit-Remaining:**
```
Number of requests remaining in current window
Example: 57
```

**X-RateLimit-Reset:**
```
Unix timestamp when window resets
Example: 1704067800
Calculation: Math.ceil(resetTime / 1000)
```

**Retry-After:**
```
(Only on 429 response)
Seconds to wait before retrying
Example: 300
```

### Parsing Rate Limit Headers (Client-side)

**JavaScript:**
```javascript
const response = await fetch('/api/patterns');
const limit = response.headers.get('X-RateLimit-Limit');
const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');

console.log(`${remaining}/${limit} requests remaining`);
console.log(`Reset at: ${new Date(reset * 1000)}`);

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Retry after ${retryAfter} seconds`);
}
```

**Python:**
```python
import requests
import time
from datetime import datetime

response = requests.get('https://api.example.com/api/patterns')

limit = response.headers['X-RateLimit-Limit']
remaining = response.headers['X-RateLimit-Remaining']
reset = response.headers['X-RateLimit-Reset']

print(f"{remaining}/{limit} requests remaining")
print(f"Reset at: {datetime.fromtimestamp(int(reset))}")

if response.status_code == 429:
    retry_after = int(response.headers['Retry-After'])
    print(f"Rate limited. Sleeping for {retry_after} seconds...")
    time.sleep(retry_after)
```

## Client-Side Handling

### Respecting Rate Limits

```javascript
// ❌ Wrong: Ignore rate limits
for (let i = 0; i < 1000; i++) {
  fetch('/api/patterns');  // Will hit rate limit after 100 requests
}

// ✅ Right: Check headers and back off
async function fetchWithRateLimit(url) {
  const response = await fetch(url);
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  if (remaining === '0') {
    const waitTime = Math.ceil(reset) - Math.floor(Date.now() / 1000);
    console.warn(`Rate limit reached. Waiting ${waitTime}s before next request...`);
  }
  
  return response;
}
```

### Exponential Backoff

```javascript
async function fetchWithBackoff(url, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url);
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
      
      if (attempt < maxRetries) {
        console.warn(`Rate limited. Waiting ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      } else {
        throw new Error('Max retries exceeded');
      }
    }
    
    return response;
  }
}
```

### Batch Request Throttling

```javascript
async function throttledRequests(urls, requestsPerSecond = 10) {
  const delay = 1000 / requestsPerSecond;
  
  for (const url of urls) {
    const startTime = Date.now();
    const response = await fetch(url);
    const elapsed = Date.now() - startTime;
    
    // Wait to maintain rate
    const waitTime = Math.max(0, delay - elapsed);
    await new Promise(r => setTimeout(r, waitTime));
  }
}
```

## Monitoring and Logging

### Rate Limit Events

**When rate limiting is active:**
```
[RATE_LIMIT] Request allowed: IP=192.168.1.1 Count=45/100 Endpoint=/api/patterns
[RATE_LIMIT] Request allowed: IP=192.168.1.1 Count=46/100 Endpoint=/api/patterns
...
[RATE_LIMIT] Rate limit exceeded: IP=192.168.1.1 Count=101/100 Endpoint=/api/patterns
[RATE_LIMIT] Rate limit exceeded: IP=192.168.1.1 Retry-After=289s
```

**Cleanup events:**
```
[RATE_LIMIT_CLEANUP] Cleaned up 5 expired entries
[RATE_LIMIT_CLEANUP] Current active entries: 12
```

### Metrics to Track

```javascript
// In production monitoring
1. Rate limit hits per IP
2. Most rate-limited endpoints
3. Average requests per IP
4. Peak load times
5. Geographic distribution of rate limits
```

## Testing Rate Limits

### Test 1: Verify Rate Limiter Applies

```bash
# Check headers in response
curl -I http://localhost:5000/api/patterns

# Expected headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1704067800
```

### Test 2: Trigger Rate Limit

```bash
#!/bin/bash
# Make 101 requests (limit is 100)
for i in {1..101}; do
  response=$(curl -s -w "\nStatus: %{http_code}" http://localhost:5000/api/patterns)
  echo "Request $i: $(echo "$response" | tail -1)"
done

# Last request should return 429 Too Many Requests
```

### Test 3: Verify Retry-After Header

```bash
# Make requests until rate limited
for i in {1..101}; do
  curl -s http://localhost:5000/api/patterns > /dev/null
done

# Next request shows Retry-After
curl -i http://localhost:5000/api/patterns | grep -i "retry-after"

# Expected:
Retry-After: 899
```

### Test 4: Verify Different Endpoints Have Different Limits

```bash
# /api/patterns endpoint (100 req/15min)
for i in {1..50}; do
  curl -s http://localhost:5000/api/patterns > /dev/null
done

# /api/patterns/:id endpoint (50 req/15min) 
for i in {1..40}; do
  curl -s http://localhost:5000/api/patterns/sliding-window > /dev/null
done

# Both endpoints should still have requests available
# (separate rate limiters)
```

## Deployment Scenarios

### Scenario 1: Development (Rate Limiting Disabled)

```bash
# .env
RATE_LIMIT_ENABLED=false

# Result: No rate limiting, full dev speed
```

### Scenario 2: Production Standard

```bash
# .env.production
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # 100 requests

# Results:
# - GET /api/patterns: 100 req/15min
# - GET /api/patterns/:id: 50 req/15min (stricter)
# - Fair usage for typical clients
```

### Scenario 3: Production High Traffic

```bash
# .env.production
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=600000      # 10 minutes
RATE_LIMIT_MAX_REQUESTS=50       # 50 requests

# Results:
# - More aggressive rate limiting
# - Prevents abuse during traffic spikes
# - Better resource distribution
```

### Scenario 4: Production with Trusted IPs

```javascript
// Future enhancement: Whitelist trusted IPs
const whitelist = ['10.0.0.1', '10.0.0.2'];  // Internal services

const limiters = createEndpointLimiters(config, {
  skip: (req) => whitelist.includes(req.ip)
});

// Result: Internal services bypass rate limits
```

## Troubleshooting

### Issue: All requests hitting rate limit

**Symptoms:** 429 responses on first requests

**Causes:**
1. Rate limit too low
2. Multiple IPs behind same proxy (counted as single IP)
3. Clock skew

**Solutions:**
```bash
# Increase limits
RATE_LIMIT_MAX_REQUESTS=200

# Or increase window
RATE_LIMIT_WINDOW_MS=1800000  # 30 minutes
```

### Issue: X-Forwarded-For not working

**Symptoms:** Rate limits not working from reverse proxy

**Cause:** req.ip not reading X-Forwarded-For

**Solution (Express):**
```javascript
app.set('trust proxy', 1);  // Trust single proxy
// or
app.set('trust proxy', 'loopback, 10.0.0.0/8');  // Trust specific IPs
```

### Issue: Rate limits too strict for legitimate traffic

**Symptoms:** Legitimate users hitting 429

**Solutions:**
1. Increase RATE_LIMIT_MAX_REQUESTS
2. Increase RATE_LIMIT_WINDOW_MS
3. Implement user-specific limits (authenticated users get higher limits)

### Issue: Cleanup not working

**Symptoms:** Memory usage growing indefinitely

**Solution:** Check cleanup interval
```javascript
// Ensure cleanup is running
cleanupInterval: 60 * 1000  // Cleanup every 1 minute

// Monitor cleanup logs
[RATE_LIMIT_CLEANUP] Cleaned up 10 expired entries
```

## Performance Considerations

### Memory Usage

```
Per tracked IP: ~50 bytes
With 1000 active IPs: ~50KB
With 10000 active IPs: ~500KB

Acceptable for most deployments
```

### CPU Impact

```
Per request: <1ms (O(1) Map lookup and increment)
Impact: Negligible (<1% CPU overhead)
```

### Optimization Strategies

```javascript
// 1. Longer cleanup interval = more memory, less CPU
cleanupInterval: 5 * 60 * 1000  // Clean every 5 minutes

// 2. Use Redis for distributed rate limiting (future)
// 3. Implement sliding window algorithm (more accurate)
// 4. Per-user rate limits (if authentication available)
```

## Future Enhancements

1. **Redis-backed Rate Limiting**
   - Distributed rate limiting across multiple servers
   - Shared rate limit state

2. **Sliding Window Algorithm**
   - More accurate rate limiting
   - Smoother request distribution

3. **User/API Key Based Limits**
   - Different limits for authenticated vs anonymous
   - Tiered limits for different user levels

4. **Dynamic Limits**
   - Adjust limits based on system load
   - Machine learning to detect abuse patterns

5. **Distributed Tracing**
   - Track rate limit violations across services
   - Identify abuse patterns

6. **Whitelist/Blacklist**
   - Exclude certain IPs from rate limiting
   - Block specific IPs

7. **Custom Rate Limit Strategies**
   - Per-endpoint custom limits
   - Geographic-based limits

## References

- [RFC 6585: HTTP Status Code 429](https://tools.ietf.org/html/rfc6585)
- [MDN: Too Many Requests (429)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
- [Express.js Rate Limiting Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html#use-rate-limiting)
- [OWASP: Denial of Service (DoS)](https://owasp.org/www-community/attacks/Denial_of_Service)
