# External API Error Handling & Resilience Guide

## Overview

PatternWise implements robust error handling for external API calls (LeetCode) using circuit breaker pattern and graceful degradation. This ensures partial failures don't cascade and block entire pattern retrieval requests.

## Architecture

### Error Handling Stack

```
Request → Pattern Retrieval
  ↓
Promise.allSettled() → Per-problem isolation
  ↓
Circuit Breaker → Protect from cascading failures
  ↓
Retry Logic → Handle transient errors
  ↓
Fallback Data → Graceful degradation
```

## Components

### 1. External API Handler (`utils/externalApiHandler.js`)

Provides core error handling infrastructure:

#### Error Classification

Errors are classified into types:

```javascript
ErrorTypes = {
  NETWORK_ERROR,           // Connection refused/not found
  TIMEOUT_ERROR,           // Request timeout
  RATE_LIMIT_ERROR,        // HTTP 429
  AUTHENTICATION_ERROR,    // HTTP 401/403
  NOT_FOUND_ERROR,         // HTTP 404
  SERVER_ERROR,            // HTTP 5xx
  INVALID_RESPONSE_ERROR,  // Malformed response
  UNKNOWN_ERROR            // Unexpected error
}
```

Each error type has:
- **Retriable flag**: Whether error is transient and can be retried
- **Status code**: HTTP status or 0 for connection errors
- **Message**: Human-readable description

#### Circuit Breaker Pattern

Protects backend from cascading failures:

```
┌─── Closed ────────────────── (Normal operation)
│        │ 5 consecutive failures
│        ↓
├─── Open ───────────────────── (Reject requests)
│        │ After 60 seconds
│        ↓
└─── Half-Open ──────────────── (Testing recovery)
         │ 2 consecutive successes
         ↓ (back to Closed)
         │ Any failure
         ↓ (back to Open)
```

**States:**
- **CLOSED**: Normal operation, all requests pass through
- **OPEN**: Service failing, requests rejected immediately
- **HALF_OPEN**: Testing if service recovered, limited requests allowed

### 2. LeetCode Utility (`utils/leetcode.js`)

Implements LeetCode API calls with error isolation:

```javascript
async fetchLeetCodeProblem(titleSlug)
  → executeWithCircuitBreaker()
    → Circuit breaker check
    → Retry logic (max 2 retries with exponential backoff)
    → Error classification
    → Fallback (null if failed)
```

### 3. Pattern Controller (`controllers/patternController.js`)

Uses `Promise.allSettled()` for per-problem error isolation:

```javascript
Promise.allSettled([
  fetchLeetCodeProblem('problem-1'),  // May fail
  fetchLeetCodeProblem('problem-2'),  // May succeed
  fetchLeetCodeProblem('problem-3')   // May fail
])
// Process results individually, don't fail on individual failures
```

## Error Handling Scenarios

### Scenario 1: Single Problem Fails (Typical)

```
GET /api/patterns/sliding-window
  ├── Fetch maximum-average-subarray-i → ✅ Success
  ├── Fetch longest-substring-without-repeating-characters → ❌ Timeout
  └── Return pattern with partial data + error details
```

**Response (200 OK):**
```json
{
  "status": "error",
  "error": {
    "code": "PARTIAL_DATA_FAILURE",
    "message": "Successfully fetched pattern but some problems had data fetch issues",
    "details": {
      "failedProblems": [
        {
          "titleSlug": "longest-substring-without-repeating-characters",
          "error": "Request timeout"
        }
      ],
      "totalProblems": 2,
      "successfulProblems": 1
    }
  },
  "data": {
    "id": "sliding-window",
    "problems": [
      { "questionId": "1", "title": "...", /* success */ },
      { "questionId": "unknown", "title": "...", "_fetchFailed": true /* fallback */ }
    ]
  }
}
```

### Scenario 2: LeetCode API Rate Limited (Circuit Opens)

```
Request 1-5 → LeetCode Rate Limit (429)
Request 6   → Circuit Breaker Opens
Request 7   → Circuit breaker rejects immediately (CIRCUIT_BREAKER_OPEN)
              Response with fallback data
After 60s   → Circuit Half-Open
Request 8   → Test call succeeds
Requests 9+ → Circuit Closed, normal operation
```

**Response (429 during open):**
```json
{
  "status": "error",
  "error": {
    "code": "PARTIAL_DATA_FAILURE",
    "details": {
      "failedProblems": [{
        "titleSlug": "...",
        "error": "Circuit open. Retry after 45s"
      }],
      "note": "Pattern returned with fallback data for failed problems"
    }
  },
  "data": {
    "id": "sliding-window",
    "problems": [
      { /* fallback with _fetchFailed: true */ }
    ]
  }
}
```

### Scenario 3: Transient Network Error (Auto-Retry)

```
Request 1 → Network error (ECONNREFUSED)
  ├─ Retry after 500ms (backoff)
Request 2 → Network error
  ├─ Retry after 1000ms (exponential backoff)
Request 3 → Success ✅
```

**Response (200 OK):** Normal success response after retry succeeds

### Scenario 4: Circuit Breaker Recovery

```
Service Down:
├─ Requests 1-5: Fail (circuit opens)
├─ Requests 6-10: Fast-fail (circuit open)

Service Comes Back Online:
├─ After 60 seconds: Circuit Half-Open
├─ Test request succeeds
├─ Circuit closes
├─ Normal operation resumes
```

**Monitoring:**
```javascript
const status = getCircuitBreakerStatus();
// {
//   state: "HALF_OPEN",
//   failureCount: 5,
//   successCount: 1,
//   lastFailureTime: 1704067200000
// }
```

## Response Contracts

### Success Response
```json
{
  "status": "success",
  "data": { /* full pattern with all problems */ },
  "meta": { "timestamp": "...", "version": "1.0.0" }
}
```

### Partial Failure Response (200 OK)
```json
{
  "status": "error",
  "error": {
    "code": "PARTIAL_DATA_FAILURE",
    "message": "Successfully fetched pattern but some problems had data fetch issues",
    "details": {
      "failedProblems": [/* ... */],
      "totalProblems": 3,
      "successfulProblems": 2,
      "note": "Pattern returned with fallback data for failed problems"
    }
  },
  "data": { /* pattern with fallback data */ },
  "meta": { "timestamp": "...", "version": "1.0.0" }
}
```

### Complete Failure Response (500 Internal Error)
```json
{
  "status": "error",
  "error": {
    "code": "LEETCODE_FETCH_FAILED",
    "message": "Failed to fetch problem statistics from LeetCode",
    "details": { "patternId": "sliding-window", "error": "..." }
  },
  "meta": { "timestamp": "...", "version": "1.0.0" }
}
```

## Error Retry Behavior

| Error Type | Retriable | Auto-Retry | Max Attempts |
|------------|-----------|-----------|--------------|
| Network Error | Yes | 2x | 3 total |
| Timeout | Yes | 2x | 3 total |
| Rate Limit (429) | Yes | Circuit breaker | Varies |
| Authentication (401/403) | No | None | 1 |
| Not Found (404) | No | None | 1 |
| Server Error (5xx) | Yes | 2x | 3 total |
| Invalid Response | No | None | 1 |

**Retry Strategy:**
- Exponential backoff: 500ms, 1000ms, 2000ms
- Max 2 retries = 3 total attempts
- Circuit breaker overrides retry logic when open

## Fallback Data Strategy

When LeetCode API fails for a problem:

```javascript
// Fallback structure
{
  questionId: 'unknown',
  titleSlug: 'original-problem-slug',
  title: 'Original Problem Slug',  // Derived from slug
  difficulty: 'Unknown',
  acRate: 0,
  topicTags: [],
  _fetchFailed: true  // Flag for client to know this is fallback
}
```

**Why fallbacks?**
- Users still get pattern information
- Client knows which problems failed (via flag)
- Graceful degradation prevents complete failure
- Pattern remains useful even with missing stats

## Logging & Monitoring

### Log Levels

**Errors (production):**
```
[LEETCODE_API] Failed to fetch sliding-window: TIMEOUT_ERROR - Request timeout
[PATTERN_DETAILS] Partial failure for pattern sliding-window: 1 problems failed
```

**Warnings:**
```
[API_HANDLER] Attempt 1 failed (TIMEOUT_ERROR). Retrying in 500ms...
[CIRCUIT_BREAKER] Circuit opened after 5 failures
[CIRCUIT_BREAKER] Circuit closed - service recovered
```

**Info (development):**
```
[CIRCUIT_BREAKER] Testing recovery
[CIRCUIT_BREAKER] Circuit reopened during recovery test
```

### Monitoring Metrics

```javascript
// Check circuit breaker status
GET /api/patterns/sliding-window/status  // Future endpoint

// Returns:
{
  circuitBreaaker: {
    state: "CLOSED",
    failureCount: 0,
    successCount: 2,
    lastFailureTime: null
  },
  lastSync: "2024-01-15T10:30:00Z"
}
```

## Best Practices

### For API Consumers

1. **Handle partial failures gracefully**
   ```javascript
   const response = await fetch('/api/patterns/sliding-window');
   const { status, error, data } = await response.json();
   
   if (status === 'error' && error.code === 'PARTIAL_DATA_FAILURE') {
     // Show pattern with partial data
     displayPatternWithWarning(data, error.details.failedProblems);
   } else if (status === 'error') {
     // Handle complete failure
     showErrorMessage(error.message);
   }
   ```

2. **Check for fallback data**
   ```javascript
   pattern.problems.forEach(problem => {
     if (problem._fetchFailed) {
       console.warn(`Problem ${problem.titleSlug} has fallback data`);
       // Show different styling or icon
     }
   });
   ```

3. **Implement exponential backoff on client too**
   ```javascript
   let retryDelay = 1000;
   while (retryCount < 3) {
     try {
       const response = await fetch('/api/patterns/sliding-window');
       if (response.ok) break;
     } catch (e) {
       await sleep(retryDelay);
       retryDelay *= 2;
       retryCount++;
     }
   }
   ```

### For Operations

1. **Monitor circuit breaker state**
   - Alert if circuit is OPEN > 5 minutes
   - Alert on repeated OPEN/CLOSED cycles (flapping)

2. **Track error rates**
   - Log error types and frequencies
   - Identify patterns in failures

3. **Check LeetCode API health**
   - Monitor 429 rate limit errors
   - Track response times
   - Watch for cascading failures

## Troubleshooting

### "Circuit breaker keeps opening"

**Problem:** Circuit opens repeatedly

**Solution:** LeetCode API having issues
```bash
# Check LeetCode status
curl https://leetcode.com/graphql

# If failing, options:
1. Increase failure threshold
2. Increase timeout window
3. Wait for LeetCode to recover
```

### "Always getting partial failures"

**Problem:** Some problems consistently fail

**Solution:** May be API-specific issue
```bash
# Test individual problem directly
curl -X POST https://leetcode.com/graphql \
  -d '{"query":"...", "variables":{"titleSlug":"specific-problem"}}'
```

### "Retries taking too long"

**Problem:** Client experiencing delays

**Solution:** Adjust retry configuration
```bash
# In config
LEETCODE_TIMEOUT_MS=3000  # Timeout faster
# Or set RATE_LIMIT_ENABLED=true for response caching
```

## Performance Considerations

**With Error Handling:**
- Per-problem error isolation: ~1-2ms overhead per problem
- Circuit breaker check: <1ms
- Retry logic: Adds latency on failures only
- In-memory tracking: ~100 bytes per IP address

**Optimization:**
- Response caching (5 min TTL) eliminates most retries
- Circuit breaker prevents wasted retry attempts
- Fallback data ensures responses always succeed

## Future Enhancements

1. **Adaptive retry delays** - Learn from patterns in failures
2. **Bulkhead isolation** - Separate circuits per problem category
3. **Metrics endpoint** - /api/health/leetcode endpoint
4. **Circuit breaker reset API** - Admin endpoint to manually reset
5. **Error analytics** - Track error patterns over time
