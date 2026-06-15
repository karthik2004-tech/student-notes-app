/**
 * Request Body Parser Configuration
 * Centralized configuration for request body parsing with explicit size limits
 * Prevents memory exhaustion and DoS attacks via oversized payloads
 */

/**
 * Request body parser limits configuration
 * Defines explicit size limits for different content types
 */
const requestBodyLimits = {
  // JSON payload limit (default: 10mb)
  json: process.env.REQUEST_BODY_JSON_LIMIT || '10mb',

  // URL-encoded payload limit (default: 10mb)
  urlencoded: process.env.REQUEST_BODY_URLENCODED_LIMIT || '10mb',

  // Raw body limit (default: 5mb)
  raw: process.env.REQUEST_BODY_RAW_LIMIT || '5mb',

  // Text body limit (default: 5mb)
  text: process.env.REQUEST_BODY_TEXT_LIMIT || '5mb',
};

/**
 * JSON parser configuration
 * @returns {object} Express json middleware configuration
 */
function getJsonParserConfig() {
  return {
    limit: requestBodyLimits.json,
    // Strictly parse JSON only
    strict: true,
    // Type checking
    type: ['application/json', 'application/csp-report'],
  };
}

/**
 * URL-encoded parser configuration
 * @returns {object} Express urlencoded middleware configuration
 */
function getUrlEncodedParserConfig() {
  return {
    limit: requestBodyLimits.urlencoded,
    // Support extended syntax with qs library
    extended: true,
    // Type checking
    type: 'application/x-www-form-urlencoded',
  };
}

/**
 * Validate request body limits at startup
 * Ensures limits are reasonable and prevents misconfiguration
 */
function validateRequestBodyLimits() {
  const limits = Object.values(requestBodyLimits);
  
  limits.forEach((limit, index) => {
    if (!limit || typeof limit !== 'string') {
      throw new Error(`Invalid request body limit at index ${index}: ${limit}`);
    }
    
    // Parse limit string to validate format
    const match = limit.match(/^(\d+)([kmg]?)b?$/i);
    if (!match) {
      throw new Error(`Invalid limit format: ${limit}. Use format like "10mb", "5kb", "1gb"`);
    }
  });

  return true;
}

/**
 * Format limit for display
 * @param {string} limit - Limit string (e.g., "10mb")
 * @returns {string} Formatted display string
 */
function formatLimit(limit) {
  return limit.toUpperCase();
}

module.exports = {
  requestBodyLimits,
  getJsonParserConfig,
  getUrlEncodedParserConfig,
  validateRequestBodyLimits,
  formatLimit,
};
