/**
 * Response Caching Middleware
 * Caches successful API responses to reduce LeetCode API calls
 */

/**
 * Simple in-memory cache
 */
class ResponseCache {
  constructor(ttlMs = 300000) {
    // TTL: 5 minutes default
    this.ttlMs = ttlMs;
    this.cache = new Map(); // key -> { data, expiresAt }

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Generate cache key from request
   * @param {object} req - Express request object
   * @returns {string} Cache key
   */
  static generateKey(req) {
    const method = req.method;
    const path = req.path;
    const query = JSON.stringify(req.query);
    return `${method}:${path}:${query}`;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/missing
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} data - Value to cache
   * @param {number} ttlMs - TTL override (optional)
   */
  set(key, data, ttlMs = null) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs || this.ttlMs),
    });
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  stats() {
    return {
      size: this.cache.size,
      ttlMs: this.ttlMs,
    };
  }

  /**
   * Destroy cache and stop cleanup interval
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

/**
 * Create response caching middleware
 * @param {object} options - Configuration options
 * @returns {function} Express middleware
 */
function createResponseCache(options = {}) {
  const ttlMs = options.ttlMs || 300000; // 5 minutes default
  const skip = options.skip || (() => false);
  const keyGenerator = options.keyGenerator || ResponseCache.generateKey;

  const cache = new ResponseCache(ttlMs);

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for certain requests
    if (skip(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      // Add cache hit header
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Key', cacheKey);
      return res.status(200).json(cachedResponse);
    }

    // Intercept response.json() to cache the response
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Only cache successful responses (status 200)
      if (res.statusCode === 200 && data && data.status === 'success') {
        cache.set(cacheKey, data, ttlMs);
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
      }

      return originalJson(data);
    };

    next();
  };
}

module.exports = {
  ResponseCache,
  createResponseCache,
};
