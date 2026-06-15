/**
 * Request Body Validator Middleware
 * Validates request body sizes and content types before processing
 * Provides logging and enforcement of size limits
 */

const { requestBodyLimits } = require('../config/requestBodyParser');
const { formatError } = require('../utils/responseFormatter');

/**
 * Convert size string to bytes
 * Supports k, m, g suffixes (e.g., "10mb" -> 10485760)
 * @param {string} sizeStr - Size string (e.g., "10mb")
 * @returns {number} Size in bytes
 */
function sizeToBytes(sizeStr) {
  const match = sizeStr.toLowerCase().match(/^(\d+)([kmg]?)b?$/);
  if (!match) return null;

  const [, number, unit] = match;
  const num = parseInt(number, 10);
  const multipliers = { k: 1024, m: 1048576, g: 1073741824 };

  return num * (multipliers[unit] || 1);
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Number of bytes
 * @returns {string} Human-readable size (e.g., "10 MB")
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Create request body validator middleware
 * Monitors and logs request body sizes
 * @param {object} config - Application configuration
 * @returns {function} Express middleware function
 */
function requestBodyValidatorMiddleware(config = {}) {
  const jsonLimitBytes = sizeToBytes(requestBodyLimits.json);
  const urlencodedLimitBytes = sizeToBytes(requestBodyLimits.urlencoded);

  return (req, res, next) => {
    // Get content length from header
    const contentLength = parseInt(req.get('content-length') || 0, 10);

    if (contentLength > 0) {
      const contentType = req.get('content-type') || 'unknown';
      let limit = null;

      if (contentType.includes('application/json')) {
        limit = jsonLimitBytes;
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        limit = urlencodedLimitBytes;
      }

      // Log in development mode
      if (config.NODE_ENV === 'development') {
        console.log(
          `[REQUEST] ${req.method} ${req.path} - Size: ${formatBytes(contentLength)}, Type: ${contentType}`
        );
      }

      // Check if size exceeds limit
      if (limit && contentLength > limit) {
        const response = formatError(
          `Request body too large. Max allowed: ${formatBytes(limit)}`,
          'REQUEST_BODY_TOO_LARGE',
          413,
          {
            contentLength: formatBytes(contentLength),
            limit: formatBytes(limit),
            contentType,
          }
        );
        return res.status(response.statusCode).json(response);
      }
    }

    next();
  };
}

/**
 * Error handler for payload too large errors
 * Catches errors from express.json() when body exceeds limit
 * @param {object} config - Application configuration
 * @returns {function} Express error handler middleware
 */
function payloadTooLargeErrorHandler(config = {}) {
  return (err, req, res, next) => {
    if (err.type === 'entity.too.large') {
      const limit = requestBodyLimits.json;
      const response = formatError(
        `Payload too large. Maximum size: ${limit}`,
        'REQUEST_BODY_TOO_LARGE',
        413,
        {
          expectedLimit: limit,
          type: err.type,
        }
      );
      return res.status(response.statusCode).json(response);
    }

    // Pass to next error handler if not payload error
    next(err);
  };
}

/**
 * Get request body size limits info
 * Returns current limit configuration
 * @returns {object} Request body limits information
 */
function getRequestBodyLimitsInfo() {
  return {
    json: {
      limit: requestBodyLimits.json,
      bytes: sizeToBytes(requestBodyLimits.json),
      formatted: formatBytes(sizeToBytes(requestBodyLimits.json)),
    },
    urlencoded: {
      limit: requestBodyLimits.urlencoded,
      bytes: sizeToBytes(requestBodyLimits.urlencoded),
      formatted: formatBytes(sizeToBytes(requestBodyLimits.urlencoded)),
    },
    raw: {
      limit: requestBodyLimits.raw,
      bytes: sizeToBytes(requestBodyLimits.raw),
      formatted: formatBytes(sizeToBytes(requestBodyLimits.raw)),
    },
    text: {
      limit: requestBodyLimits.text,
      bytes: sizeToBytes(requestBodyLimits.text),
      formatted: formatBytes(sizeToBytes(requestBodyLimits.text)),
    },
  };
}

module.exports = {
  requestBodyValidatorMiddleware,
  payloadTooLargeErrorHandler,
  getRequestBodyLimitsInfo,
  sizeToBytes,
  formatBytes,
};
