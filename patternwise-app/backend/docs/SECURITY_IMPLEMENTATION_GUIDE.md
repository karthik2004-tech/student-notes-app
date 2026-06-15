# Security Headers and Transport Policies - Implementation Guide

## Quick Start

### Setup

1. **Environment Variables**
   ```bash
   # .env (development)
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   
   # .env.production
   NODE_ENV=production
   ALLOWED_ORIGINS=https://app.example.com
   ```

2. **Server Configuration**
   ```javascript
   // server.js automatically applies:
   // - HTTPS enforcement (production only)
   // - Security headers (all environments)
   // - Request body size limits (10MB)
   ```

3. **Verify Installation**
   ```bash
   curl -I http://localhost:5000/api/patterns
   
   # Should see security headers:
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   Content-Security-Policy: ...
   ```

## Configuration Reference

### Security Policies Configuration

File: `config/securityPolicies.js`

**Customizing Security Policies:**

```javascript
// To change request body size limit
bodyParser: {
  jsonLimit: '20mb',    // Increase if needed
  urlencodedLimit: '20mb'
}

// To customize CSP for production
csp: {
  production: {
    scriptSrc: ["'self'", "https://cdn.example.com"],  // Allow CDN
    imgSrc: ["'self'", "data:", "https:", "https://images.example.com"]
  }
}

// To customize CORS options
cors: {
  maxAge: 86400,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}
```

### Environment-Based Behavior

**Development**
- HTTP allowed (HTTPS enforcement disabled)
- Relaxed CSP (allows unsafe-eval, unsafe-inline, localhost)
- No HSTS header
- Debug logging enabled

**Production**
- HTTP redirected to HTTPS
- Strict CSP enforced
- HSTS header enabled (1 year)
- Minimal logging

## Middleware Stack Order

```javascript
// Critical order:
1. app.use(httpsEnforcement(config))      // Must be first
2. app.use(cors(corsConfig))               // After HTTPS
3. app.use(securityHeadersMiddleware(config))  // Apply headers
4. app.use(express.json({ limit: '10mb' }))   // Body parsing
5. app.use('/api', apiRoutes)              // Routes
```

## Implementation Details

### HTTPS Enforcement

**File:** `middleware/httpsEnforcement.js`

**How it detects HTTPS:**
```javascript
// Checks in order:
1. req.secure (direct HTTPS)
2. req.get('x-forwarded-proto') === 'https' (reverse proxy)
3. req.get('x-forwarded-proto-version') === 'https' (CloudFlare)
```

**Reverse Proxy Headers (Required for Production):**
```nginx
# Nginx
proxy_set_header X-Forwarded-Proto $scheme;

# Apache
RequestHeader set X-Forwarded-Proto expr=%{REQUEST_SCHEME}

# Node.js reverse proxy
app.set('trust proxy', 1);
```

### Security Headers

**File:** `middleware/securityHeaders.js`

**Production Headers:**
| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME-type sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | Enable XSS filter |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Enforce HTTPS |
| Content-Security-Policy | default-src 'self'; ... | XSS and injection prevention |
| Permissions-Policy | geolocation=(), microphone=(), ... | Disable dangerous features |

**Development Headers:**
Same as production except:
- No Strict-Transport-Security (allows HTTP)
- Relaxed Content-Security-Policy

### Request Body Limits

**File:** `server.js`

**Configuration:**
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

**Error Response (if limit exceeded):**
```
HTTP/1.1 413 Payload Too Large
{
  "status": "error",
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "Request entity too large"
  }
}
```

## Testing

### Unit Tests

```javascript
// test/middleware/securityHeaders.test.js
describe('Security Headers Middleware', () => {
  test('should add X-Content-Type-Options header', () => {
    const req = mockRequest();
    const res = mockResponse();
    const middleware = securityHeadersMiddleware(config);
    
    middleware(req, res, () => {});
    
    expect(res.set).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff'
    );
  });

  test('should add HSTS header in production', () => {
    const prodConfig = { ...config, NODE_ENV: 'production' };
    const middleware = securityHeadersMiddleware(prodConfig);
    
    // Assert HSTS header present
  });

  test('should not add HSTS header in development', () => {
    const devConfig = { ...config, NODE_ENV: 'development' };
    const middleware = securityHeadersMiddleware(devConfig);
    
    // Assert HSTS header absent
  });
});

// test/middleware/httpsEnforcement.test.js
describe('HTTPS Enforcement Middleware', () => {
  test('should redirect HTTP to HTTPS in production', () => {
    const req = mockRequest({ 
      secure: false, 
      get: () => undefined 
    });
    const res = mockResponse();
    const middleware = httpsEnforcement({ NODE_ENV: 'production' });
    
    middleware(req, res, () => {});
    
    expect(res.redirect).toHaveBeenCalledWith(
      301,
      expect.stringContaining('https://')
    );
  });

  test('should not redirect in development', () => {
    const req = mockRequest();
    const res = mockResponse();
    const middleware = httpsEnforcement({ NODE_ENV: 'development' });
    
    middleware(req, res, () => {});
    
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
```

### Integration Tests

```bash
# Test security headers
curl -I https://localhost:5000/api/patterns
# Should include: X-Content-Type-Options, X-Frame-Options, CSP, etc.

# Test HTTPS redirect (production)
curl -I http://localhost:5000/api/patterns
# Should return 301 redirect to https://

# Test request body limit
curl -X POST https://localhost:5000/api/test \
  -H "Content-Type: application/json" \
  -d "$(head -c 11000000 /dev/zero | base64)"
# Should return 413 Payload Too Large

# Test HSTS preload
curl -I https://localhost:5000/api/patterns | grep -i "Strict-Transport-Security"
# Should show: max-age=31536000; includeSubDomains; preload
```

## Common Scenarios

### Scenario 1: Development Setup

```bash
# Create .env
NODE_ENV=development
PORT=5000
HOST=localhost
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Start server
npm start

# Test
curl -I http://localhost:5000/api/patterns
# HTTP works (no redirect)
# Relaxed CSP applied
```

### Scenario 2: Production Deployment (Behind Nginx)

**nginx.conf:**
```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://backend:5000;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

**.env.production:**
```bash
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
ALLOWED_ORIGINS=https://app.example.com
```

**Results:**
- HTTP traffic redirected to HTTPS
- HSTS header sent (1 year)
- Strict CSP enforced
- All security headers applied

### Scenario 3: Docker Production

**Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 5000

ENV NODE_ENV=production
ENV ALLOWED_ORIGINS=https://app.example.com

CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  backend:
    build: .
    environment:
      NODE_ENV: production
      ALLOWED_ORIGINS: https://app.example.com
      PORT: 5000
    ports:
      - "5000:5000"
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    ports:
      - "443:443"
      - "80:80"
```

### Scenario 4: Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: patternwise-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: ALLOWED_ORIGINS
          valueFrom:
            configMapKeyRef:
              name: patternwise-config
              key: allowed-origins
        - name: PORT
          value: "5000"
        livenessProbe:
          httpGet:
            path: /api/patterns
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
```

## Troubleshooting

### Issue: CSP blocks legitimate content

**Symptoms:** Browser console shows CSP violations

**Solution:**
1. Check CSP policy: `curl -I https://api.example.com | grep -i csp`
2. Review browser console for violations
3. Update CSP to allow necessary sources

### Issue: HTTPS redirect infinite loop

**Symptoms:** Browser keeps redirecting

**Cause:** Reverse proxy not setting X-Forwarded-Proto

**Solution:**
```nginx
# Ensure this is set:
proxy_set_header X-Forwarded-Proto $scheme;
```

### Issue: HSTS errors on first visit

**Symptoms:** "HSTS already active" error

**Cause:** Browser cached HSTS from invalid certificate

**Solution:**
1. Clear HSTS cache for domain
2. Use valid SSL certificate
3. Test with incognito/private window

### Issue: Large file uploads fail

**Symptoms:** 413 Payload Too Large

**Solution:** Increase body size limit
```javascript
app.use(express.json({ limit: '50mb' }));
```

## Performance Considerations

### Header Size Impact

```
Average Security Headers: ~500 bytes per response
Impact: Negligible (<1% of typical API response)

Optimization:
- Headers compressed by HTTP/2 (browser support)
- CORS preflight cached (maxAge: 86400)
- HTTP/2 header compression saves bandwidth
```

### HTTPS Performance

```
HTTPS vs HTTP:
- Handshake overhead: 1-2 roundtrips (25-50ms)
- TLS record fragmentation: Minimal with modern configs
- Modern optimization: Session resumption, 0-RTT

Benefits outweigh minor latency cost
```

## Security Audit Checklist

- [ ] HTTPS enforced in production
- [ ] X-Content-Type-Options: nosniff present
- [ ] X-Frame-Options: DENY present
- [ ] CSP configured appropriately
- [ ] HSTS header valid and cached
- [ ] Request body size limit set
- [ ] CORS whitelist specific (not `*`)
- [ ] Security headers tested
- [ ] HSTS preload submitted (if applicable)
- [ ] Reverse proxy headers configured
- [ ] SSL certificate valid and current
- [ ] Security headers monitored

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN: HTTP Strict Transport Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HSTS Preload List](https://hstspreload.org/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
