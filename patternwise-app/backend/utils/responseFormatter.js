/**
 * Response Formatter Utility
 * Standardizes all API responses into consistent envelope format
 */

const API_VERSION = '1.0.0';

/**
 * Format a success response
 * @param {any} data - Response data (pattern or array of patterns)
 * @returns {object} Formatted success response
 */
function formatSuccess(data) {
  return {
    status: 'success',
    data,
    meta: {
      timestamp: new Date(),
      version: API_VERSION
    }
  };
}

/**
 * Format an error response
 * @param {string} code - Error code (e.g., 'PATTERN_NOT_FOUND')
 * @param {string} message - Human-readable error message
 * @param {object} details - Additional error details (optional)
 * @returns {object} Formatted error response
 */
function formatError(code, message, details = null) {
  return {
    status: 'error',
    error: {
      code,
      message,
      ...(details && { details })
    },
    meta: {
      timestamp: new Date(),
      version: API_VERSION
    }
  };
}

/**
 * Error codes enum for consistency
 */
const ErrorCodes = {
  PATTERN_NOT_FOUND: 'PATTERN_NOT_FOUND',
  LEETCODE_FETCH_FAILED: 'LEETCODE_FETCH_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_PATTERN_ID: 'INVALID_PATTERN_ID',
  PARTIAL_DATA_FAILURE: 'PARTIAL_DATA_FAILURE'
};

module.exports = {
  formatSuccess,
  formatError,
  ErrorCodes,
  API_VERSION
};
