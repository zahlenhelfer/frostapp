# FrostApp Security Guide

## Overview

This document describes the security features implemented in FrostApp and provides guidance for secure deployment and usage.

## Security Features

### 1. Authentication

All API endpoints (except `/health`) require JWT Bearer authentication.

```bash
# Example request with JWT
curl -H "Authorization: Bearer your-jwt-token" http://localhost:3000/api/fridges
```

**Configuration:**
- Set `JWT_SECRET` environment variable for production (must be a strong random string)
- Default dev secret: `dev-jwt-secret-change-in-production` (only used when `NODE_ENV !== 'production'`)
- The server will **refuse to start** in production if `JWT_SECRET` is not set

### 2. CORS (Cross-Origin Resource Sharing)

CORS is configured to only allow specific origins:
- Development: `http://localhost:4200`, `http://localhost:3000`
- Production: Configure via `ALLOWED_ORIGINS` environment variable
- **Null origins are rejected in production** (e.g., `curl`, embedded browsers)

```bash
# Example: Allow multiple origins
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

### 3. Rate Limiting

Rate limiting is enabled on all API routes:
- Standard limit: 100 requests per 15 minutes per IP
- Auth limit: 10 requests per 15 minutes per IP (login / register)
- Returns `429 Too Many Requests` when exceeded

### 4. Security Headers

Helmet.js and Nginx provide the following security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Content-Security-Policy` (CSP)
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (restricts sensitive APIs)

### 5. Input Validation

All user inputs are validated and sanitized:
- String length limits (max 100 characters for names)
- XSS prevention (rejects `<script>`, event handlers, `javascript:`, `<iframe>`, `<object>`, `<embed>`)
- UUID format validation for IDs
- Date format validation (YYYY-MM-DD)
- Numeric range validation
- **Password policy:** minimum 8 characters with at least one uppercase, one lowercase, one digit, and one special character

### 6. Error Handling

Error messages do not leak internal details in production:
- Production: Generic error messages
- Development: Detailed error information (set `NODE_ENV=development`)

### 7. Request Size Limits

Request body size is limited to 10KB to prevent DoS attacks.

### 8. Password Hashing

Passwords are hashed using **bcrypt with 12 rounds**.

## Deployment Security

### Environment Variables

Required for production:

```bash
# Required
NODE_ENV=production
JWT_SECRET=your-secure-random-secret-min-32-characters

# Optional
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com
DATA_DIR=/app/data
```

**Generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

### Nginx Configuration

The provided `nginx.conf` includes:
- Security headers
- CSP policy (no localhost references in production)
- Request size limits
- Proxy headers for correct IP logging
- Gzip compression

### HTTPS/TLS

For production, always use HTTPS:

```nginx
# In nginx.conf, uncomment for production:
# listen 443 ssl http2;
# ssl_certificate /path/to/cert.pem;
# ssl_certificate_key /path/to/key.pem;
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### Container Security

The API Docker image runs as a non-root user (`nodejs`) for reduced blast radius.
Resource limits are configured in `docker-compose.yml`.

## Security Checklist

Before deploying to production:

- [ ] Set a strong `JWT_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` with production domains
- [ ] Enable HTTPS/TLS
- [ ] Review and customize CSP headers if needed
- [ ] Set up log monitoring
- [ ] Configure firewall rules
- [ ] Run `npm audit` to check dependencies

## CI Security

The pipeline should include:
- `npm audit --audit-level=moderate`
- Container image scanning
- Dependency review on pull requests

## Running Security Tests

```bash
# Install dependencies
npm install

# Run security tests
cd apps/api && npm test

# Run with coverage
npm run test -- --coverage
```

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do not open a public issue
2. Email security@example.com with details
3. Allow time for the issue to be addressed before public disclosure

## Security History

| Date | Version | Changes |
|------|---------|---------|
| 2024-04-11 | 1.0.0 | Initial security implementation: API auth, rate limiting, input validation, CSP |
| 2026-04-13 | 2.2.0 | Migrated to JWT auth, strengthened password policy, fixed XSS validation, added auth rate limiting, non-root container |
