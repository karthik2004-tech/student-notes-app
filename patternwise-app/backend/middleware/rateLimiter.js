/**
 * Rate Limiting Middleware
 * Implements per-IP request throttling to prevent API abuse
 */

const { config } = require('../config');

/**
 * Simple in-memory rate limiter using Map
 * Tracks request count per IP address
 */
class RateLimiter {
  constructor(windowMs = 900000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map(); // IP -> { count, resetTime }

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if request should be allowed
   * @param {string} ip - Client IP address
   * @returns {object} { allowed: boolean, remaining: number, resetTime: Date }
   */
  check(ip) {
    const now = Date.now();
    let entry = this.requests.get(ip);

    // Reset if window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs,
      };
    }

    entry.count++;
    this.requests.set(ip, entry);

    const remaining = Math.max(0, this.maxRequests - entry.count);
    const allowed = entry.count <= this.maxRequests;

    return {
      allowed,
      count: entry.count,
      remaining,
      resetTime: new Date(entry.resetTime),
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [ip, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(ip);
      }
    }
  }

  /**
   * Reset all entries
   */
  reset() {
    this.requests.clear();
  }

  /**
   * Destroy limiter and stop cleanup interval
   */
  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

/**
 * Create rate limiter middleware
 * @param {object} options - Configuration options
 * @returns {function} Express middleware
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || config.RATE_LIMIT_WINDOW_MS || 900000;
  const maxRequests =
    options.maxRequests || config.RATE_LIMIT_MAX_REQUESTS || 100;
  const skip = options.skip || (() => false);
  const onLimitReached = options.onLimitReached || (() => {});

  const limiter = new RateLimiter(windowMs, maxRequests);

  return (req, res, next) => {
    // Skip rate limiting for certain conditions
    if (skip(req)) {
      return next();
    }

    // Get client IP
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';

    // Check rate limit
    const result = limiter.check(ip);

    // Set rate limit headers
    res.set('X-RateLimit-Limit', maxRequests.toString());
    res.set('X-RateLimit-Remaining', result.remaining.toString());
    res.set('X-RateLimit-Reset', result.resetTime.toISOString());

    if (!result.allowed) {
      // Rate limit exceeded
      res.set('Retry-After', result.retryAfter.toString());

      onLimitReached(req, result);

      const response = require('../utils/responseFormatter').formatError(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests. Please try again later.',
        {
          retryAfter: result.retryAfter,
          resetTime: result.resetTime,
        }
      );

      return res.status(429).json(response);
    }

    next();
  };
}

/**
 * Create endpoint-specific rate limiters
 * @returns {object} Limiters for different endpoints
 */
function createEndpointLimiters() {
  return {
    // Strict: /api/patterns/:id - 30 requests per 15 minutes per IP
    patternDetails: createRateLimiter({
      windowMs: 900000, // 15 minutes
      maxRequests: 30,
      onLimitReached: (req, result) => {
        console.warn(
          `[RATE_LIMIT] ${req.ip} hit limit on ${req.path}. Reset: ${result.resetTime}`
        );
      },
    }),

    // Standard: /api/patterns - 100 requests per 15 minutes per IP
    patterns: createRateLimiter({
      windowMs: 900000, // 15 minutes
      maxRequests: 100,
    }),
  };
}

module.exports = {
  RateLimiter,
  createRateLimiter,
  createEndpointLimiters,
};
