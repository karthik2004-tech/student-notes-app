# Configuration Architecture

## Design Overview

The centralized configuration system validates all environment variables on server startup using a Joi schema. This ensures the application fails fast with clear error messages if configuration is invalid.

## Module Structure

```
config/
├── index.js          # Main configuration module
└── [schemas/]        # Future: Environment-specific schemas

Backend Root:
├── .env.example      # Template with all available variables
├── .gitignore        # Excludes .env and secrets
└── docs/
    ├── CONFIGURATION.md      # User guide
    └── CONFIG_ARCHITECTURE.md # This file
```

## How It Works

### 1. Schema Definition

`config/index.js` defines a Joi schema with all supported environment variables:

```javascript
const configSchema = Joi.object({
  PORT: Joi.number().port().default(5000),
  NODE_ENV: Joi.string().valid(...).default('development'),
  // ... more variables
});
```

Each variable has:
- **Type**: string, number, boolean, etc.
- **Constraints**: min/max, valid values, URL format, etc.
- **Default**: Fallback if not provided
- **Description**: Self-documenting

### 2. Loading & Validation

When the module loads, it:

1. Reads environment variables from `process.env`
2. Converts types (e.g., string "5000" → number 5000)
3. Validates against schema
4. Throws error if invalid
5. Exports validated config

```javascript
const config = loadConfig(); // Called on import
module.exports = { config, loadConfig, ... };
```

### 3. Startup Integration

`server.js` imports and uses configuration:

```javascript
const { config, getCorsConfig, logConfiguration } = require('./config');

// Configuration fails fast before server starts
try {
  logConfiguration(config);
  app.use(cors(getCorsConfig(config)));
  app.listen(config.PORT, config.HOST);
} catch (err) {
  console.error('Configuration error:', err.message);
  process.exit(1);
}
```

## Key Features

### Fail Fast
- Startup fails immediately if config is invalid
- Clear error messages point to specific variables
- Prevents silent failures or runtime surprises

### Type Safety
```javascript
// Input from environment (always string)
process.env.PORT = "5000"

// Automatic conversion to proper type
config.PORT = 5000  // Number, not string
```

### Defaults
```bash
# If not in .env, these defaults apply:
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

### Environment-Specific Behavior

```javascript
// CORS strictness depends on NODE_ENV
if (NODE_ENV === 'production') {
  // Strict origin validation, limited methods
} else {
  // Relaxed, allow all in origins list
}

// Response validation only in development
if (ENABLE_RESPONSE_VALIDATION && NODE_ENV === 'development') {
  app.use(responseValidationMiddleware);
}
```

### Easy Extension

Add new variables by adding to schema:

```javascript
const configSchema = Joi.object({
  // Existing variables...
  
  // New variable
  NEW_FEATURE_ENABLED: Joi.boolean()
    .default(false)
    .description('Enable experimental feature X'),
});
```

Then update `.env.example`:

```bash
# Add to .env.example
NEW_FEATURE_ENABLED=false
```

## Configuration Flow

```
┌─────────────────────────────────────────┐
│  .env file (optional)                   │
│  or environment variables               │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  loadConfig()        │
        │  Reads env vars      │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  configSchema        │
        │  Validate & convert  │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Validation Error?   │
        └──────────┬───────────┘
         Yes ◀─────┴─────► No
         │              │
         ▼              ▼
    Exit(1)    ┌──────────────────┐
               │  config object   │
               │  Exported as     │
               │  module.exports  │
               └──────────────────┘
                        │
                        ▼
               ┌──────────────────────┐
               │  Used in server.js   │
               │  - CORS config       │
               │  - Port/Host         │
               │  - Feature flags     │
               │  - API timeouts      │
               └──────────────────────┘
```

## Usage Patterns

### In server.js (Startup)

```javascript
const { config, getCorsConfig, logConfiguration } = require('./config');

// Get the validated config
app.use(cors(getCorsConfig(config)));
app.listen(config.PORT, config.HOST);
```

### In Controllers/Routes

```javascript
const { config } = require('../config');

// Use config values
const timeout = config.LEETCODE_TIMEOUT_MS;
const isDev = config.NODE_ENV === 'development';
```

### In Utils/Services

```javascript
const { config } = require('../config');

// Conditional behavior
if (config.ENABLE_REQUEST_LOGGING) {
  logger.log(`Request to ${url}`);
}
```

## Validation Examples

### Valid Configuration
```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
ALLOWED_ORIGINS=https://api.example.com,https://admin.example.com
LEETCODE_TIMEOUT_MS=8000
LOG_LEVEL=warn
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

✅ All values are valid and within constraints

### Invalid Configuration (Fails at Startup)

```bash
PORT=99999           # ❌ Invalid port (max 65535)
LEETCODE_TIMEOUT_MS=50  # ❌ Too short (min 100)
NODE_ENV=staging     # ❌ Invalid (only dev/prod/test)
LOG_LEVEL=verbose    # ❌ Invalid level
```

Error output:
```
Configuration validation failed:
PORT: must be a valid port
LEETCODE_TIMEOUT_MS: must be greater than or equal to 100
NODE_ENV: must be one of [development, production, test]
LOG_LEVEL: must be one of [error, warn, info, debug, trace]
```

## Environment Variable Precedence

1. **Explicitly set in shell**
   ```bash
   PORT=3000 npm start  # Uses PORT=3000
   ```

2. **.env file** (if it exists)
   ```bash
   # .env
   PORT=5000
   npm start  # Uses PORT=5000
   ```

3. **Default in schema**
   ```bash
   npm start  # Uses PORT=5000 (default)
   ```

## Common Patterns

### Multi-Environment Setup

```bash
# development
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
LEETCODE_TIMEOUT_MS=5000

# staging
NODE_ENV=production
ALLOWED_ORIGINS=https://staging.example.com
LEETCODE_TIMEOUT_MS=8000

# production
NODE_ENV=production
ALLOWED_ORIGINS=https://api.example.com
LEETCODE_TIMEOUT_MS=10000
RATE_LIMIT_ENABLED=true
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app/backend
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker run -e NODE_ENV=production \
           -e ALLOWED_ORIGINS=https://api.example.com \
           -e PORT=3000 \
           patternwise-backend
```

### Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: patternwise-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  ALLOWED_ORIGINS: "https://api.example.com"
  LEETCODE_TIMEOUT_MS: "8000"
  RATE_LIMIT_ENABLED: "true"
```

```yaml
spec:
  containers:
  - name: backend
    envFrom:
    - configMapRef:
        name: patternwise-config
```

## Future Enhancements

1. **Environment-Specific Schema Files**
   ```javascript
   // config/schemas/production.js
   // Stricter validation for production
   ```

2. **Configuration Hot Reload**
   ```javascript
   // Reload config without restarting server
   // Useful for feature flags, feature toggles
   ```

3. **Secrets Management Integration**
   ```javascript
   // Support for AWS Secrets Manager, HashiCorp Vault
   // Encrypt sensitive config values
   ```

4. **Configuration UI**
   ```javascript
   // Admin dashboard to view/modify config
   // At `/admin/config` with authentication
   ```

5. **Configuration Auditing**
   ```javascript
   // Log all config changes
   // Track who changed what and when
   ```
