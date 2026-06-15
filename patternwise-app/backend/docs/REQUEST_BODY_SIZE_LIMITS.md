# Request Body Size Limits

## Overview

The PatternWise backend now uses **explicit, centralized request body size limits** to prevent memory exhaustion, DoS attacks, and service unavailability from oversized payloads. Size limits are validated at startup and enforced at both parsing and middleware layers.

## Problem Solved

Previously, request body size limits were not explicitly configured:
- Implicit Express defaults (100kb JSON) not documented or enforced
- No validation of limit configuration at startup
- No middleware-level size checking before parsing
- No error handling for oversized payloads
- Vulnerable to memory exhaustion attacks via large request bodies

## Solution Architecture

### Components

#### 1. **Request Body Parser Configuration** (`config/requestBodyParser.js`)
Centralized configuration for all request body parser limits with validation.

```javascript
const requestBodyLimits = {
  json: '10mb',           // JSON payload limit
  urlencoded: '10mb',     // URL-encoded payload limit
  raw: '5mb',             // Raw body limit
  text: '5mb',            // Text body limit
};
```

All limits configurable via environment variables:
- `REQUEST_BODY_JSON_LIMIT` - JSON payload limit (default: 10mb)
- `REQUEST_BODY_URLENCODED_LIMIT` - URL-encoded limit (default: 10mb)
- `REQUEST_BODY_RAW_LIMIT` - Raw body limit (default: 5mb)
- `REQUEST_BODY_TEXT_LIMIT` - Text body limit (default: 5mb)

#### 2. **Request Body Validator Middleware** (`middleware/requestBodyValidator.js`)
Pre-parsing validation and monitoring of request body sizes.

```javascript
const { requestBodyValidatorMiddleware } = require('../middleware/requestBodyValidator');

// Apply middleware
app.use(requestBodyValidatorMiddleware(config));
```

Features:
- Validates `Content-Length` header before parsing
- Logs request sizes in development mode
- Enforces size limits with proper error responses
- Human-readable size formatting (MB, GB, etc.)

#### 3. **Payload Too Large Error Handler** 
Catches Express parsing errors for oversized payloads.

```javascript
const { payloadTooLargeErrorHandler } = require('../middleware/requestBodyValidator');

// Apply after body parsing middleware
app.use(payloadTooLargeErrorHandler(config));
```

Returns proper 413 error responses with limit details.

#### 4. **Server Integration**
Server startup validates all limits and applies middleware stack.

```javascript
const { validateRequestBodyLimits } = require('./config/requestBodyParser');

// Validate at startup
validateRequestBodyLimits();
```

### Key Features

1. **Explicit Configuration**: All limits clearly defined and documented
2. **Startup Validation**: Size limits validated when server starts
3. **Multi-Layer Enforcement**: 
   - Header validation (pre-parsing)
   - Express parser limits
   - Error handling middleware
4. **Environment Configuration**: Override limits via environment variables
5. **Development Logging**: Optional logging of all request sizes
6. **Human-Readable Format**: Bytes converted to MB/GB for clarity
7. **Security**: Prevents DoS attacks via oversized payloads

## Default Size Limits

| Content Type | Default Limit | Use Case |
|-------------|---------------|----------|
| JSON | 10 MB | API request bodies |
| URL-Encoded | 10 MB | Form submissions |
| Raw | 5 MB | File uploads, binary data |
| Text | 5 MB | Plain text payloads |

## Configuration

### Using Environment Variables

```bash
# Set custom limits
export REQUEST_BODY_JSON_LIMIT=20mb
export REQUEST_BODY_URLENCODED_LIMIT=15mb
export REQUEST_BODY_RAW_LIMIT=25mb
export REQUEST_BODY_TEXT_LIMIT=10mb

# Start server
npm start
```

### Checking Current Limits

```javascript
const { getRequestBodyLimitsInfo } = require('./middleware/requestBodyValidator');

const info = getRequestBodyLimitsInfo();
console.log(info);
// Output:
// {
//   json: { limit: '10mb', bytes: 10485760, formatted: '10 MB' },
//   urlencoded: { limit: '10mb', bytes: 10485760, formatted: '10 MB' },
//   raw: { limit: '5mb', bytes: 5242880, formatted: '5 MB' },
//   text: { limit: '5mb', bytes: 5242880, formatted: '5 MB' }
// }
```

## API Response Format

### Oversized Request (413 Payload Too Large)

```json
{
  "status": "error",
  "statusCode": 413,
  "statusText": "Payload Too Large",
  "message": "Request body too large. Max allowed: 10 MB",
  "errorCode": "REQUEST_BODY_TOO_LARGE",
  "details": {
    "contentLength": "25 MB",
    "limit": "10 MB",
    "contentType": "application/json"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Development Logging

In development mode (`NODE_ENV=development`), request sizes are logged:

```
[REQUEST] POST /api/patterns - Size: 512 KB, Type: application/json
[REQUEST] PUT /api/patterns/123 - Size: 256 KB, Type: application/json
[REQUEST] GET /api/patterns - Size: 0 B, Type: (none)
```

## Security Considerations

### DoS Prevention

Large request body limits prevent memory exhaustion attacks:
- Attacker sends multiple huge requests
- Without limits, server memory fills quickly
- Service becomes unavailable
- With limits, oversized requests rejected early

### Recommended Limits

Based on typical API usage:

```javascript
// Conservative (strict)
JSON: 1 MB      // For simple CRUD operations
URL-Encoded: 1 MB

// Moderate (default)
JSON: 10 MB     // Allows bulk operations, file metadata
URL-Encoded: 10 MB

// Permissive (avoid)
JSON: 50 MB+    // Increases DoS risk
URL-Encoded: 50 MB+
```

## Testing

### Test Oversized Request

```bash
# Create 15MB test file
dd if=/dev/zero bs=1M count=15 of=test.json

# Send oversized request
curl -X POST http://localhost:5000/api/patterns \
  -H "Content-Type: application/json" \
  -d @test.json

# Response (413):
# {
#   "status": "error",
#   "statusCode": 413,
#   "statusText": "Payload Too Large",
#   "message": "Request body too large. Max allowed: 10 MB",
#   "errorCode": "REQUEST_BODY_TOO_LARGE"
# }
```

### Test Within Limit

```bash
# Create 5MB test file (within 10MB limit)
dd if=/dev/zero bs=1M count=5 of=test.json

# Send request
curl -X POST http://localhost:5000/api/patterns \
  -H "Content-Type: application/json" \
  -d @test.json

# Response (200 or 400 depending on validation)
```

### Using Node.js

```javascript
const axios = require('axios');

// Test oversized payload
const largePayload = 'x'.repeat(15 * 1024 * 1024); // 15MB

try {
  const response = await axios.post('http://localhost:5000/api/patterns', {
    data: largePayload
  });
} catch (error) {
  if (error.response && error.response.status === 413) {
    console.log('Request rejected: Payload too large');
    console.log(error.response.data);
  }
}
```

## Troubleshooting

### Problem: Legitimate requests rejected as too large

**Solution**:
1. Check actual request size: `Content-Length` header
2. Increase limit for that content type
3. Set via environment variable:
   ```bash
   export REQUEST_BODY_JSON_LIMIT=20mb
   npm start
   ```
4. Or modify `config/requestBodyParser.js` defaults

### Problem: Startup error "Invalid limit format"

**Cause**: Incorrectly formatted limit string

**Solution**:
1. Check environment variables
2. Use valid format: `10mb`, `5kb`, `1gb`
3. Numbers followed by optional `k`/`m`/`g` suffix
4. Case-insensitive

### Problem: Request hangs or times out

**Cause**: Client sending payload but limit check hanging

**Solution**:
1. Ensure validator middleware applied first
2. Check middleware order in `server.js`
3. Verify Content-Length header sent by client

## Monitoring

### Log Request Sizes (Development)

Enable in `.env`:
```bash
NODE_ENV=development
```

All requests logged with sizes:
```
[REQUEST] POST /api/patterns - Size: 2.5 MB, Type: application/json
[REQUEST] GET /api/patterns - Size: 0 B, Type: (none)
[REQUEST] PUT /api/patterns/123 - Size: 512 KB, Type: application/json
```

### Production Monitoring

In production, use application logging:

```javascript
// Log all rejected requests
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    logger.warn('Oversized request rejected', {
      method: req.method,
      path: req.path,
      contentLength: req.get('content-length'),
      ip: req.ip,
    });
  }
  next(err);
});
```

## Best Practices

### 1. Set Appropriate Limits

```javascript
// Development: More permissive
JSON: 50mb
URL-Encoded: 50mb

// Production: More restrictive
JSON: 10mb
URL-Encoded: 10mb
```

### 2. Monitor and Alert

Set up alerts for:
- Requests approaching limits (> 80% of limit)
- Requests rejected due to size
- Unusual traffic patterns

### 3. Document Limits

Include in API documentation:
```
## Request Size Limits

- JSON payload: 10 MB maximum
- URL-encoded: 10 MB maximum
- Raw body: 5 MB maximum

Larger requests will be rejected with 413 Payload Too Large
```

### 4. Graceful Error Handling

Always catch and handle 413 errors in clients:

```javascript
try {
  const response = await fetch('/api/patterns', {
    method: 'POST',
    body: JSON.stringify(largeData)
  });
} catch (error) {
  if (error.status === 413) {
    showError('Request too large. Please split into smaller chunks.');
  }
}
```

## See Also

- [HTTP Status Code Semantics](./HTTP_STATUS_CODE_SEMANTICS.md)
- [Security Implementation Guide](./SECURITY_IMPLEMENTATION_GUIDE.md)
- [Response Contracts](./RESPONSE_CONTRACTS.md)
- Express.json() documentation: https://expressjs.com/en/api/express.json.html
