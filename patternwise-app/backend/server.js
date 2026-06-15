const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const corsValidator = require('./middleware/corsValidator');
const { config, getCorsConfig } = require('./config');

const app = express();
const PORT = config.PORT || 5000;
const HOST = config.HOST || 'localhost';

// Initialize CORS with whitelist
const corsConfig = getCorsConfig(config);
app.use(cors(corsConfig));

// CORS validation middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(corsValidator);
}

app.use(express.json());
const { responseValidationMiddleware } = require('./middleware/responseValidator');
const { config, getCorsConfig, logConfiguration } = require('./config');

const app = express();

try {
  // Log configuration on startup (development only)
  if (config.NODE_ENV === 'development') {
    logConfiguration(config);
  }

  // Apply CORS with validated configuration
  const corsOptions = getCorsConfig(config);
  app.use(cors(corsOptions));

  app.use(express.json());

app.listen(PORT, HOST, () => {
  console.debug(
    `PatternWise server running on http://${HOST}:${PORT}`
  );
  if (process.env.NODE_ENV === 'development') {
    console.debug(`CORS Allowed Origins: ${config.ALLOWED_ORIGINS}`);
  }
});
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
