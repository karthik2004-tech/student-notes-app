const Joi = require('joi');

/**
 * Environment Configuration Schema
 * Validates all required environment variables at startup
 */
const configSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5000),
  HOST: Joi.string().default('localhost'),
  ALLOWED_ORIGINS: Joi.string()
    .description('Comma-separated list of allowed CORS origins')
    .required(),
  LEETCODE_API_URL: Joi.string()
    .uri()
    .default('https://leetcode.com/graphql'),
  LEETCODE_TIMEOUT_MS: Joi.number().default(5000),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  RESPONSE_CACHE_ENABLED: Joi.boolean().default(true),
  RESPONSE_CACHE_TTL_MS: Joi.number().default(300000), // 5 minutes
}).unknown(true);

/**
 * Validate and load configuration
 */
function loadConfig() {
  const { error, value: config } = configSchema.validate(process.env);

  if (error) {
    throw new Error(
      `Configuration validation failed: ${error.details.map(d => d.message).join(', ')}`
    );
  }

  return config;
}

/**
 * Get CORS configuration
 * @returns {object} CORS options for express middleware
 */
function getCorsConfig(config) {
  const allowedOrigins = config.ALLOWED_ORIGINS.split(',').map(o => o.trim());

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  };
}

/**
 * Centralized Configuration Management
 * Validates environment variables on startup and provides application config
 */

const Joi = require('joi');

/**
 * Define the configuration schema with all required and optional variables
 */
const configSchema = Joi.object({
  // Node environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Application environment'),

  // Server
  PORT: Joi.number()
    .port()
    .default(5000)
    .description('Server port'),

  HOST: Joi.string()
    .hostname()
    .default('localhost')
    .description('Server host'),

  // CORS
  ALLOWED_ORIGINS: Joi.string()
    .default('http://localhost:3000,http://localhost:5000')
    .description('Comma-separated list of allowed CORS origins'),

  // LeetCode API
  LEETCODE_API_URL: Joi.string()
    .uri()
    .default('https://leetcode.com/graphql')
    .description('LeetCode GraphQL API endpoint'),

  LEETCODE_TIMEOUT_MS: Joi.number()
    .integer()
    .min(100)
    .max(30000)
    .default(5000)
    .description('LeetCode API request timeout in milliseconds'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'trace')
    .default('info')
    .description('Logging level'),

  // Feature flags
  ENABLE_RESPONSE_VALIDATION: Joi.boolean()
    .default(true)
    .description('Enable response schema validation in development'),

  ENABLE_REQUEST_LOGGING: Joi.boolean()
    .default(true)
    .description('Enable request/response logging'),

  // Rate limiting
  RATE_LIMIT_ENABLED: Joi.boolean()
    .default(false)
    .description('Enable rate limiting'),

  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .default(900000)
    .description('Rate limit window in milliseconds (15 minutes)'),

  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(1)
    .default(100)
    .description('Max requests per window'),
})
  .unknown(true); // Allow additional env vars

/**
 * Load and validate configuration from environment
 * @returns {object} Validated configuration object
 * @throws {Error} If validation fails
 */
function loadConfig() {
  // Get environment variables
  const envConfig = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    HOST: process.env.HOST,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    LEETCODE_API_URL: process.env.LEETCODE_API_URL,
    LEETCODE_TIMEOUT_MS: process.env.LEETCODE_TIMEOUT_MS
      ? parseInt(process.env.LEETCODE_TIMEOUT_MS, 10)
      : undefined,
    LOG_LEVEL: process.env.LOG_LEVEL,
    ENABLE_RESPONSE_VALIDATION:
      process.env.ENABLE_RESPONSE_VALIDATION === 'false' ? false : undefined,
    ENABLE_REQUEST_LOGGING:
      process.env.ENABLE_REQUEST_LOGGING === 'false' ? false : undefined,
    RATE_LIMIT_ENABLED:
      process.env.RATE_LIMIT_ENABLED === 'true' ? true : undefined,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS
      ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
      : undefined,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS
      ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
      : undefined,
  };

  // Remove undefined values to use defaults
  Object.keys(envConfig).forEach(
    key => envConfig[key] === undefined && delete envConfig[key]
  );

  // Validate against schema
  const { error, value } = configSchema.validate(envConfig, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    const messages = error.details.map(d => `${d.path.join('.')}: ${d.message}`);
    throw new Error(`Configuration validation failed:\n${messages.join('\n')}`);
  }

  return value;
}

/**
 * Parse CORS origins from comma-separated string
 * @param {string} origins - Comma-separated origins
 * @returns {array} Array of origin strings
 */
function parseCorsOrigins(originString) {
  return originString
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

/**
 * Get CORS configuration object
 * @param {object} config - Configuration object
 * @returns {object} CORS options
 */
function getCorsConfig(config) {
  const origins = parseCorsOrigins(config.ALLOWED_ORIGINS);

  if (config.NODE_ENV === 'development') {
    // Allow all origins in development (includes localhost:3000, localhost:5000, etc)
    return {
      origin: origins,
      credentials: true,
      optionsSuccessStatus: 200,
    };
  }

  // Strict origin validation in production
  return {
    origin: origins,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  };
}

/**
 * Log configuration on startup (without secrets)
 * @param {object} config - Configuration object
 */
function logConfiguration(config) {
  const safeConfig = {
    NODE_ENV: config.NODE_ENV,
    PORT: config.PORT,
    HOST: config.HOST,
    ALLOWED_ORIGINS: config.ALLOWED_ORIGINS,
    LOG_LEVEL: config.LOG_LEVEL,
    LEETCODE_TIMEOUT_MS: config.LEETCODE_TIMEOUT_MS,
    ENABLE_RESPONSE_VALIDATION: config.ENABLE_RESPONSE_VALIDATION,
    ENABLE_REQUEST_LOGGING: config.ENABLE_REQUEST_LOGGING,
    RATE_LIMIT_ENABLED: config.RATE_LIMIT_ENABLED,
  };

  console.log('[CONFIG] Server Configuration Loaded:');
  console.log(JSON.stringify(safeConfig, null, 2));
}

// Load config immediately
const config = loadConfig();

module.exports = {
  config,
  getCorsConfig,
  loadConfig,
  configSchema,
  getCorsConfig,
  parseCorsOrigins,
  logConfiguration,
};
