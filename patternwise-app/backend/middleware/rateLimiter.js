/**
 * Rate Limiting Middleware
 * Implements in-memory rate limiting with per-IP tracking
 */

/**
 * Simple in-memory rate limiter
 */
class InMemoryRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.maxRequests = options.maxRequests || 100;
    this.message = options.message || 'Too many requests, please try again later';
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.skip = options.skip || (() => false);
    this.store = new Map(); // { ip: { count, resetTime } }
    this.cleanupInterval = options.cleanupInterval || 60 * 1000; // 1 minute

    // Start cleanup timer
    this.startCleanup();
  }

  /**
   * Start periodic cleanup of expired entries
   */
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.store.entries()) {
        if (now > data.resetTime) {
          this.store.delete(key);
        }
      }
    }, this.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Check and increment request count
   * @param {string} key - Rate limit key (usually IP)
   * @returns {object} { allowed: boolean, current: number, limit: number, resetTime: timestamp }
   */
  check(key) {
    const now = Date.now();

    // Get or initialize entry
    let entry = this.store.get(key);

    // If no entry or window expired, create new one
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs,
      };
      this.store.set(key, entry);
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    const allowed = entry.count <= this.maxRequests;

    return {
      allowed,
      current: entry.count,
      limit: this.maxRequests,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key) {
    this.store.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll() {
    this.store.clear();
  }

  /**
   * Get current status for a key
   */
  getStatus(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return { count: 0, limit: this.maxRequests, active: false };
    }

    return {
      count: entry.count,
      limit: this.maxRequests,
      resetTime: entry.resetTime,
      active: Date.now() <= entry.resetTime,
    };
  }
}

/**
 * Create rate limiting middleware
 * @param {object} options - Configuration options
 * @returns {function} Express middleware
 */
function createRateLimiter(options = {}) {
  const limiter = new InMemoryRateLimiter(options);

  return (req, res, next) => {
    // Skip if configured to skip
    if (limiter.skip(req)) {
      return next();
    }

    // Get key for this request (usually IP)
    const key = limiter.keyGenerator(req);

    // Check rate limit
    const status = limiter.check(key);

    // Add rate limit info to response headers
    res.set('X-RateLimit-Limit', String(status.limit));
    res.set('X-RateLimit-Remaining', String(Math.max(0, status.limit - status.current)));
    res.set('X-RateLimit-Reset', String(Math.ceil(status.resetTime / 1000)));

    // If limit exceeded, return 429
    if (!status.allowed) {
      res.set('Retry-After', String(status.retryAfter));

      return res.status(429).json({
        status: 'error',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: limiter.message,
          details: {
            limit: status.limit,
            current: status.current,
            retryAfter: status.retryAfter,
            resetTime: new Date(status.resetTime).toISOString(),
          },
        },
      });
    }

    next();
  };
}

/**
 * Create multiple endpoint-specific limiters
 * @param {object} config - Application configuration
 * @returns {object} Map of limiters by endpoint
 */
function createEndpointLimiters(config) {
  const baseLimiter = {
    windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress,
    skip: (req) => req.method === 'OPTIONS',
  };

  return {
    // Standard rate limit for list endpoints
    patterns: createRateLimiter({
      ...baseLimiter,
      maxRequests: 100, // 100 requests per 15 minutes
      message: 'Too many pattern list requests, please try again later',
    }),

    // Stricter rate limit for detail endpoints
    patternDetails: createRateLimiter({
      ...baseLimiter,
      maxRequests: 50, // 50 requests per 15 minutes
      message: 'Too many pattern detail requests, please try again later',
    }),

    // Global API limiter
    api: createRateLimiter({
      ...baseLimiter,
      maxRequests: parseInt(config.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: 'Too many API requests, please try again later',
    }),
  };
}

module.exports = {
  InMemoryRateLimiter,
  createRateLimiter,
  createEndpointLimiters,
};
