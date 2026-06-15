# PatternWise API Specification v1.0.0

## Overview

The PatternWise API provides access to DSA pattern information and LeetCode problem statistics. All responses follow a consistent envelope format with explicit contracts.

## Response Format

### Success Response
All successful responses follow this envelope:

```json
{
  "status": "success",
  "data": {
    // Pattern or array of patterns
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

### Error Response
All error responses follow this envelope:

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

## Endpoints

### GET /api/patterns

Returns a list of all DSA patterns.

**Response: 200 OK**
```json
{
  "status": "success",
  "data": [
    {
      "id": "sliding-window",
      "name": "Sliding Window",
      "description": "Used to perform...",
      "difficulty": "Medium",
      "estimatedTime": "4 Hours",
      "intuition": "When a problem asks...",
      "whenToUse": ["Contiguous sequence", "Max/Min"],
      "commonMistakes": ["Off-by-one errors"],
      "template": "let left = 0;...",
      "problems": [
        {
          "questionId": "1",
          "title": "Maximum Average Subarray I",
          "titleSlug": "maximum-average-subarray-i",
          "difficulty": "Easy",
          "acRate": 75.5,
          "topicTags": [{"name": "Array"}]
        }
      ]
    }
  ],
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

---

### GET /api/patterns/:id

Returns detailed information for a specific pattern including LeetCode problem statistics.

**Parameters:**
- `id` (string, required): Pattern identifier (e.g., "sliding-window")

**Response: 200 OK**
```json
{
  "status": "success",
  "data": {
    "id": "sliding-window",
    "name": "Sliding Window",
    "description": "...",
    "difficulty": "Medium",
    "estimatedTime": "4 Hours",
    "intuition": "...",
    "whenToUse": ["..."],
    "commonMistakes": ["..."],
    "template": "...",
    "problems": [
      {
        "questionId": "1",
        "title": "Maximum Average Subarray I",
        "titleSlug": "maximum-average-subarray-i",
        "difficulty": "Easy",
        "acRate": 75.5,
        "topicTags": [{"name": "Array"}]
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

**Response: 404 Not Found**
```json
{
  "status": "error",
  "error": {
    "code": "PATTERN_NOT_FOUND",
    "message": "Pattern with id 'invalid-id' not found",
    "details": {
      "id": "invalid-id"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

**Response: 500 Internal Server Error**
```json
{
  "status": "error",
  "error": {
    "code": "LEETCODE_FETCH_FAILED",
    "message": "Failed to fetch problem statistics from LeetCode",
    "details": {
      "failedProblems": ["problem-slug-1", "problem-slug-2"],
      "partialData": true
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `PATTERN_NOT_FOUND` | 404 | Requested pattern ID does not exist |
| `LEETCODE_FETCH_FAILED` | 500 | Failed to fetch data from LeetCode API |
| `PARTIAL_DATA_FAILURE` | 500 | Successfully fetched pattern but some problems failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `INVALID_PATTERN_ID` | 400 | Pattern ID format is invalid |

---

## Data Models

### Pattern
```typescript
{
  id: string              // Unique identifier
  name: string            // Pattern name
  description: string     // Pattern description
  difficulty: string      // Easy | Medium | Hard
  estimatedTime: string   // Estimated learning time
  intuition: string       // When to apply this pattern
  whenToUse: string[]     // Use cases
  commonMistakes: string[] // Common pitfalls
  template: string        // Code template
  problems: Problem[]     // Associated LeetCode problems
}
```

### Problem
```typescript
{
  questionId: string      // LeetCode question ID
  title: string           // Problem title
  titleSlug: string       // URL-friendly slug
  difficulty: string      // Easy | Medium | Hard | Unknown
  acRate: number          // Acceptance rate (0-100)
  topicTags: {
    name: string
  }[]
}
```

---

## Status Codes

- `200 OK` - Successful request
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error during processing

---

## Version History

### v1.0.0 (Current)
- Initial API specification
- Standardized response envelopes
- Explicit error codes and contracts
- LeetCode problem integration

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- `acRate` is a percentage (0-100)
- Problem data is cached where possible to reduce LeetCode API calls
- If individual problem fetches fail, the pattern is still returned with fallback data
