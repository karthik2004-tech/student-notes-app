# Rate Limiting & Request Throttling Guide

## Overview

PatternWise implements endpoint-specific rate limiting to protect the backend from abuse and prevent LeetCode API rate limits from being exceeded. Rate limiting is optional and can be enabled via configuration.

## Configuration

Rate limiting is controlled via environment variables:

```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true

# Rate limit window (milliseconds, default: 15 minutes)
RATE_LIMIT_WINDOW_MS=900000

# Max requests per window per IP
RATE_LIMIT_MAX_REQUESTS=100
```

## Enabling Rate Limiting

### Development

```bash
# .env
NODE_ENV=development
RATE_LIMIT_ENABLED=false  # Disabled for easy testing
```

### Production

```bash
# .env or environment
NODE_ENV=production
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

## Endpoint-Specific Limits

Rate limits vary by endpoint to protect the most expensive operations:

### GET /api/patterns

**Limit:** 100 requests per 15 minutes per IP

**Description:** Returns list of all DSA patterns (lightweight, no external API calls)

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-15T11:00:00Z
```

### GET /api/patterns/:id

**Limit:** 30 requests per 15 minutes per IP

**Description:** Returns pattern details with LeetCode problem stats (calls external API, more expensive)

**Response Headers:**
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 2024-01-15T11:00:00Z
```

**Reason for Strict Limit:** This endpoint makes HTTP calls to LeetCode API for each pattern. Protecting it prevents:
- Cascading failures if LeetCode API is hit too hard from this backend
- IP-based rate limiting on LeetCode affecting all users
- Resource exhaustion on the backend

## Rate Limit Exceeded Response

### Request
```bash
curl -i http://localhost:5000/api/patterns/sliding-window
curl -i http://localhost:5000/api/patterns/sliding-window  # 31st request in 15 min window
```

### Response (429 Too Many Requests)
```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 847,
      "resetTime": "2024-01-15T11:00:00Z"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:45:53.123Z",
    "version": "1.0.0"
  }
}
```

### Response Headers
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-01-15T11:00:00.000Z
Retry-After: 847
```

## Response Caching

When rate limiting is enabled, successful API responses are cached for **5 minutes** to:
- Reduce load on LeetCode API
- Serve repeated requests instantly
- Preserve rate limit quota

### Cache Headers

**Cache Hit:**
```
HTTP/1.1 200 OK
X-Cache: HIT
X-Cache-Key: GET:/api/patterns/sliding-window:{}
```

**Cache Miss (cached for next 5 minutes):**
```
HTTP/1.1 200 OK
X-Cache: MISS
X-Cache-Key: GET:/api/patterns/sliding-window:{}
```

## How It Works

### In-Memory Rate Limiter

```
Request arrives → Extract IP → Check rate limit counter
    ↓
Counter < Limit? → Yes: Allow request, increment counter, set reset time
    ↓ No
Reject with 429, include Retry-After header
```

### IP Detection

The rate limiter identifies clients by IP address (in order):
1. `X-Forwarded-For` header (proxy/reverse proxy)
2. `req.socket.remoteAddress` (direct connection)
3. `'unknown'` (fallback)

### Reset Behavior

```
Time 0:00 ─────────── Time 15:00 (reset)
Request 1 ✅          Request 31 ✅  (new window)
Request 2 ✅
...
Request 30 ✅
Request 31 ❌ (429)
Request 32 ❌ (429)
```

## Client-Side Handling

### Example: JavaScript

```javascript
async function fetchPattern(patternId) {
  try {
    const response = await fetch(`/api/patterns/${patternId}`);
    
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = new Date(response.headers.get('X-RateLimit-Reset'));
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After'));
      console.error(`Rate limited. Retry in ${retryAfter} seconds`);
      
      // Wait and retry
      setTimeout(() => fetchPattern(patternId), retryAfter * 1000);
      return;
    }
    
    const data = await response.json();
    console.log(`${remaining} requests remaining until ${reset}`);
    return data;
  } catch (error) {
    console.error('Error fetching pattern:', error);
  }
}
```

### Example: cURL with Retry Logic

```bash
#!/bin/bash

retry_with_backoff() {
  local max_attempts=3
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    response=$(curl -i http://localhost:5000/api/patterns/sliding-window 2>&1)
    
    if echo "$response" | grep -q "200 OK"; then
      echo "$response"
      return 0
    elif echo "$response" | grep -q "429"; then
      retry_after=$(echo "$response" | grep -i "Retry-After" | cut -d' ' -f2)
      echo "Rate limited. Waiting $retry_after seconds..."
      sleep $retry_after
      ((attempt++))
    else
      echo "$response"
      return 1
    fi
  done
  
  echo "Failed after $max_attempts attempts"
  return 1
}

retry_with_backoff
```

## Production Deployment

### Kubernetes

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: patternwise-config
data:
  RATE_LIMIT_ENABLED: "true"
  RATE_LIMIT_WINDOW_MS: "900000"    # 15 minutes
  RATE_LIMIT_MAX_REQUESTS: "100"
```

### Docker

```bash
docker run \
  -e RATE_LIMIT_ENABLED=true \
  -e RATE_LIMIT_WINDOW_MS=900000 \
  -e RATE_LIMIT_MAX_REQUESTS=100 \
  patternwise-backend
```

### Reverse Proxy (Nginx)

If using Nginx as reverse proxy, also add rate limiting at the proxy level:

```nginx
# limit_req_zone for Nginx-level rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=6r/m;

server {
  location /api/patterns {
    limit_req zone=api_limit burst=5 nodelay;
    proxy_pass http://backend:5000;
  }
}
```

## Monitoring & Logging

### Rate Limit Warnings

Rate limit violations are logged when hit:

```
[RATE_LIMIT] 192.168.1.100 hit limit on /api/patterns/sliding-window. Reset: 2024-01-15T11:00:00Z
```

### Prometheus Metrics (Future)

```
# Rate limit metrics
patternwise_rate_limit_hits_total{endpoint="/api/patterns/:id"} 150
patternwise_rate_limit_remaining{ip="192.168.1.100"} 5
patternwise_cache_hits_total 1200
patternwise_cache_misses_total 300
```

## Limits Reference

| Endpoint | Limit | Reason |
|----------|-------|--------|
| `/api/patterns` | 100/15min | Lists patterns (no external API) |
| `/api/patterns/:id` | 30/15min | Fetches from LeetCode API |

## Troubleshooting

### "Rate limited after few requests"

**Problem:** Getting 429 error immediately

**Solution:** Check `RATE_LIMIT_MAX_REQUESTS` is reasonable
```bash
# If too strict:
RATE_LIMIT_MAX_REQUESTS=100  # Instead of 10
```

### "IPs not tracked correctly"

**Problem:** Different clients share same rate limit

**Solution:** Ensure `X-Forwarded-For` header is set by proxy
```bash
# Nginx config
proxy_set_header X-Forwarded-For $remote_addr;
```

### "Cache not working"

**Problem:** Same requests returning different data

**Solution:** Verify `RATE_LIMIT_ENABLED=true` in config
```bash
# Check config loaded
NODE_ENV=production RATE_LIMIT_ENABLED=true npm start
```

## Best Practices

1. **Test locally without rate limiting first**
   ```bash
   RATE_LIMIT_ENABLED=false npm start
   ```

2. **Enable in production**
   ```bash
   NODE_ENV=production RATE_LIMIT_ENABLED=true npm start
   ```

3. **Monitor rate limit violations**
   - Watch logs for `[RATE_LIMIT]` entries
   - Alert on sustained 429 responses

4. **Adjust limits based on usage**
   - Start conservative (30/15min)
   - Increase if legitimate users hit limits
   - Decrease if abuse detected

5. **Use caching to preserve quota**
   - Responses cached for 5 minutes
   - Repeated requests don't consume quota
   - Reduces load on external API

## Performance Impact

### With Rate Limiting Disabled
- No overhead
- No in-memory storage
- Direct routing to controller

### With Rate Limiting Enabled
- ~1-2ms per request for rate limit check
- In-memory storage (~1KB per unique IP)
- Automatic cleanup every 60 seconds
- Cache storage (~100KB for 1000 responses)

## Planned Enhancements

1. **Redis-backed rate limiting** (for distributed deployments)
2. **Per-user rate limits** (if authentication added)
3. **Adaptive rate limiting** (increases limits during low traffic)
4. **Rate limit reset notifications** (webhooks/email)
5. **Bulk request limits** (concurrent requests cap)
