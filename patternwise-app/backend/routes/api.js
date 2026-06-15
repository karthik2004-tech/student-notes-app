const express = require('express');
const router = express.Router();
const patternController = require('../controllers/patternController');
const { createEndpointLimiters } = require('../middleware/rateLimiter');
const { createResponseCache } = require('../middleware/responseCache');
const { config } = require('../config');

// Create rate limiters for each endpoint
const limiters = createEndpointLimiters();

// Create response cache (5 minute TTL)
const responseCache = createResponseCache({
  ttlMs: 300000, // 5 minutes
  skip: (req) => !config.RATE_LIMIT_ENABLED, // Skip cache if rate limiting disabled
});

// Apply rate limiting and caching if enabled
if (config.RATE_LIMIT_ENABLED) {
  // Cache responses to reduce external API calls
  router.use(responseCache);

  // Get all patterns summary - standard rate limit (100 req/15min)
  router.get('/patterns', limiters.patterns, patternController.getPatterns);

  // Get specific pattern details - strict rate limit (30 req/15min)
  // This endpoint calls LeetCode API and should be more strictly throttled
  router.get(
    '/patterns/:id',
    limiters.patternDetails,
    patternController.getPatternDetails
  );
} else {
  // No rate limiting - just use routes normally
  router.get('/patterns', patternController.getPatterns);
  router.get('/patterns/:id', patternController.getPatternDetails);
}

module.exports = router;
