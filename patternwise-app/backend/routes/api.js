const express = require('express');
const router = express.Router();
const patternController = require('../controllers/patternController');
const { createEndpointLimiters } = require('../middleware/rateLimiter');
const { config } = require('../config');

// Initialize rate limiters if enabled
const limiters = config.RATE_LIMIT_ENABLED 
  ? createEndpointLimiters(config)
  : null;

// Get all patterns summary with rate limiting
router.get('/patterns', 
  limiters ? limiters.patterns : (req, res, next) => next(),
  patternController.getPatterns
);

// Get specific pattern details with stricter rate limiting
router.get('/patterns/:id', 
  limiters ? limiters.patternDetails : (req, res, next) => next(),
  patternController.getPatternDetails
);

module.exports = router;
