const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const corsValidator = require('./middleware/corsValidator');
const { responseValidationMiddleware } = require('./middleware/responseValidator');
const { config, getCorsConfig, logConfiguration } = require('./config');

const app = express();

try {
  // Log configuration on startup (development only)
  if (config.NODE_ENV === 'development') {
    logConfiguration(config);
  }

  // Security: Limit query string parsing depth (Issue #1593)
  app.set('query parser', str => require('qs').parse(str, { depth: 5 }));

  // Apply CORS with validated configuration
  const corsOptions = getCorsConfig(config);
  app.use(cors(corsOptions));

  // Body parsing middleware with security limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, parameterLimit: 10000, limit: '1mb' }));

  // CORS validation middleware (development only)
  if (config.NODE_ENV === 'development') {
    app.use(corsValidator);
  }

  // Response validation middleware (development only)
  if (config.ENABLE_RESPONSE_VALIDATION && config.NODE_ENV === 'development') {
    app.use(responseValidationMiddleware);
  }

  // API Routes
  app.use('/api', apiRoutes);

  // Serve Frontend (if needed in production)
  app.use(express.static(path.join(__dirname, '../frontend')));

  // Start server
  app.listen(config.PORT, config.HOST, () => {
    console.log(
      `[SERVER] PatternWise server running on http://${config.HOST}:${config.PORT}`
    );
    console.log(`[SERVER] Environment: ${config.NODE_ENV}`);
  });
} catch (err) {
  console.error('[STARTUP ERROR] Failed to start server:');
  console.error(err.message);
  process.exit(1);
}
