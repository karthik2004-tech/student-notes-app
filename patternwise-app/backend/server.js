const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const { securityHeadersMiddleware } = require('./middleware/securityHeaders');
const httpsEnforcement = require('./middleware/httpsEnforcement');
const { config, getCorsConfig } = require('./config');
const { validateErrorCodeMapping } = require('./config/httpStatusMap');
const { getJsonParserConfig, getUrlEncodedParserConfig, validateRequestBodyLimits } = require('./config/requestBodyParser');
const { requestBodyValidatorMiddleware, payloadTooLargeErrorHandler } = require('./middleware/requestBodyValidator');
const { responseFormattingMiddleware } = require('./utils/responseFormatter');

const app = express();

try {
  // Validate HTTP status code mapping at startup
  validateErrorCodeMapping();
  if (config.NODE_ENV === 'development') {
    console.log('[STARTUP] HTTP Status Code Mapping validated successfully');
  }

  // Validate request body limits at startup
  validateRequestBodyLimits();
  if (config.NODE_ENV === 'development') {
    console.log('[STARTUP] Request Body Size Limits validated successfully');
  }

  // Apply HTTPS enforcement (production only)
  app.use(httpsEnforcement(config));

  // Initialize CORS with whitelist
  const corsConfig = getCorsConfig(config);
  app.use(cors(corsConfig));

  // Apply security headers
  app.use(securityHeadersMiddleware(config));

  // Request body validator middleware (logs and enforces limits)
  app.use(requestBodyValidatorMiddleware(config));

  // Configure request body parsing with explicit size limits
  app.use(express.json(getJsonParserConfig()));
  app.use(express.urlencoded(getUrlEncodedParserConfig()));

  // Error handler for payload too large
  app.use(payloadTooLargeErrorHandler(config));

  // Apply response formatting middleware
  app.use(responseFormattingMiddleware);

  // API Routes
  app.use('/api', apiRoutes);

  // Serve Frontend (if needed in production)
  app.use(express.static(path.join(__dirname, '../frontend')));

  app.listen(config.PORT, config.HOST, () => {
    console.log(
      `[SERVER] PatternWise server running on http://${config.HOST}:${config.PORT}`
    );
    console.log(`[SERVER] Environment: ${config.NODE_ENV}`);
    if (config.NODE_ENV === 'development') {
      console.log(`[SECURITY] CORS Allowed Origins: ${config.ALLOWED_ORIGINS}`);
      console.log('[SECURITY] Running in development mode - relaxed policies applied');
    } else {
      console.log('[SECURITY] Running in production mode - strict security policies applied');
    }
  });
} catch (err) {
  console.error('[STARTUP ERROR] Failed to start server:');
  console.error(err.message);
  process.exit(1);
}
