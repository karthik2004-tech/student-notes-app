/**
 * Response Validation Middleware
 * Intercepts responses and validates them against defined schemas
 */

const { successResponseSchema, errorResponseSchema } = require('../schemas/responseSchemas');

/**
 * Validates response and logs validation errors
 * @param {object} response - Response object to validate
 * @param {boolean} isError - Whether this is an error response
 * @returns {object} Validation result with {valid, error}
 */
function validateResponse(response, isError = false) {
  const schema = isError ? errorResponseSchema : successResponseSchema;
  const { error, value } = schema.validate(response, { abortEarly: false });
  
  return {
    valid: !error,
    error: error ? error.details.map(d => d.message) : null,
    value
  };
}

/**
 * Express middleware to validate responses before sending
 * Development only - logs schema violations
 */
function responseValidationMiddleware(req, res, next) {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to validate before sending
  res.json = function(data) {
    const isError = data && data.status === 'error';
    const validation = validateResponse(data, isError);

    if (!validation.valid && process.env.NODE_ENV === 'development') {
      console.warn('[Response Validation Warning]', {
        path: req.path,
        errors: validation.error,
        response: data
      });
    }

    return originalJson(data);
  };

  next();
}

module.exports = {
  validateResponse,
  responseValidationMiddleware
};
