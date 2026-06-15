# Request Body Size Limits Implementation Guide

## Quick Start

### 1. Default Configuration

The server comes with default limits already configured:

```javascript
// In config/requestBodyParser.js
const requestBodyLimits = {
  json: '10mb',
  urlencoded: '10mb',
  raw: '5mb',
  text: '5mb',
};
```

### 2. Server Integration

Middleware automatically applied in `server.js`:

```javascript
// Validation at startup
validateRequestBodyLimits();

// Apply validator middleware
app.use(requestBodyValidatorMiddleware(config));

// Configure body parsers
app.use(express.json(getJsonParserConfig()));
app.use(express.urlencoded(getUrlEncodedParserConfig()));

// Error handler for oversized payloads
app.use(payloadTooLargeErrorHandler(config));
```

### 3. Override via Environment Variables

```bash
# Set custom limits
export REQUEST_BODY_JSON_LIMIT=20mb
export REQUEST_BODY_URLENCODED_LIMIT=20mb

npm start
```

## Common Scenarios

### Scenario 1: Accept Large JSON Payloads

**Problem**: Need to accept 25MB JSON requests for bulk operations

**Solution**:

```bash
# Set environment variable
export REQUEST_BODY_JSON_LIMIT=25mb

npm start
```

**Verification**:

```bash
# Check logs show new limit validated
npm start | grep "Request Body Size Limits"
# Output: [STARTUP] Request Body Size Limits validated successfully
```

### Scenario 2: Restrict URL-Encoded Forms

**Problem**: Forms should be limited to 5MB to prevent abuse

**Solution**:

```bash
export REQUEST_BODY_URLENCODED_LIMIT=5mb
npm start
```

### Scenario 3: Different Limits Per Environment

**Development `.env.development`**:
```bash
NODE_ENV=development
REQUEST_BODY_JSON_LIMIT=50mb
REQUEST_BODY_URLENCODED_LIMIT=50mb
```

**Production `.env.production`**:
```bash
NODE_ENV=production
REQUEST_BODY_JSON_LIMIT=10mb
REQUEST_BODY_URLENCODED_LIMIT=10mb
```

### Scenario 4: Monitor Request Sizes

Enable development logging to see all request sizes:

```bash
export NODE_ENV=development
npm start
```

Output:
```
[REQUEST] POST /api/patterns - Size: 2.5 MB, Type: application/json
[REQUEST] PUT /api/patterns/123 - Size: 512 KB, Type: application/json
```

## Handling Oversized Requests

### Client-Side (JavaScript)

```javascript
async function sendLargeData(data) {
  try {
    const response = await fetch('/api/patterns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.status === 413) {
      const error = await response.json();
      throw new Error(`Payload too large: ${error.details.limit}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}
```

### Client-Side (Node.js/Axios)

```javascript
const axios = require('axios');

async function sendLargeData(data) {
  try {
    const response = await axios.post('/api/patterns', data);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 413) {
      const limit = error.response.data.details.limit;
      console.error(`Request too large. Maximum: ${limit}`);
      
      // Strategy 1: Split into chunks
      return sendInChunks(data);
      
      // Strategy 2: Compress data
      return sendCompressed(data);
    }
    throw error;
  }
}
```

### Strategy: Split Large Payloads

```javascript
async function sendInChunks(data, chunkSize = 1000) {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  const results = [];
  for (const chunk of chunks) {
    const response = await fetch('/api/patterns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk)
    });
    results.push(await response.json());
  }
  
  return results;
}
```

### Strategy: Compress Data

```javascript
const zlib = require('zlib');

async function sendCompressed(data) {
  const json = JSON.stringify(data);
  const compressed = zlib.gzipSync(json);
  
  const response = await fetch('/api/patterns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip'
    },
    body: compressed
  });
  
  return await response.json();
}
```

## Testing Request Body Limits

### Using cURL

```bash
# Test 1: Request within limit (10MB JSON)
# Create 5MB test file
dd if=/dev/zero bs=1M count=5 of=test.json

curl -X POST http://localhost:5000/api/patterns \
  -H "Content-Type: application/json" \
  -d @test.json

# Response: 200 or 400 (validation error)


# Test 2: Request exceeds limit (15MB > 10MB limit)
dd if=/dev/zero bs=1M count=15 of=test-large.json

curl -X POST http://localhost:5000/api/patterns \
  -H "Content-Type: application/json" \
  -d @test-large.json

# Response: 413 Payload Too Large
# {
#   "status": "error",
#   "statusCode": 413,
#   "statusText": "Payload Too Large",
#   "message": "Request body too large. Max allowed: 10 MB",
#   "errorCode": "REQUEST_BODY_TOO_LARGE",
#   "details": {
#     "contentLength": "15 MB",
#     "limit": "10 MB",
#     "contentType": "application/json"
#   }
# }
```

### Using Node.js

```javascript
const http = require('http');

function testPayloadSize(payload, label) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/patterns',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`${label}: Status ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const response = JSON.parse(data);
      console.log(`${label}: ${response.message}`);
      if (response.details) {
        console.log(`${label}: Size=${response.details.contentLength}, Limit=${response.details.limit}`);
      }
    });
  });

  req.write(payload);
  req.end();
}

// Test 1MB request (within 10MB limit)
testPayloadSize('x'.repeat(1024 * 1024), 'Test 1MB');

// Test 15MB request (exceeds 10MB limit)
testPayloadSize('x'.repeat(15 * 1024 * 1024), 'Test 15MB');
```

### Using Postman

1. Create new POST request to `http://localhost:5000/api/patterns`
2. Go to Body tab
3. Select "raw" and "JSON"
4. Paste large JSON (or use test file)
5. Click Send
6. Check status code:
   - 413 = Oversized
   - 200/400 = Within limit

## Debugging

### Check Current Limits

```bash
# Via Node.js
node -e "
const { getRequestBodyLimitsInfo } = require('./patternwise-app/backend/middleware/requestBodyValidator');
console.log(JSON.stringify(getRequestBodyLimitsInfo(), null, 2));
"

# Output:
# {
#   "json": {
#     "limit": "10mb",
#     "bytes": 10485760,
#     "formatted": "10 MB"
#   },
#   ...
# }
```

### Verify Startup Validation

```bash
npm start 2>&1 | grep "Request Body"
# Output: [STARTUP] Request Body Size Limits validated successfully
```

### Enable Request Logging

```bash
export NODE_ENV=development
npm start
```

Watch logs for request sizes.

## Configuration Options

### Maximum Recommended Sizes

| Content Type | Small | Medium | Large |
|-------------|-------|--------|-------|
| JSON | 1 MB | 10 MB | 50 MB |
| URL-Encoded | 1 MB | 10 MB | 50 MB |
| Raw/Binary | 5 MB | 25 MB | 100 MB |

### Environment Variable Format

Valid formats for size limits:

```bash
# All valid
REQUEST_BODY_JSON_LIMIT=1b      # 1 byte
REQUEST_BODY_JSON_LIMIT=10kb    # 10 kilobytes
REQUEST_BODY_JSON_LIMIT=5mb     # 5 megabytes
REQUEST_BODY_JSON_LIMIT=1gb     # 1 gigabyte

# Case-insensitive
REQUEST_BODY_JSON_LIMIT=10MB    # Works
REQUEST_BODY_JSON_LIMIT=10Mb    # Works
REQUEST_BODY_JSON_LIMIT=10mB    # Works
```

Invalid formats (will throw error at startup):
```bash
REQUEST_BODY_JSON_LIMIT=10       # Missing unit
REQUEST_BODY_JSON_LIMIT=mb10     # Wrong order
REQUEST_BODY_JSON_LIMIT=10 mb    # Spaces not allowed
```

## Monitoring & Alerting

### Log Oversized Requests

Add to your monitoring:

```javascript
// In middleware or error handler
if (err.type === 'entity.too.large') {
  logger.warn('Oversized request rejected', {
    method: req.method,
    path: req.path,
    contentLength: req.get('content-length'),
    clientIp: req.ip,
    timestamp: new Date().toISOString()
  });
}
```

### Set Alerts

Alert when:
- 413 errors occur more than N times per minute
- Average request size > 80% of limit
- Specific clients repeatedly sending oversized requests

## Performance Considerations

### Memory Usage

Request body sizes affect server memory:
- 10MB limit per request
- With concurrent connections, multiply by connection count
- Example: 100 concurrent requests × 10MB = 1GB memory peak

### CPU Usage

Validation adds minimal overhead:
- Content-Length header check: < 1ms
- Size comparison: < 1ms
- Total: < 2ms per request

### Bandwidth Usage

Larger limits allow larger transfers but increase bandwidth:
- Typical pattern data: 100KB - 1MB
- Bulk operations: 5MB - 20MB
- Large uploads: 50MB+

## Best Practices

### 1. Set Conservative Defaults

```javascript
// Default to minimal required sizes
JSON: 5mb       // Typical CRUD operations
URL-Encoded: 5mb
```

### 2. Document Limits in API

```markdown
## API Limits

- **Maximum JSON Payload**: 10 MB
- **Maximum URL-Encoded Payload**: 10 MB
- **Request Timeout**: 30 seconds

Larger requests will receive HTTP 413 (Payload Too Large) response.
```

### 3. Provide Clear Error Messages

Responses include:
- Actual size received
- Maximum allowed size
- Content type
- Suggestion to split or compress

### 4. Monitor and Adjust

Track request sizes over time:
- If most requests < 1MB, reduce limit to 2MB
- If many requests near limit, increase to prevent rejections
- Balance security vs. functionality

## See Also

- [HTTP Status Code Semantics](./HTTP_STATUS_CODE_SEMANTICS.md)
- [Security Implementation Guide](./SECURITY_IMPLEMENTATION_GUIDE.md)
- [Request Body Size Limits Reference](./REQUEST_BODY_SIZE_LIMITS.md)
- Express.json() API: https://expressjs.com/en/api/express.json.html
