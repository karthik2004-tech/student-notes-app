# CORS Implementation Architecture

## System Design

### Current Implementation

```
Request from Browser
        ↓
CORS Middleware (express cors package)
        ↓
Validation Function:
  - Check Origin header
  - Compare against ALLOWED_ORIGINS
  - Return Allow or Reject
        ↓
Request Processor / Application Logic
        ↓
Response with CORS Headers (if allowed)
```

### Component Breakdown

#### 1. Configuration Module (`config/index.js`)

```javascript
/**
 * Function: getCorsConfig(config)
 * Input: config object from environment
 * Output: CORS middleware options
 */

getCorsConfig = (config) => {
  allowedOrigins = config.ALLOWED_ORIGINS.split(',')
  
  return {
    origin: (origin, callback) => {
      if (!origin) callback(null, true)
      if (allowedOrigins.includes(origin)) callback(null, true)
      else callback(new Error('CORS policy violation'))
    },
    credentials: true,
    methods: [...],
    allowedHeaders: [...],
    maxAge: 86400
  }
}
```

**Why:**
- Centralized CORS configuration
- Single source of truth for allowed origins
- Easy to update without code changes
- Environment-based configuration

#### 2. Environment Validation (`config/index.js`)

```javascript
/**
 * Function: loadConfig()
 * Validates required environment variables at startup
 * Fails fast if ALLOWED_ORIGINS not configured
 */

configSchema = Joi.object({
  ALLOWED_ORIGINS: Joi.string().required()
})

loadConfig = () => {
  const { error, value } = configSchema.validate(process.env)
  if (error) throw new Error(`Configuration failed: ${error}`)
  return value
}
```

**Why:**
- Prevents server starting with missing CORS config
- Clear error messages for operators
- Catch configuration issues early

#### 3. CORS Validation Middleware (`.middleware/corsValidator.js`)

```javascript
/**
 * corsValidator(req, res, next)
 * Optional middleware for CORS logging/validation
 * Only active in development
 */

corsValidator = (req, res, next) => {
  origin = req.get('origin')
  if (process.env.NODE_ENV === 'development' && origin) {
    console.debug(`[CORS] Request from: ${origin}`)
  }
  next()
}
```

**Why:**
- Debug CORS issues in development
- No performance impact in production
- Track which origins access API

#### 4. Server Integration (`server.js`)

```javascript
const { config, getCorsConfig } = require('./config')
const corsConfig = getCorsConfig(config)

// Apply CORS with restricted origins
app.use(cors(corsConfig))

// Enable CORS validation logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(corsValidator)
}
```

**Flow:**
1. Load config (fails if ALLOWED_ORIGINS missing)
2. Generate CORS options from config
3. Apply cors() middleware with options
4. Add validation middleware (dev only)
5. All routes now protected by CORS policy

## Request/Response Flow

### Preflight Request (OPTIONS)

```
Browser detects non-simple request
(custom headers, POST with JSON, etc.)

Step 1: Send Preflight
  OPTIONS /api/patterns
  Origin: http://localhost:3000
  Access-Control-Request-Method: POST
  Access-Control-Request-Headers: Content-Type, Authorization

Step 2: Server Processes
  → Check if origin in ALLOWED_ORIGINS
  → YES: Generate CORS response headers
  → NO: No CORS headers (browser blocks)

Step 3: Browser Receives Response
  Access-Control-Allow-Origin: http://localhost:3000
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Max-Age: 86400

Step 4: Actual Request
  POST /api/patterns (request allowed by browser)
```

### Simple Request (No Preflight)

```
GET request (no custom headers)

Step 1: Send Request
  GET /api/patterns
  Origin: http://localhost:3000

Step 2: Server Responds
  200 OK
  Access-Control-Allow-Origin: http://localhost:3000
  [JSON data]

Step 3: Browser Processes
  Origin header matches CORS response
  Allow JavaScript access to response
```

### Blocked Request

```
Cross-origin request from unauthorized origin

Step 1: Send Request
  GET /api/patterns
  Origin: http://evil.com

Step 2: Server Response
  200 OK
  (No Access-Control-Allow-Origin header)
  [JSON data]

Step 3: Browser Blocks
  Access-Control-Allow-Origin missing
  Console Error: "CORS policy blocked request"
  JavaScript cannot access response
```

## Configuration Architecture

### Environment Variable Structure

```
ALLOWED_ORIGINS
    ↓
Split by comma
    ↓
[
  "http://localhost:3000",
  "http://localhost:5173",
  "https://app.example.com"
]
    ↓
Passed to cors() middleware
    ↓
Checked on every request
```

### Joi Validation Schema

```
Environment Variables
         ↓
Joi Schema Validation
         ↓
  ✅ Valid (config loaded)
         ↓
  ❌ Invalid (error thrown, server fails)
         
Schema Checks:
- ALLOWED_ORIGINS is string ✓
- ALLOWED_ORIGINS is required ✓
- No extra validation needed
```

## Deployment Architecture

### Development Environment

```
Frontend: http://localhost:3000
Frontend Build Tool: http://localhost:5173
Backend: http://localhost:5000

.env:
  ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

Result:
  - Both frontends can access API
  - Easy switching between dev tools
```

### Production Environment

```
Frontend: https://app.example.com (Nginx)
Backend: https://api.example.com (Node.js)
(Behind load balancer)

.env.production:
  ALLOWED_ORIGINS=https://app.example.com

Result:
  - Only production frontend can access API
  - Strict origin enforcement
  - HTTPS required
```

### Docker/Kubernetes

```yaml
# ConfigMap for origins
apiVersion: v1
kind: ConfigMap
metadata:
  name: patternwise-config
data:
  allowed-origins: |
    https://app.example.com,
    https://admin.example.com

---
# Deployment uses ConfigMap
apiVersion: apps/v1
kind: Deployment
spec:
  containers:
  - env:
    - name: ALLOWED_ORIGINS
      valueFrom:
        configMapKeyRef:
          name: patternwise-config
          key: allowed-origins
```

## Security Considerations

### 1. Origin Validation Logic

```javascript
origin = req.get('origin')

// Allow requests with no origin
if (!origin) return callback(null, true)

// Check whitelist
if (allowedOrigins.includes(origin)) return callback(null, true)

// Reject non-whitelisted
return callback(new Error('CORS policy violation'))
```

**Security:**
- Empty origin = trusted (server-to-server, mobile)
- Exact match required = no wildcards
- Error callback = rejection without CORS headers

### 2. Credentials Management

```javascript
credentials: true  // Allow cookies/auth headers
```

**When enabled:**
- Origin MUST be specific (not `*`)
- Cookies sent with cross-origin requests
- Authorization headers allowed

**When disabled:**
- No cookies in cross-origin requests
- Lower security risk but less flexibility

### 3. HTTP Methods

```javascript
methods: [
  'GET',      // Read data
  'POST',     // Create data
  'PUT',      // Update data
  'DELETE',   // Delete data
  'OPTIONS',  // Preflight
  'PATCH'     // Partial update
]
```

**No:**
- WebSocket upgrade
- Connect method
- Trace method

## Monitoring & Observability

### Logs in Development

```
With corsValidator middleware:
[CORS] Request from origin: http://localhost:3000
[CORS] Request from origin: http://localhost:5173
[CORS] Request from origin: http://localhost:3000
```

### Logs in Production

```
Minimal logging (no corsValidator)
But can add custom logging:

```javascript
const express = require('express')
const cors = require('cors')

app.use(cors(corsConfig))
app.use((req, res, next) => {
  // Custom CORS logging
  console.info(`[CORS] Origin: ${req.get('origin')} Path: ${req.path}`)
  next()
})
```

### Metrics to Track

```
1. CORS Rejections
   - Rejected origins over time
   - Alert if spikes

2. Allowed Origins
   - Usage per origin
   - Health check per origin

3. Preflight Requests
   - How many preflight vs actual
   - Preflight cache effectiveness
```

## Testing Strategy

### Unit Tests

```javascript
describe('CORS Configuration', () => {
  test('should allow whitelisted origin', () => {
    const corsConfig = getCorsConfig({
      ALLOWED_ORIGINS: 'http://localhost:3000'
    })
    
    corsConfig.origin('http://localhost:3000', (err, allowed) => {
      expect(err).toBeNull()
      expect(allowed).toBe(true)
    })
  })
  
  test('should reject non-whitelisted origin', () => {
    const corsConfig = getCorsConfig({
      ALLOWED_ORIGINS: 'http://localhost:3000'
    })
    
    corsConfig.origin('http://evil.com', (err, allowed) => {
      expect(err).not.toBeNull()
      expect(allowed).toBeUndefined()
    })
  })
})
```

### Integration Tests

```javascript
describe('CORS Middleware', () => {
  test('preflight request from allowed origin succeeds', async () => {
    const response = await request(app)
      .options('/api/patterns')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET')
    
    expect(response.status).toBe(200)
    expect(response.headers['access-control-allow-origin'])
      .toBe('http://localhost:3000')
  })
  
  test('preflight request from disallowed origin rejected', async () => {
    const response = await request(app)
      .options('/api/patterns')
      .set('Origin', 'http://evil.com')
      .set('Access-Control-Request-Method', 'GET')
    
    expect(response.headers['access-control-allow-origin'])
      .toBeUndefined()
  })
})
```

## Performance Impact

### Preflight Caching

```javascript
maxAge: 86400  // 24 hours in seconds

Browser caches preflight response for 24 hours:
Request 1: OPTIONS (server checks)
Request 2-N: Skipped (cached preflight)

For APIs with many requests, this dramatically reduces overhead
```

### Minimal Overhead

```
Per Request:
1. Parse Origin header: <0.1ms
2. String comparison: <0.1ms
3. Total: <1ms per request
```

**Optimization:**
- Origin check is synchronous
- Whitelist lookup is O(n) where n = number of allowed origins
- For typical use (2-5 origins): <0.2ms

## Failure Modes

### Scenario 1: ALLOWED_ORIGINS Not Set

```
app.js startup
  ↓
loadConfig() called
  ↓
Joi validation fails
  ↓
throw Error('Configuration validation failed:
  ALLOWED_ORIGINS is required')
  ↓
Server terminates
```

**Result:** Safe - won't start without CORS config

### Scenario 2: Malformed ALLOWED_ORIGINS

```
ALLOWED_ORIGINS=http://localhost:3000,,,http://localhost:5173

Split by comma:
[
  'http://localhost:3000',  // ✓
  '',                        // ✓ (empty string ignored in check)
  '',                        // ✓
  'http://localhost:5173'   // ✓
]

Result: Both valid origins work (extra commas ignored)
```

### Scenario 3: Origin Missing

```
Request with no Origin header
  ↓
cors middleware checks
  ↓
if (!origin) return callback(null, true)
  ↓
Request allowed (trusted: mobile app, curl, server-to-server)
```

## Future Enhancements

### 1. Dynamic Origin List

```javascript
// Instead of static comma-separated list
async function getAllowedOrigins() {
  return await database.query('SELECT origin FROM allowed_origins')
}

// Reload on deployment without server restart
```

### 2. Origin Pattern Matching

```javascript
ALLOWED_ORIGINS=https://*.example.com,https://app.*.com

// Use regex for subdomains
```

### 3. Rate Limiting per Origin

```javascript
// Track requests per origin
// Apply rate limits per origin
// Prevent abuse from single origin
```

### 4. Request Signing

```javascript
// Add request signature to prevent tampering
// Verify signature server-side
```

### 5. API Key Origin Binding

```javascript
// Bind API keys to specific origins
// Enforce origin for API requests
```
