# Security Headers and Transport Policies Guide

## Overview

PatternWise implements a centralized security policy framework that enforces critical security headers and HTTPS transport requirements. All security policies are configured through a single configuration module, ensuring consistency and ease of maintenance.

## Architecture

### Security Stack

```
Request
  ↓
HTTPS Enforcement (Production only)
  - Redirect HTTP → HTTPS
  - Validate x-forwarded-proto headers
  ↓
CORS Middleware
  - Origin whitelist check
  - Credential handling
  ↓
Security Headers Middleware
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Content-Security-Policy
  - Strict-Transport-Security
  - Additional hardening headers
  ↓
Request Body Parser
  - Size limits (10MB)
  - Content-Type validation
  ↓
API Routes / Application Logic
  ↓
Response (with all security headers applied)
```

## Components

### 1. HTTPS Enforcement (`middleware/httpsEnforcement.js`)

**Purpose:** Redirects HTTP traffic to HTTPS in production environments

**Features:**
- Production-only activation (disabled in development)
- Support for reverse proxies (x-forwarded-proto header)
- 301 permanent redirects
- Logging of redirects

**How it works:**
```
Development: 
  HTTP request → Allowed, passed through

Production:
  HTTP request → Detected
  ↓
  Check headers (x-forwarded-proto, x-forwarded-proto-version)
  ↓
  If not HTTPS → Redirect to https://domain/path (301)
  ↓
  HTTPS request → Allowed, passed through
```

**Configuration:**
```bash
# In environment
NODE_ENV=production
```

**Redirect Example:**
```
Request:  GET http://api.example.com/patterns
Response: 301 Moved Permanently
Location: https://api.example.com/patterns
```

### 2. Security Headers Middleware (`middleware/securityHeaders.js`)

**Purpose:** Applies critical security headers to all HTTP responses

**Headers Applied:**

#### Production Headers
```
X-Content-Type-Options: nosniff
  → Prevents browser MIME-type sniffing
  
X-Frame-Options: DENY
  → Prevents clickjacking by disallowing iframe embedding
  
X-XSS-Protection: 1; mode=block
  → Enables XSS filter in older browsers
  
Referrer-Policy: strict-origin-when-cross-origin
  → Controls referrer information leakage
  
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  → Enforces HTTPS for 1 year; includes subdomains; enables browser preload
  
Content-Security-Policy: (see below)
  → Strict CSP for production
  
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
  → Disables dangerous browser features
```

#### Development Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin

(Strict-Transport-Security omitted for HTTP compatibility)

Content-Security-Policy: (relaxed for dev tools, hot reload)
  → Allows unsafe-eval, unsafe-inline for debugging
  → Allows localhost for dev servers
  
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
```

### 3. Content Security Policy (CSP)

**Production CSP:**
```
default-src 'self'
script-src 'self'
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
font-src 'self'
connect-src 'self'
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
upgrade-insecure-requests
```

**What it protects against:**
- XSS attacks: Only scripts from same origin allowed
- Clickjacking: frame-ancestors 'none' prevents iframing
- Malicious data: Only self resources by default
- Mixed content: upgrade-insecure-requests forces HTTPS

**Development CSP (Relaxed):**
```
default-src 'self'
script-src 'self' 'unsafe-eval' 'unsafe-inline' localhost:* 127.0.0.1:*
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
font-src 'self' data:
connect-src 'self' localhost:* 127.0.0.1:* ws: wss:
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

**Why relaxed in development:**
- Allows hot module replacement (HMR)
- Allows dev tools and live reload
- Allows WebSocket connections for development
- Allows eval for debugging

### 4. Security Policies Configuration (`config/securityPolicies.js`)

**Purpose:** Centralized configuration for all security policies

**Structure:**
```javascript
{
  cors: { ... },
  https: { ... },
  csp: { development: { ... }, production: { ... } },
  headers: { ... },
  rateLimiting: { ... },
  responseValidation: { ... },
  requestLogging: { ... },
  session: { ... },
  validation: { ... },
  bodyParser: { ... }
}
```

**Usage:**
```javascript
const { securityPolicies, getSecurityPolicies } = require('./config/securityPolicies');

// Get all policies
const policies = securityPolicies;

// Get environment-specific policies
const envPolicies = getSecurityPolicies(config);
```

### 5. Request Body Size Limits

**Configuration:**
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

**Protection:**
- Prevents memory exhaustion from large payloads
- 10MB limit balances security and usability
- Applies to both JSON and URL-encoded data

## Request/Response Flow

### HTTP to HTTPS Redirect (Production)

```
1. Client sends HTTP request
   GET http://api.example.com/api/patterns

2. Server (behind reverse proxy) receives
   X-Forwarded-Proto: http

3. HTTPS Enforcement middleware checks
   → Is HTTPS? NO → Production mode? YES → Redirect

4. Server responds
   HTTP/1.1 301 Moved Permanently
   Location: https://api.example.com/api/patterns

5. Client follows redirect
   GET https://api.example.com/api/patterns

6. Normal request processing with security headers
   200 OK
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   Strict-Transport-Security: max-age=31536000; ...
   [JSON Response]
```

### Development Mode (No HTTPS Redirect)

```
1. Client sends HTTP request
   GET http://localhost:5000/api/patterns

2. Server receives (NODE_ENV=development)

3. HTTPS Enforcement middleware checks
   → Development mode? YES → Allow HTTP

4. Normal processing with relaxed security headers
   200 OK
   X-Content-Type-Options: nosniff
   Content-Security-Policy: (relaxed)
   (No Strict-Transport-Security)
   [JSON Response]
```

## Environment Configuration

### Development Environment

```bash
# .env (development)
NODE_ENV=development
PORT=5000
HOST=localhost
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Results in:
# - HTTP allowed (no redirect)
# - Relaxed CSP (allows localhost, unsafe-eval)
# - No HSTS header
# - Development logging enabled
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
ALLOWED_ORIGINS=https://app.example.com

# Results in:
# - HTTP redirected to HTTPS
# - Strict CSP enforced
# - HSTS header enabled (1 year)
# - Minimal logging
# - All security headers applied
```

### Reverse Proxy Configuration

When behind a reverse proxy (Nginx, HAProxy, ALB):

```nginx
# nginx.conf example
location / {
    proxy_pass http://backend:5000;
    
    # Set protocol info for HTTPS detection
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
}
```

## Security Headers in Action

### Example 1: XSS Protection

```javascript
// Attacker tries to inject script
GET /api/patterns?id=<script>alert('xss')</script>

// Response includes CSP header
Content-Security-Policy: default-src 'self'; script-src 'self'

// Browser receives response
// CSP policy analyzed: only 'self' scripts allowed
// Script tag from non-'self' origin: BLOCKED
// CSP violation logged to console (development) or reported to policy violation endpoint
```

### Example 2: Clickjacking Protection

```html
<!-- Attacker's malicious page -->
<iframe src="https://api.example.com/admin"></iframe>

<!-- Server response includes -->
X-Frame-Options: DENY

<!-- Browser checks X-Frame-Options: DENY
     If response not from top-level window: BLOCKED
     IFrame refuses to display content
-->
```

### Example 3: MIME-Type Sniffing Prevention

```javascript
// Server responds with wrong Content-Type
GET /file.js
Content-Type: text/plain  // Wrong! Should be application/javascript
X-Content-Type-Options: nosniff

// Browser checks X-Content-Type-Options: nosniff
// Refuses to sniff and determine actual type
// Treats as text/plain (does not execute)
// Without header: Browser might sniff and execute as JS
```

### Example 4: HTTPS Enforcement

```
Timeline:
  0s   - Client navigates to http://app.example.com
  0.1s - Server responds with 301 redirect to https://app.example.com
  0.2s - Browser follows redirect (HTTPS)
  0.3s - HSTS header received: max-age=31536000
  0.4s - Cached: All future requests to app.example.com use HTTPS
  
Future visits:
  - Browser sees app.example.com in HSTS cache
  - Automatically uses HTTPS (no HTTP request)
  - Protected even from downgrade attacks
```

## Testing Security Headers

### Test 1: Verify Security Headers

```bash
# Check if headers are present
curl -I https://api.example.com/api/patterns

# Expected output:
HTTP/2 200
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

### Test 2: HTTP to HTTPS Redirect

```bash
# Test HTTP redirect (production)
curl -I http://api.example.com/api/patterns

# Expected output:
HTTP/1.1 301 Moved Permanently
Location: https://api.example.com/api/patterns
```

### Test 3: CSP Violations

```javascript
// In browser console on production
// This should be blocked by CSP

fetch('https://api.example.com/api/patterns', {
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.catch(e => console.error(e))

// Check browser console for CSP violations
// (None should appear if request is from same origin)

// If CSP violation occurs:
// Refused to load script from 'https://evil.com/script.js' 
// because it violates the Content-Security-Policy directive...
```

### Test 4: Request Body Size Limit

```bash
# Test with small payload (should work)
curl -X POST https://api.example.com/api/test \
  -H "Content-Type: application/json" \
  -d '{"small":"payload"}'

# Expected: 200 OK

# Test with large payload (>10MB should fail)
curl -X POST https://api.example.com/api/test \
  -H "Content-Type: application/json" \
  -d "$(head -c 11000000 /dev/zero | base64)"

# Expected: 413 Payload Too Large
```

## Monitoring and Logging

### Security Events Logged

```
Development Mode:
  [HTTPS] Redirecting GET /api/patterns to HTTPS
  [SECURITY] CORS Allowed Origins: http://localhost:3000,http://localhost:5173
  [SECURITY] Running in development mode - relaxed policies applied

Production Mode:
  [SERVER] PatternWise server running on http://0.0.0.0:5000
  [SERVER] Environment: production
  [SECURITY] Running in production mode - strict security policies applied
  
  (Individual redirects logged on occurrence)
  [HTTPS] Redirecting GET /api/patterns to HTTPS
```

### CSP Violation Reporting

For future enhancement, add CSP violation reporting endpoint:

```javascript
app.post('/csp-report', (req, res) => {
  const report = req.body;
  console.warn('[CSP VIOLATION]', report);
  res.status(204).send();
});

// Header: Content-Security-Policy: ...; report-uri /csp-report
```

## Deployment Architecture

### Development

```
┌─ Browser (localhost:3000)
├─ Development Server (localhost:5173)
└─ Backend (localhost:5000, HTTP allowed)

Configuration:
  NODE_ENV=development
  ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
  (HTTPS enforcement disabled)
  (Relaxed CSP)
```

### Production

```
┌─ Browser (HTTPS)
├─ CloudFlare / CDN (HTTPS)
├─ Reverse Proxy / Load Balancer (HTTPS → HTTP internally)
│  └─ Backend (HTTP, behind firewall)
│     (Proxy sets X-Forwarded-Proto: https)
└─ Database (private network)

Configuration:
  NODE_ENV=production
  ALLOWED_ORIGINS=https://app.example.com
  (HTTPS enforcement enabled)
  (Strict CSP)
  (HSTS enabled)
```

### Docker / Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: patternwise-backend
spec:
  containers:
  - name: backend
    env:
    - name: NODE_ENV
      value: "production"
    - name: ALLOWED_ORIGINS
      value: "https://app.example.com"
```

## Best Practices

### 1. Always Use HTTPS in Production

```bash
# ✅ Production
ALLOWED_ORIGINS=https://app.example.com

# ❌ Don't use HTTP in production
ALLOWED_ORIGINS=http://app.example.com
```

### 2. Configure Reverse Proxy Correctly

```nginx
# ✅ Correct: Set X-Forwarded-Proto
proxy_set_header X-Forwarded-Proto $scheme;

# ❌ Wrong: Don't set it to static value
proxy_set_header X-Forwarded-Proto "https";  # This breaks detection
```

### 3. Test CSP in Development

```bash
# Add Report-Only CSP in development
Content-Security-Policy-Report-Only: ...

# Check browser console for violations before enforcing
```

### 4. Update HSTS Preload List

```bash
# Submit domain to HSTS preload list
https://hstspreload.org/

# Requirements:
1. Valid HSTS header with max-age >= 31536000
2. includeSubDomains directive
3. preload directive
```

## Troubleshooting

### "HSTS header not sent in development"

**Expected behavior:**
- Production: Header sent
- Development: Header omitted

**Solution:** Change to production mode to test HSTS

### "CSP blocks legitimate scripts"

**Problem:** Script blocked by strict CSP

**Solution:**
1. Check CSP header: `curl -I https://api.example.com`
2. Update CSP to allow script source (use nonce for inline scripts)
3. Or move script to domain listed in CSP

### "Redirect loop between HTTP and HTTPS"

**Problem:** Infinite redirects

**Cause:** Reverse proxy configuration incorrect

**Solution:**
```nginx
# Check proxy_set_header
proxy_set_header X-Forwarded-Proto $scheme;

# If missing, middleware thinks request is still HTTP
# and keeps redirecting
```

## Future Enhancements

1. **CSP Violation Reporting** - Endpoint to collect CSP violations
2. **Dynamic CSP** - Generate nonce for inline scripts
3. **HTTPS Enforcement Exceptions** - Whitelist certain paths
4. **Security Headers Audit** - Endpoint to check security posture
5. **Rate Limiting per Origin** - Different limits for different sources
6. **Security Event Logging** - Comprehensive security audit trail
