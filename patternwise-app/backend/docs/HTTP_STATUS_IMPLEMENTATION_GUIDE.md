# HTTP Status Code Implementation Guide

## Quick Start

### 1. Import Response Formatter in Controllers

```javascript
const { formatSuccess, formatError, formatValidationError } = require('../utils/responseFormatter');
const { getHttpStatusCode } = require('../config/httpStatusMap');
```

### 2. Format Success Responses

```javascript
// Basic success response (default 200 OK)
const response = formatSuccess(data);
res.status(response.statusCode).json(response);

// Success with custom error code
const response = formatSuccess(data, 'CREATED', 201);
res.status(response.statusCode).json(response);
```

### 3. Format Error Responses

```javascript
// Basic error response
const response = formatError('Resource not found', 'NOT_FOUND');
res.status(response.statusCode).json(response);

// Error with details
const response = formatError(
  'Pattern not found',
  'PATTERN_NOT_FOUND',
  null,
  { patternId: id }
);
res.status(response.statusCode).json(response);
```

### 4. Format Validation Errors

```javascript
const response = formatValidationError({
  title: 'Title is required',
  description: 'Description must be at least 10 characters'
});
res.status(response.statusCode).json(response);
```

## Common Use Cases

### Case 1: Resource Not Found

```javascript
exports.getUser = (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  
  if (!user) {
    const response = formatError(
      'User not found',
      'NOT_FOUND',
      null,
      { userId: id }
    );
    return res.status(response.statusCode).json(response);
  }
  
  const response = formatSuccess(user);
  res.status(response.statusCode).json(response);
};
```

### Case 2: Validation Error

```javascript
exports.createPattern = (req, res) => {
  const { title, description } = req.body;
  
  const errors = {};
  if (!title) errors.title = 'Title is required';
  if (!description) errors.description = 'Description is required';
  
  if (Object.keys(errors).length > 0) {
    const response = formatValidationError(errors);
    return res.status(response.statusCode).json(response);
  }
  
  // Create pattern...
  const response = formatSuccess(newPattern, 'CREATED');
  res.status(response.statusCode).json(response);
};
```

### Case 3: External API Failure

```javascript
exports.getPatternDetails = async (req, res) => {
  const { id } = req.params;
  const pattern = patterns.find(p => p.id === id);
  
  if (!pattern) {
    const response = formatError(
      'Pattern not found',
      'PATTERN_NOT_FOUND'
    );
    return res.status(response.statusCode).json(response);
  }

  try {
    const details = await fetchExternalAPI(pattern.id);
    const response = formatSuccess({ ...pattern, ...details });
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = formatError(
      'Failed to fetch pattern details',
      'EXTERNAL_API_FAILURE',
      null,
      { error: err.message }
    );
    res.status(response.statusCode).json(response);
  }
};
```

### Case 4: Rate Limit Exceeded

```javascript
exports.rateLimitedEndpoint = (req, res) => {
  if (isRateLimited(req.ip)) {
    const response = formatError(
      'Too many requests',
      'RATE_LIMIT_EXCEEDED'
    );
    return res.status(response.statusCode).json(response);
  }
  
  // Process request...
};
```

### Case 5: Unauthorized Access

```javascript
exports.protectedEndpoint = (req, res) => {
  if (!req.user) {
    const response = formatError(
      'Authentication required',
      'AUTHENTICATION_REQUIRED'
    );
    return res.status(response.statusCode).json(response);
  }
  
  if (!hasPermission(req.user, 'admin')) {
    const response = formatError(
      'Insufficient permissions',
      'INSUFFICIENT_PERMISSIONS'
    );
    return res.status(response.statusCode).json(response);
  }
  
  // Process request...
};
```

## Error Code Reference

### Standard HTTP Error Codes

| Error Code | HTTP Status | Use Case |
|-----------|------------|----------|
| SUCCESS | 200 | Successful GET/POST request |
| CREATED | 201 | Resource successfully created |
| BAD_REQUEST | 400 | Invalid request body or parameters |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Authenticated but no permission |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| VALIDATION_FAILED | 422 | Input validation failed |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_SERVER_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | External service down |

### Application-Specific Error Codes

| Error Code | HTTP Status | Use Case |
|-----------|------------|----------|
| PATTERN_NOT_FOUND | 404 | Pattern ID not found |
| INVALID_PATTERN_ID | 400 | Pattern ID format invalid |
| EXTERNAL_API_FAILURE | 503 | LeetCode API unavailable |
| CIRCUIT_BREAKER_OPEN | 503 | Circuit breaker protection |
| CORS_VIOLATION | 403 | CORS origin not allowed |
| AUTHENTICATION_REQUIRED | 401 | User not authenticated |
| INSUFFICIENT_PERMISSIONS | 403 | User lacks permissions |
| DATABASE_ERROR | 500 | Database operation failed |
| CONFIGURATION_ERROR | 500 | Configuration issue |

## Adding Custom Error Codes

### Step 1: Add to Mapping

Edit `config/httpStatusMap.js`:

```javascript
const errorCodeToStatusMap = {
  // ... existing codes
  CUSTOM_ERROR: 400,  // or appropriate HTTP status
  ANOTHER_ERROR: 503,
};
```

### Step 2: Use in Controller

```javascript
const response = formatError(
  'Custom error occurred',
  'CUSTOM_ERROR',
  null,
  { details: 'Additional context' }
);
res.status(response.statusCode).json(response);
```

### Step 3: Restart Server (Validation Runs Automatically)

```bash
npm start
# [STARTUP] HTTP Status Code Mapping validated successfully
```

## Best Practices

### 1. Always Use Application Error Codes
❌ Don't:
```javascript
res.status(404).json({ error: 'Not found' });
```

✅ Do:
```javascript
const response = formatError('Pattern not found', 'PATTERN_NOT_FOUND');
res.status(response.statusCode).json(response);
```

### 2. Include Relevant Details
❌ Don't:
```javascript
const response = formatError('Not found', 'NOT_FOUND');
```

✅ Do:
```javascript
const response = formatError(
  'Pattern not found',
  'PATTERN_NOT_FOUND',
  null,
  { patternId: id, searchPath: 'patterns.json' }
);
```

### 3. Use Correct Error Code
❌ Don't:
```javascript
if (validationError) {
  res.status(500).json({ error: 'Invalid input' });
}
```

✅ Do:
```javascript
if (validationError) {
  const response = formatValidationError(validationError);
  res.status(response.statusCode).json(response);
}
```

### 4. Validate at Startup
The server automatically validates HTTP status mapping at startup:

```
[STARTUP] HTTP Status Code Mapping validated successfully
```

If validation fails, server exits with error details.

## Testing HTTP Status Codes

### Using cURL

```bash
# Success (200)
curl -i http://localhost:5000/api/patterns

# Not Found (404)
curl -i http://localhost:5000/api/patterns/invalid-id

# Bad Request (400)
curl -i -X POST http://localhost:5000/api/patterns -d '{}' \
  -H "Content-Type: application/json"

# Server Error (500)
curl -i http://localhost:5000/api/patterns/error-trigger
```

### Using Node.js/Fetch

```javascript
const response = await fetch('http://localhost:5000/api/patterns/not-found');
console.log(response.status); // 404
console.log(response.headers.get('content-type')); // application/json
const data = await response.json();
console.log(data.statusCode); // 404
console.log(data.errorCode); // PATTERN_NOT_FOUND
```

### Using Postman

1. Create request to endpoint
2. Send request
3. Check response status in status bar
4. Inspect response body for statusCode and errorCode fields
5. Verify they match expected values

## Debugging

### Check Status Code Mapping

```javascript
const { getHttpStatusCode, isValidErrorCode } = require('./config/httpStatusMap');

// Check if error code exists
console.log(isValidErrorCode('PATTERN_NOT_FOUND')); // true

// Get HTTP status for error code
console.log(getHttpStatusCode('PATTERN_NOT_FOUND')); // 404
```

### Enable Response Logging

In middleware or controller:

```javascript
const response = formatError(message, errorCode);
console.log('Response Status:', response.statusCode);
console.log('Response Error Code:', response.errorCode);
res.status(response.statusCode).json(response);
```

### Verify at Startup

```bash
npm start | grep "HTTP Status Code Mapping"
```

If validation passes, you'll see:
```
[STARTUP] HTTP Status Code Mapping validated successfully
```

## Troubleshooting

### Problem: "Error code not found in mapping"
**Solution**: Add error code to `config/httpStatusMap.js`

### Problem: Invalid HTTP status code
**Solution**: Use valid HTTP codes (100-599), check `http.STATUS_CODES`

### Problem: Status code not matching response
**Solution**: Ensure using `formatError()`, `formatSuccess()` functions

### Problem: Validation fails at startup
**Check**:
1. All status codes in mapping are valid (100-599)
2. No typos in error code names
3. Proper module exports

**Fix**:
1. Review error in startup output
2. Fix `config/httpStatusMap.js`
3. Restart server

## See Also

- [HTTP Status Code Semantics](./HTTP_STATUS_CODE_SEMANTICS.md)
- [Response Contracts](./RESPONSE_CONTRACTS.md)
- [Error Handling](./ERROR_HANDLING.md)
- [API Specification](./API_SPEC.md)
