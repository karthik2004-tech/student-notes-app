# Backend Configuration Guide

## Overview

PatternWise backend uses centralized configuration management with environment variable validation. All configuration is validated at startup to catch issues early before the server starts.

## Quick Start

### 1. Create .env File

```bash
cp .env.example .env
```

### 2. Update Values (Optional)

Modify `.env` for your environment. All values have sensible defaults.

### 3. Start Server

```bash
npm start
```

If configuration is invalid, startup will fail with a detailed error message.

## Environment Variables

### Application Environment

| Variable | Default | Valid Values | Description |
|----------|---------|--------------|-------------|
| `NODE_ENV` | `development` | `development`, `production`, `test` | Application environment |

**Effects:**
- `development`: Enables response validation, verbose logging, relaxed CORS
- `production`: Strict CORS, minimal logging, optimized responses
- `test`: Special configuration for test suite

### Server Configuration

| Variable | Default | Type | Description |
|----------|---------|------|-------------|
| `PORT` | `5000` | number (1-65535) | Server listening port |
| `HOST` | `localhost` | hostname | Server binding address |

**Example:**
```bash
PORT=3000
HOST=0.0.0.0  # Listen on all interfaces
```

### CORS Configuration

| Variable | Default | Type | Description |
|----------|---------|------|-------------|
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5000` | comma-separated URLs | Allowed CORS origins |

**Format:**
```bash
# Single origin
ALLOWED_ORIGINS=http://localhost:3000

# Multiple origins (comma-separated, no spaces)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000,https://myapp.com
```

**In Development:**
- Allows any origin in the `ALLOWED_ORIGINS` list
- Credentials included in CORS headers

**In Production:**
- Strict origin validation
- Limited HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
- Limited headers (Content-Type)

### LeetCode API Configuration

| Variable | Default | Type | Description |
|----------|---------|------|-------------|
| `LEETCODE_API_URL` | `https://leetcode.com/graphql` | URL | LeetCode GraphQL endpoint |
| `LEETCODE_TIMEOUT_MS` | `5000` | number (100-30000) | Request timeout in ms |

**Example:**
```bash
# Use official LeetCode API
LEETCODE_API_URL=https://leetcode.com/graphql

# Custom timeout for slow networks
LEETCODE_TIMEOUT_MS=10000
```

### Logging Configuration

| Variable | Default | Valid Values | Description |
|----------|---------|--------------|-------------|
| `LOG_LEVEL` | `info` | `error`, `warn`, `info`, `debug`, `trace` | Logging verbosity |

**Levels:**
- `error`: Only errors
- `warn`: Errors and warnings
- `info`: Standard application logs (recommended)
- `debug`: Detailed debugging information
- `trace`: Most verbose logging

### Feature Flags

| Variable | Default | Type | Description |
|----------|---------|------|-------------|
| `ENABLE_RESPONSE_VALIDATION` | `true` | boolean | Validate responses against schema |
| `ENABLE_REQUEST_LOGGING` | `true` | boolean | Log all requests/responses |

**Example:**
```bash
# Disable response validation
ENABLE_RESPONSE_VALIDATION=false

# Disable request logging (improves performance)
ENABLE_REQUEST_LOGGING=false
```

### Rate Limiting (Optional)

| Variable | Default | Type | Description |
|----------|---------|------|-------------|
| `RATE_LIMIT_ENABLED` | `false` | boolean | Enable rate limiting |
| `RATE_LIMIT_WINDOW_MS` | `900000` | number | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | number | Max requests per window |

**Example:**
```bash
# Enable rate limiting: 50 requests per minute per IP
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000      # 1 minute
RATE_LIMIT_MAX_REQUESTS=50

# Strict: 10 requests per 15 minutes per IP
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=10
```

## Configuration Validation

### Startup Validation

Configuration is validated when the server starts using Joi schema validation.

**Validation Errors Example:**
```
Configuration validation failed:
LEETCODE_TIMEOUT_MS: must be between 100 and 30000
PORT: must be a valid port
```

### Type Coercion

The configuration system automatically converts string values to proper types:

```bash
# These are automatically converted:
PORT=5000              # String "5000" → Number 5000
ENABLE_RATE_LIMIT=true # String "true" → Boolean true
RATE_LIMIT_WINDOW_MS=900000 # String "900000" → Number 900000
```

## Environment-Specific Configurations

### Development

```bash
NODE_ENV=development
PORT=5000
HOST=localhost
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
LOG_LEVEL=debug
ENABLE_RESPONSE_VALIDATION=true
ENABLE_REQUEST_LOGGING=true
RATE_LIMIT_ENABLED=false
LEETCODE_TIMEOUT_MS=5000
```

**Effects:**
- Verbose logging
- Response schema validation enabled
- Request/response logging enabled
- Relaxed CORS
- No rate limiting

### Production

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
ALLOWED_ORIGINS=https://myapp.com,https://www.myapp.com
LOG_LEVEL=warn
ENABLE_RESPONSE_VALIDATION=false
ENABLE_REQUEST_LOGGING=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LEETCODE_TIMEOUT_MS=10000
```

**Effects:**
- Minimal logging (errors and warnings only)
- No schema validation (performance)
- Strict CORS
- Rate limiting enabled
- Longer LeetCode timeout (for reliability)

### Testing

```bash
NODE_ENV=test
PORT=5001
HOST=127.0.0.1
ALLOWED_ORIGINS=http://127.0.0.1:5001
LOG_LEVEL=error
ENABLE_RESPONSE_VALIDATION=false
ENABLE_REQUEST_LOGGING=false
RATE_LIMIT_ENABLED=false
LEETCODE_TIMEOUT_MS=1000
```

## Docker/Container Deployment

When running in Docker, pass environment variables at container startup:

```bash
docker run -e NODE_ENV=production \
           -e PORT=3000 \
           -e ALLOWED_ORIGINS=https://api.example.com \
           -e LEETCODE_TIMEOUT_MS=8000 \
           patternwise-backend
```

Or use environment file:

```bash
docker run --env-file .env.production patternwise-backend
```

## Programmatic Access

Import configuration in any module:

```javascript
const { config } = require('./config');

console.log(config.PORT);      // 5000
console.log(config.NODE_ENV);  // 'development'
console.log(config.ALLOWED_ORIGINS); // 'http://localhost:3000,...'
```

Get CORS configuration for Express:

```javascript
const { getCorsConfig } = require('./config');
const cors = require('cors');

const corsOptions = getCorsConfig(config);
app.use(cors(corsOptions));
```

## Validation Schema

See `config/index.js` for the complete Joi schema definition. Each variable has:

- **Type validation** (string, number, boolean, URL, hostname, port)
- **Range validation** (min/max for numbers)
- **Default values** (fallback if not provided)
- **Descriptions** (self-documenting)

## Troubleshooting

### "Configuration validation failed"

Check the error message for which variable failed:

```bash
# Port out of range?
PORT=99999  # ❌ Invalid port

# Timeout too short?
LEETCODE_TIMEOUT_MS=50  # ❌ Minimum is 100
```

### "Invalid CORS origin"

Make sure `ALLOWED_ORIGINS` contains valid URLs:

```bash
# Valid
ALLOWED_ORIGINS=http://localhost:3000,https://api.example.com

# Invalid (missing protocol)
ALLOWED_ORIGINS=localhost:3000  # ❌

# Invalid (trailing slash)
ALLOWED_ORIGINS=http://localhost:3000/  # ⚠️ Works but not recommended
```

### "LeetCode API unreachable"

Increase timeout for slow networks:

```bash
LEETCODE_TIMEOUT_MS=15000  # 15 seconds instead of 5
```

## Best Practices

1. **Always use `.env` file in development**
   ```bash
   cp .env.example .env
   ```

2. **Never commit `.env` to git**
   - `.env` is already in `.gitignore`
   - Keep secrets safe

3. **Version `.env.example` with reasonable defaults**
   - Helps new developers setup quickly

4. **Document new environment variables in `.env.example`**
   - Update `.env.example` before committing new config options

5. **Use appropriate `NODE_ENV` per deployment**
   - Development: Verbose, helpful errors
   - Production: Minimal, secure

6. **Test configuration changes locally first**
   - Start server and check log output
   - Verify all features work as expected

7. **Monitor configuration in production**
   - Log configuration state on startup
   - Alert on unexpected configuration values
