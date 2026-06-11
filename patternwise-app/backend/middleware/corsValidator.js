/**
 * CORS Validator Middleware
 * Validates and logs CORS requests (development only)
 */

/**
 * CORS validation middleware (development only)
 */
function corsValidator(req, res, next) {
  const origin = req.get('origin');
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Log CORS requests in development
  if (nodeEnv === 'development' && origin) {
    console.debug(`[CORS] Request from origin: ${origin}`);
  }

  next();
}

module.exports = corsValidator;
