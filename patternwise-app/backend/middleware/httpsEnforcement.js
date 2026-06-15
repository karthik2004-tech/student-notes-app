/**
 * HTTPS Enforcement Middleware
 * Redirects HTTP traffic to HTTPS in production
 */

/**
 * HTTPS enforcement middleware
 * @param {object} config - Application configuration
 * @returns {function} Express middleware
 */
function httpsEnforcement(config) {
  return (req, res, next) => {
    const nodeEnv = config.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';

    // Only enforce HTTPS in production
    if (!isProduction) {
      return next();
    }

    // Check if request is over HTTPS
    const isHttps =
      req.secure ||
      req.get('x-forwarded-proto') === 'https' ||
      req.get('x-forwarded-proto-version') === 'https';

    if (!isHttps) {
      // Redirect HTTP to HTTPS
      const redirectUrl = `https://${req.get('host')}${req.url}`;
      console.warn(`[HTTPS] Redirecting ${req.method} ${req.url} to HTTPS`);
      return res.redirect(301, redirectUrl);
    }

    next();
  };
}

module.exports = httpsEnforcement;
