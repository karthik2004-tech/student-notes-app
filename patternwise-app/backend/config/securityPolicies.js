/**
 * Security Policies Configuration
 * Centralized configuration for all security-related policies
 */

/**
 * Security policies for the application
 */
const securityPolicies = {
  // CORS Configuration
  cors: {
    maxAge: 86400, // 24 hours
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // HTTPS Configuration
  https: {
    // Only enforce in production
    enforceInProduction: true,
    // Redirect HTTP to HTTPS
    redirectHttpToHttps: true,
    // HSTS settings
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
  },

  // Content Security Policy
  csp: {
    // Development: Relaxed for dev tools, hot reload, etc.
    development: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "localhost:*", "127.0.0.1:*"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "localhost:*", "127.0.0.1:*", "ws:", "wss:"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
    // Production: Strict CSP
    production: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: true,
    },
  },

  // Security Headers
  headers: {
    // Prevent MIME-type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    // XSS protection
    'X-XSS-Protection': '1; mode=block',
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Permissions policy
    'Permissions-Policy':
      'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  },

  // Rate Limiting (if enabled)
  rateLimiting: {
    // Window duration in milliseconds (15 minutes)
    windowMs: 15 * 60 * 1000,
    // Max requests per window
    maxRequests: 100,
    // Message when limit exceeded
    message: 'Too many requests, please try again later',
    // Standard limit headers
    standardHeaders: true,
    // Skip success status
    skip: (req) => req.method === 'OPTIONS',
  },

  // Response validation
  responseValidation: {
    // Only validate in development
    enabled: process.env.NODE_ENV === 'development',
    // Throw on invalid response
    throwOnError: true,
  },

  // Request logging
  requestLogging: {
    // Log level
    level: process.env.LOG_LEVEL || 'info',
    // Format
    format: 'combined',
    // Skip certain requests
    skip: (req) => req.method === 'OPTIONS' || req.path === '/health',
  },

  // Session configuration
  session: {
    // Session timeout in milliseconds (30 minutes)
    timeout: 30 * 60 * 1000,
    // Secure cookies (HTTPS only)
    secure: process.env.NODE_ENV === 'production',
    // HttpOnly cookies (no JavaScript access)
    httpOnly: true,
    // SameSite policy
    sameSite: 'Strict',
  },

  // Input validation
  validation: {
    // Trim whitespace
    trim: true,
    // Escape HTML entities
    escape: true,
    // Max string length (prevent DoS)
    maxStringLength: 1000,
    // Max array length
    maxArrayLength: 100,
  },

  // Request body limits
  bodyParser: {
    // JSON limit
    jsonLimit: '10mb',
    // URL encoded limit
    urlencodedLimit: '10mb',
  },
};

/**
 * Get security policies based on environment
 * @param {object} config - Application configuration
 * @returns {object} Filtered security policies for the environment
 */
function getSecurityPolicies(config) {
  const nodeEnv = config.NODE_ENV || 'development';

  return {
    ...securityPolicies,
    csp: securityPolicies.csp[nodeEnv] || securityPolicies.csp.production,
  };
}

module.exports = {
  securityPolicies,
  getSecurityPolicies,
};
