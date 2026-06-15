const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const { securityHeadersMiddleware } = require('./middleware/securityHeaders');
const httpsEnforcement = require('./middleware/httpsEnforcement');
const { config, getCorsConfig } = require('./config');

const app = express();

// Apply HTTPS enforcement (production only)
app.use(httpsEnforcement(config));

// Initialize CORS with whitelist
const corsConfig = getCorsConfig(config);
app.use(cors(corsConfig));

// Apply security headers
app.use(securityHeadersMiddleware(config));

// Configure request body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
