# HTTP Status Code Semantics

## Overview

The PatternWise backend now uses **centralized, semantic HTTP status code mapping** to ensure consistent and correct HTTP status codes across all API responses. This eliminates ad-hoc status code decisions distributed throughout the codebase.

## Problem Solved

Previously, HTTP status codes were assigned inconsistently:
- Different controllers using different codes for similar errors
- No validation that status codes were valid HTTP codes
- Logic for mapping application errors to HTTP status scattered across handlers
- Difficult to maintain and audit status code correctness

## Solution Architecture

### Components

#### 1. **HTTP Status Code Mapping** (`config/httpStatusMap.js`)
Centralized mapping of application error codes to HTTP status codes with startup validation.

```javascript
const errorCodeToStatusMap = {
  // Success codes
  SUCCESS: 200,
  CREATED: 201,
  
  // Client errors
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  
  // Application-specific errors
  PATTERN_NOT_FOUND: 404,
  EXTERNAL_API_FAILURE: 503,
  RATE_LIMIT_EXCEEDED: 429,
};
```

#### 2. **Response Formatter** (`utils/responseFormatter.js`)
Standardized response formatting using the centralized HTTP status mapping.

```javascript
const { formatSuccess, formatError } = require('../utils/responseFormatter');

// Format success response
const response = formatSuccess(data, 'SUCCESS');
res.status(response.statusCode).json(response);

// Format error response
const response = formatError(
  'Pattern not found',
  'PATTERN_NOT_FOUND',
  null,
  { patternId: id }
);
res.status(response.statusCode).json(response);
```

#### 3. **Controllers** (Updated)
All controllers now use the centralized response formatter and error code mapping.

```javascript
exports.getPatternDetails = async (req, res) => {
  const { id } = req.params;
  const pattern = patterns.find(p => p.id === id);
  
  if (!pattern) {
    const response = formatError(
      'Pattern not found',
      'PATTERN_NOT_FOUND',
      null,
      { patternId: id }
    );
    return res.status(response.statusCode).json(response);
  }
  // ...
};
```

### Key Features

1. **Centralized Mapping**: Single source of truth for error-to-status mapping
2. **Startup Validation**: HTTP status code mapping validated at server startup
3. **Semantic HTTP Codes**: Follows HTTP specification for status code semantics
4. **Extensible**: Easy to add new application error codes
5. **Type-Safe**: Error codes are defined in one place, preventing typos
6. **Audit-Friendly**: All status code decisions can be reviewed in one file

## HTTP Status Code Reference

### 2xx Success Codes
- `200 OK` - Successful GET request (default)
- `201 Created` - Resource created successfully
- `202 Accepted` - Request accepted for processing
- `204 No Content` - Success with no response body

### 4xx Client Error Codes
- `400 Bad Request` - Invalid request body or parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Authenticated but insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists or conflict detected
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded

### 5xx Server Error Codes
- `500 Internal Server Error` - Server error (default)
- `503 Service Unavailable` - External API unavailable

## API Response Format

All API responses now follow a standardized format with semantic HTTP status codes:

### Success Response
```json
{
  "status": "success",
  "statusCode": 200,
  "statusText": "OK",
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "status": "error",
  "statusCode": 404,
  "statusText": "Not Found",
  "message": "Pattern not found",
  "errorCode": "PATTERN_NOT_FOUND",
  "details": {
    "patternId": "pattern-123"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Validation Error Response
```json
{
  "status": "error",
  "statusCode": 422,
  "statusText": "Unprocessable Entity",
  "message": "Validation failed",
  "errorCode": "VALIDATION_FAILED",
  "errors": {
    "title": "Title is required",
    "pattern": "Pattern must be an array"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Adding New Error Codes

To add a new application error code:

1. **Define in mapping** (`config/httpStatusMap.js`):
```javascript
const errorCodeToStatusMap = {
  // ... existing codes
  PERMISSION_DENIED: 403,
  QUOTA_EXCEEDED: 429,
};
```

2. **Use in controller** (updated automatically at startup validation):
```javascript
const response = formatError(
  'Quota exceeded',
  'QUOTA_EXCEEDED'
);
res.status(response.statusCode).json(response);
```

3. **Mapping validated automatically** at server startup

## Benefits

1. **Consistency**: All endpoints use the same HTTP status semantics
2. **Correctness**: Ensures valid HTTP status codes according to spec
3. **Maintainability**: Centralized mapping easy to review and audit
4. **Documentation**: Self-documenting mapping file serves as API reference
5. **Extensibility**: Adding new error codes is simple and safe
6. **Validation**: Startup validation catches configuration errors early

## Migration Guide

For existing endpoints using manual status codes:

### Before
```javascript
if (!resource) {
  return res.status(404).json({ error: 'Not found' });
}
```

### After
```javascript
if (!resource) {
  const response = formatError(
    'Resource not found',
    'RESOURCE_NOT_FOUND'
  );
  return res.status(response.statusCode).json(response);
}
```

## Testing

HTTP status codes are validated at startup:

```bash
npm start
# [STARTUP] HTTP Status Code Mapping validated successfully
```

To verify status codes in responses:

```bash
curl -i http://localhost:5000/api/patterns/nonexistent
# HTTP/1.1 404 Not Found
# Content-Type: application/json
# {
#   "status": "error",
#   "statusCode": 404,
#   "statusText": "Not Found",
#   "message": "Pattern not found",
#   "errorCode": "PATTERN_NOT_FOUND"
# }
```

## Troubleshooting

### Startup Error: "HTTP Status Code Mapping validation failed"
**Cause**: Invalid HTTP status code in `errorCodeToStatusMap`

**Solution**: 
1. Check `config/httpStatusMap.js`
2. Verify all status codes are valid HTTP codes (100-599)
3. Use `http.STATUS_CODES` as reference

### Incorrect Status Code in Response
**Cause**: Error code not in mapping or manual status code used

**Solution**:
1. Check error code exists in `errorCodeToStatusMap`
2. Use `formatError()` or `formatSuccess()` from responseFormatter
3. Don't manually set status codes with response formatter utilities

## See Also

- [Response Contracts Documentation](./RESPONSE_CONTRACTS.md)
- [API Specification](./API_SPEC.md)
- [Error Handling Guide](./ERROR_HANDLING.md)
- HTTP Status Code Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
