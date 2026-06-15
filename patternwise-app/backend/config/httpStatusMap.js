/**
 * HTTP Status Code Mapping Configuration
 * Centralized mapping of application error codes to HTTP status codes
 * Ensures consistent, semantic HTTP status codes across all API responses
 */

const http = require('http');

/**
 * Error code to HTTP status code mapping
 * Provides semantic HTTP status codes for various error scenarios
 */
const errorCodeToStatusMap = {
  // 2xx Success Codes
  SUCCESS: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 4xx Client Error Codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  REQUEST_BODY_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Error Codes
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,

  // Application-specific error codes (mapped to HTTP status)
  PATTERN_NOT_FOUND: 404,
  INVALID_PATTERN_ID: 400,
  MISSING_REQUIRED_FIELD: 400,
  INVALID_REQUEST_BODY: 400,
  REQUEST_BODY_TOO_LARGE: 413,
  VALIDATION_FAILED: 422,
  EXTERNAL_API_FAILURE: 503,
  CIRCUIT_BREAKER_OPEN: 503,
  RATE_LIMIT_EXCEEDED: 429,
  CORS_VIOLATION: 403,
  AUTHENTICATION_REQUIRED: 401,
  INSUFFICIENT_PERMISSIONS: 403,
  RESOURCE_ALREADY_EXISTS: 409,
  DATABASE_ERROR: 500,
  CONFIGURATION_ERROR: 500,
};

/**
 * Validate that all error codes have valid HTTP status codes
 * Called at startup to ensure mapping integrity
 */
function validateErrorCodeMapping() {
  const validStatusCodes = new Set(Object.values(http.STATUS_CODES).map((_, code) => code));
  
  const errors = [];
  for (const [errorCode, statusCode] of Object.entries(errorCodeToStatusMap)) {
    if (!validStatusCodes.has(statusCode)) {
      errors.push(`Invalid HTTP status code ${statusCode} for error code ${errorCode}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `HTTP Status Code Mapping validation failed:\n${errors.join('\n')}`
    );
  }

  return true;
}

/**
 * Get HTTP status code for an error code
 * @param {string} errorCode - Application error code
 * @param {number} defaultStatus - Default status code if error code not found (default: 500)
 * @returns {number} HTTP status code
 */
function getHttpStatusCode(errorCode, defaultStatus = 500) {
  return errorCodeToStatusMap[errorCode] !== undefined
    ? errorCodeToStatusMap[errorCode]
    : defaultStatus;
}

/**
 * Get HTTP status text for a status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} HTTP status text (e.g., "Internal Server Error")
 */
function getHttpStatusText(statusCode) {
  return http.STATUS_CODES[statusCode] || 'Unknown Error';
}

/**
 * Validate error code existence
 * @param {string} errorCode - Error code to validate
 * @returns {boolean} True if error code exists in mapping
 */
function isValidErrorCode(errorCode) {
  return errorCode in errorCodeToStatusMap;
}

module.exports = {
  errorCodeToStatusMap,
  getHttpStatusCode,
  getHttpStatusText,
  isValidErrorCode,
  validateErrorCodeMapping,
};
