# Response Contracts Implementation

## Overview

This document describes the implementation of explicit response contracts for the PatternWise API. All API responses now follow a standardized envelope format ensuring consistency, predictability, and easier integration.

## Changes Made

### 1. **Response Schema Validation** (`schemas/responseSchemas.js`)
- Defined Joi schemas for all response types
- Problem schema: validates LeetCode problem data structure
- Pattern schema: validates DSA pattern with problems
- Success envelope: enforces `status: 'success'` with data and metadata
- Error envelope: enforces `status: 'error'` with error codes and details

### 2. **Response Formatter Utility** (`utils/responseFormatter.js`)
- `formatSuccess(data)`: Creates standardized success responses
- `formatError(code, message, details)`: Creates standardized error responses
- `ErrorCodes` enum: Predefined error codes for consistency
- `API_VERSION`: Semantic versioning in all responses

### 3. **Response Validation Middleware** (`middleware/responseValidator.js`)
- Intercepts all responses before sending
- Validates against defined schemas in development mode
- Logs schema violations for debugging
- Does not alter responses (validation only)

### 4. **Updated Pattern Controller** (`controllers/patternController.js`)
- `getPatterns()`: Returns success envelope with all patterns
- `getPatternDetails()`: Implements comprehensive error handling
  - Pattern ID validation
  - Uses `Promise.allSettled()` for graceful failure handling
  - Returns partial data with error details if some problems fail
  - Standardized error responses with error codes

### 5. **Updated Server** (`server.js`)
- Integrated response validation middleware
- Ensures all responses go through validation

### 6. **API Documentation** (`docs/API_SPEC.md`)
- Complete API specification with response examples
- Error codes reference
- Data model definitions
- HTTP status code mappings

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": {...},
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `PATTERN_NOT_FOUND` | 404 | Pattern ID not found |
| `LEETCODE_FETCH_FAILED` | 500 | LeetCode API call failed |
| `PARTIAL_DATA_FAILURE` | 200 | Pattern returned but some problems failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `INVALID_PATTERN_ID` | 400 | Invalid pattern ID |

## Benefits

1. **Type Safety**: Frontend developers can write TypeScript/JSDoc with confidence
2. **Consistency**: All responses follow predictable structure
3. **Error Handling**: Clear error codes and details enable proper client-side handling
4. **Debugging**: Structured error responses make troubleshooting easier
5. **Documentation**: Explicit contracts serve as living documentation
6. **Versioning**: `version` field enables graceful API evolution
7. **Timestamps**: `timestamp` field enables request tracking and debugging
8. **Graceful Degradation**: Partial data failures still return data with error details

## Usage Examples

### Fetch All Patterns
```javascript
const response = await fetch('/api/patterns');
const { status, data, meta } = await response.json();

if (status === 'success') {
  console.log(`Got ${data.length} patterns`);
  console.log(`API version: ${meta.version}`);
}
```

### Fetch Specific Pattern
```javascript
const response = await fetch('/api/patterns/sliding-window');
const { status, data, error, meta } = await response.json();

if (status === 'error') {
  if (error.code === 'PATTERN_NOT_FOUND') {
    console.log('Pattern does not exist');
  } else if (error.code === 'PARTIAL_DATA_FAILURE') {
    console.log('Pattern loaded but some problems failed:', error.details.failedProblems);
    console.log('Partial data:', data); // Can still use partial data
  }
} else if (status === 'success') {
  console.log('Pattern:', data);
}
```

## Migration Guide

### For Frontend Developers
**Before:**
```javascript
const pattern = await fetch('/api/patterns/sliding-window').then(r => r.json());
console.log(pattern.name); // Worked if API was healthy
```

**After:**
```javascript
const { status, data, error } = await fetch('/api/patterns/sliding-window').then(r => r.json());
if (status === 'success') {
  console.log(data.name); // Guaranteed to exist
} else {
  console.error(`Error: ${error.code} - ${error.message}`);
}
```

### For API Consumers
All responses now include:
- Explicit status field (`success` or `error`)
- Response envelope with metadata
- Structured error information
- API version tracking
- Request timestamp

## Schema Validation

In development mode (`NODE_ENV === 'development'`), all responses are validated against their schemas. Violations are logged but don't affect the response.

Enable development mode for local testing:
```bash
NODE_ENV=development npm start
```

## Testing Response Contracts

```bash
# Test successful pattern list
curl http://localhost:5000/api/patterns

# Test successful pattern details
curl http://localhost:5000/api/patterns/sliding-window

# Test 404 error
curl http://localhost:5000/api/patterns/non-existent

# Test 400 error (invalid ID)
curl http://localhost:5000/api/patterns/
```

## Future Enhancements

1. **OpenAPI/Swagger**: Auto-generate OpenAPI spec from schemas
2. **Response Caching**: Cache responses based on version compatibility
3. **Error Tracking**: Send error codes to monitoring service
4. **API Versioning**: Support `/api/v1/`, `/api/v2/` with schema migration
5. **Rate Limiting**: Apply per-error-code rate limits
