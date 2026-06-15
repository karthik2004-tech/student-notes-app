# CORS Security Configuration Guide

## Overview

PatternWise backend implements restricted Cross-Origin Resource Sharing (CORS) to prevent unauthorized cross-origin access. CORS is now configured with an explicit origin whitelist rather than allowing all origins (`*`).

## Security Issue Addressed

### Problem: Unrestricted CORS

**Before:**
```javascript
app.use(cors()); // Allows ALL origins - SECURITY RISK
```

**Impact:**
- Any website can make requests to PatternWise API
- No protection against CSRF attacks
- Credentials can be leaked to unauthorized origins
- API abuse from external domains

### Solution: Origin Whitelisting

**After:**
```javascript
app.use(cors(corsConfig)); // Only whitelisted origins allowed
```

**Benefits:**
- Only trusted origins can access the API
- CSRF protection enabled
- Credentials safely managed
- API access controlled

## Configuration

### Environment Variable: `ALLOWED_ORIGINS`

Set in `.env` file:

```bash
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Production
ALLOWED_ORIGINS=https://patternwise.example.com,https://app.example.com

# For all local testing (development only)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000
```

**Format:**
- Comma-separated list of URLs
- Include protocol (http/https)
- Include port if needed
- **Do NOT use `*`** in production

### CORS Options Configured

```javascript
{
  origin: (origin, callback) => {
    // Check if origin is whitelisted
    // Allow requests with no origin (mobile apps, curl, server-to-server)
  },
  credentials: true,           // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400                // Cache preflight for 24 hours
}
```

## How Origin Whitelisting Works

### 1. Browser Sends Request

```
Browser: http://localhost:3000
         ↓
Request to: http://localhost:5000/api/patterns
Header: Origin: http://localhost:3000
```

### 2. Server Checks Whitelist

```
ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:5173"
                       ↓
         Is origin whitelisted?
                       ↓
              YES → Allow request
                       ↓
              NO → Reject with CORS error
```

### 3. Browser Receives Response

```
✅ If whitelisted:
Response Headers:
  Access-Control-Allow-Origin: http://localhost:3000
  Access-Control-Allow-Credentials: true
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Max-Age: 86400

Browser: Allows request to proceed

---

❌ If NOT whitelisted:
Response Headers:
  (No CORS headers)

Browser Console Error:
  Access to XMLHttpRequest at 'http://localhost:5000/api/patterns'
  from origin 'http://evil.com' has been blocked by CORS policy:
  No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Preflight Requests

Modern browsers send OPTIONS preflight request for certain requests:

### When Preflight Happens

```
POST request with custom headers
Authorization: Bearer token
Content-Type: application/json
↓
Browser sends OPTIONS preflight first
↓
Server responds with CORS headers
↓
Browser sends actual POST request
```

### Preflight Flow

```
Request 1 (OPTIONS):
  Origin: http://localhost:3000
  Access-Control-Request-Method: POST
  Access-Control-Request-Headers: Content-Type, Authorization

Response 1:
  ✅ Access-Control-Allow-Origin: http://localhost:3000
  ✅ Access-Control-Allow-Methods: POST
  ✅ Access-Control-Allow-Headers: Content-Type, Authorization

Request 2 (Actual POST):
  (Now allowed to proceed)
```

## No-Origin Requests

Some requests don't send Origin header:

```
Allowed:
- Mobile app requests
- curl commands
- Server-to-server requests
- Form submissions (in some cases)

Code:
if (!origin) {
  return callback(null, true); // Allow
}
```

## Credentials & Authentication

### Secure Cookie Transmission

```javascript
// Request from browser
fetch('http://localhost:5000/api/patterns', {
  credentials: 'include' // Include cookies
})

// Server CORS config
{
  credentials: true,
  origin: (origin, callback) => {
    // Validate origin
  }
}

// Response headers
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true  // ← REQUIRED for cookies
```

**Important:** When `credentials: true`, origin must be specific (not `*`)

## Environment-Specific Configurations

### Development

```bash
# .env (development)
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000

# Features:
# - Multiple dev origins allowed
# - CORS requests logged
# - Debugging enabled
```

### Production

```bash
# .env.production
NODE_ENV=production
ALLOWED_ORIGINS=https://patternwise.example.com,https://app.example.com

# Features:
# - Specific production domains only
# - HTTPS required
# - Minimal logging
# - Strict origin checking
```

### Staging

```bash
# .env.staging
NODE_ENV=production
ALLOWED_ORIGINS=https://staging.example.com,https://app-staging.example.com
```

## Docker / Kubernetes Configuration

### Docker Compose

```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
      - ALLOWED_ORIGINS=https://frontend.example.com,https://api.example.com
```

### Kubernetes

```yaml
env:
  - name: ALLOWED_ORIGINS
    valueFrom:
      configMapKeyRef:
        name: patternwise-config
        key: allowed-origins
  - name: NODE_ENV
    value: "production"
```

## Testing CORS

### Test 1: Whitelisted Origin (Should Work)

```bash
curl -X OPTIONS http://localhost:5000/api/patterns \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Expected: 200 OK with CORS headers
# Access-Control-Allow-Origin: http://localhost:3000
```

### Test 2: Non-Whitelisted Origin (Should Fail)

```bash
curl -X OPTIONS http://localhost:5000/api/patterns \
  -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Expected: 200 OK but WITHOUT CORS headers
# Browser will block request
```

### Test 3: No Origin (Should Work)

```bash
curl http://localhost:5000/api/patterns

# Expected: 200 OK
# (No Origin header, request allowed)
```

### Test 4: Browser Test

```javascript
// From http://localhost:3000
fetch('http://localhost:5000/api/patterns')
  .then(r => r.json())
  .then(data => console.log(data)) // ✅ Works
  .catch(e => console.error(e))    // ❌ CORS error

// From http://evil.com
fetch('http://localhost:5000/api/patterns')
  .then(r => r.json())
  // ❌ Browser blocks before response (CORS error in console)
```

## Troubleshooting

### "No 'Access-Control-Allow-Origin' header"

**Problem:** Request blocked by CORS policy

**Solutions:**
1. Check ALLOWED_ORIGINS contains your origin
   ```bash
   echo $ALLOWED_ORIGINS
   ```
2. Verify exact domain/port match
   ```bash
   # ❌ Wrong - missing :3000
   ALLOWED_ORIGINS=http://localhost
   
   # ✅ Correct
   ALLOWED_ORIGINS=http://localhost:3000
   ```
3. Check protocol (http vs https)
   ```bash
   # ❌ Wrong - mixed protocols
   ALLOWED_ORIGINS=https://localhost:3000
   
   # ✅ Correct
   ALLOWED_ORIGINS=http://localhost:3000
   ```

### "Credentials mode is 'include' but Access-Control-Allow-Credentials is missing"

**Problem:** Trying to send credentials without proper CORS config

**Solution:** Ensure credentials are enabled:
```javascript
// Server-side
{
  credentials: true,
  origin: (origin, callback) => {
    // Validate origin
  }
}

// Client-side
fetch(url, {
  credentials: 'include'
})
```

### "Expected 'true', got 'false'"

**Problem:** Credentials config mismatch

**Check:**
- Client uses `credentials: 'include'`
- Server has `credentials: true`
- Origin is whitelisted (not `*`)

### CORS Requests Blocked in Production

**Problem:** Works in dev, fails in production

**Check:**
1. ALLOWED_ORIGINS correct for production domain
   ```bash
   # Dev
   ALLOWED_ORIGINS=http://localhost:3000
   
   # Production
   ALLOWED_ORIGINS=https://app.example.com
   ```
2. HTTPS protocol correct
3. Domain spelling exact
4. Port included if needed

## Best Practices

### 1. Be Specific with Origins

```javascript
// ❌ Don't use wildcards in production
ALLOWED_ORIGINS=*

// ✅ Specific domains only
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

### 2. Use HTTPS in Production

```javascript
// ✅ Production
ALLOWED_ORIGINS=https://example.com

// ❌ Don't mix protocols
ALLOWED_ORIGINS=http://example.com,https://example.com
```

### 3. Validate Origin at Application Level

```javascript
// Even with CORS, validate origin in application logic
const origin = req.get('origin');
if (origin && !config.ALLOWED_ORIGINS.includes(origin)) {
  // Additional validation
}
```

### 4. Rotate Origins for Maintenance

```javascript
// When deploying new frontend
ALLOWED_ORIGINS=https://old.example.com,https://new.example.com

// After successful deploy
ALLOWED_ORIGINS=https://new.example.com
```

### 5. Monitor CORS Errors

```javascript
// Log CORS rejections in development
if (process.env.NODE_ENV === 'development') {
  app.use(corsValidator); // Logs all requests
}
```

## Security Headers Integration

Combine CORS with additional security headers:

```bash
# nginx reverse proxy
add_header X-Content-Type-Options "nosniff";
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

## Migration from Unrestricted CORS

### Step 1: Identify Current Origins

```bash
# Check what's accessing your API
LOG_LEVEL=debug
# Monitor requests for 24 hours
```

### Step 2: Create Whitelist

```bash
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

### Step 3: Test in Staging

```bash
# Deploy to staging first
NODE_ENV=production
ALLOWED_ORIGINS=https://staging.example.com
```

### Step 4: Deploy to Production

```bash
# Monitor for CORS errors
# Adjust whitelist as needed
```

### Step 5: Monitor & Adjust

```bash
# Watch logs for rejected origins
# Update ALLOWED_ORIGINS if legitimate services needed
```

## References

- [MDN: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express.js CORS Middleware](https://github.com/expressjs/cors)
- [OWASP: Cross-Origin Resource Sharing (CORS)](https://owasp.org/www-community/Cross-Origin_Resource_Sharing_(CORS))
- [OWASP: Cross-Site Request Forgery (CSRF)](https://owasp.org/www-community/attacks/csrf)
