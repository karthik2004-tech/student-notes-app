/**
 * Security Headers Middleware
 * Applies critical security headers to all responses
 */

/**
 * Get security headers configuration based on environment
 * @param {object} config - Application configuration
 * @returns {object} Security headers
 */
function getSecurityHeaders(config) {
  const nodeEnv = config.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';

  return {
    // Prevent MIME-type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',

    // Enable XSS protection in browsers
    'X-XSS-Protection': '1; mode=block',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // HSTS (only in production to enforce HTTPS)
    'Strict-Transport-Security': isDevelopment
      ? undefined
      : 'max-age=31536000; includeSubDomains; preload',

    // Content Security Policy
    'Content-Security-Policy': buildCSP(config),

    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy':
      'geolocation=(), microphone=(), camera=(), payment=(), usb=()',

    // Remove X-Powered-By header
    'X-Powered-By': undefined,
  };
}

/**
 * Build Content Security Policy
 * @param {object} config - Application configuration
 * @returns {string} CSP header value
 */
function buildCSP(config) {
  const nodeEnv = config.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';

  if (isDevelopment) {
    // Relaxed CSP for development (allow localhost for hot reload)
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' localhost:* 127.0.0.1:*",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' localhost:* 127.0.0.1:* ws: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }

  // Strict CSP for production
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

/**
 * Middleware to apply security headers
 * @param {object} config - Application configuration
 * @returns {function} Express middleware
 */
function securityHeadersMiddleware(config) {
  const headers = getSecurityHeaders(config);

  return (req, res, next) => {
    // Apply all security headers
    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined) {
        res.set(key, value);
      }
    });

    // Remove X-Powered-By header if present
    res.removeHeader('X-Powered-By');

    next();
  };
}

module.exports = {
  securityHeadersMiddleware,
  getSecurityHeaders,
  buildCSP,
};
