/**
 * Response Formatter Utility
 * Standardized response formatting with HTTP status code mapping
 * Ensures consistent response structure across all API endpoints
 */

const { getHttpStatusCode, getHttpStatusText } = require('../config/httpStatusMap');

/**
 * Format success response with proper HTTP status code
 * @param {*} data - Response data payload
 * @param {string} errorCode - Application error/success code (optional, defaults to 'SUCCESS')
 * @param {number} statusCode - Override HTTP status code (optional)
 * @returns {object} Formatted response object with status code
 */
function formatSuccess(data, errorCode = 'SUCCESS', statusCode = null) {
  const httpStatus = statusCode || getHttpStatusCode(errorCode, 200);

  return {
    status: 'success',
    statusCode: httpStatus,
    statusText: getHttpStatusText(httpStatus),
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format error response with proper HTTP status code
 * @param {string} message - Error message
 * @param {string} errorCode - Application error code (maps to HTTP status)
 * @param {number} statusCode - Override HTTP status code (optional)
 * @param {*} details - Additional error details (optional)
 * @returns {object} Formatted error response object with status code
 */
function formatError(message, errorCode = 'INTERNAL_SERVER_ERROR', statusCode = null, details = null) {
  const httpStatus = statusCode || getHttpStatusCode(errorCode, 500);

  const response = {
    status: 'error',
    statusCode: httpStatus,
    statusText: getHttpStatusText(httpStatus),
    message,
    errorCode,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    response.details = details;
  }

  return response;
}

/**
 * Format validation error response
 * @param {object|string} errors - Validation errors (object with field->message or string)
 * @returns {object} Formatted validation error response
 */
function formatValidationError(errors) {
  const httpStatus = getHttpStatusCode('VALIDATION_FAILED', 422);

  return {
    status: 'error',
    statusCode: httpStatus,
    statusText: getHttpStatusText(httpStatus),
    message: 'Validation failed',
    errorCode: 'VALIDATION_FAILED',
    errors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format response and send via Express response object
 * @param {object} res - Express response object
 * @param {object} response - Formatted response object
 */
function sendResponse(res, response) {
  res.status(response.statusCode).json(response);
}

/**
 * Middleware to ensure all responses use centralized formatting
 * Tracks response formatting compliance
 */
function responseFormattingMiddleware(req, res, next) {
  const originalJson = res.json;

  res.json = function (data) {
    // If data already has our response structure, send as-is
    if (data && data.status && data.statusCode !== undefined) {
      return originalJson.call(this, data);
    }

    // Otherwise, format it
    const formatted = formatSuccess(data);
    this.status(formatted.statusCode || 200);
    return originalJson.call(this, formatted);
  };

  next();
}

module.exports = {
  formatSuccess,
  formatError,
  formatValidationError,
  sendResponse,
  responseFormattingMiddleware,
};
