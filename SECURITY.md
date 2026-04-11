# FrostApp Security Guide

## Overview

This document describes the security features implemented in FrostApp and provides guidance for secure deployment and usage.

## Security Features

### 1. Authentication

All API endpoints (except `/health`) require API key authentication via the `X-API-Key` header.

```bash
# Example request with API key
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/fridges
```

**Configuration:**
- Set `API_KEY` environment variable for production
- Default dev key: `dev-api-key-change-in-production` (change in production!)

### 2. CORS (Cross-Origin Resource Sharing)

CORS is configured to only allow specific origins:
- Development: `http://localhost:4200`, `http://localhost:3000`
- Production: Configure via `ALLOWED_ORIGINS` environment variable

```bash
# Example: Allow multiple origins
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

### 3. Rate Limiting

Rate limiting is enabled on all API routes:
- Standard limit: 100 requests per 15 minutes per IP
- Returns `429 Too Many Requests` when exceeded

### 4. Security Headers

Helmet.js provides the following security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Content-Security-Policy` (CSP)
- `X-XSS-Protection: 1; mode=block`

### 5. Input Validation

All user inputs are validated and sanitized:
- String length limits (max 100 characters for names)
- XSS prevention (removes `<`, `>`, `javascript:`, event handlers)
- UUID format validation for IDs
- Date format validation (YYYY-MM-DD)
- Numeric range validation

### 6. Error Handling

Error messages do not leak internal details in production:
- Production: Generic error messages
- Development: Detailed error information (set `NODE_ENV=development`)

### 7. Request Size Limits

Request body size is limited to 10KB to prevent DoS attacks.

## Deployment Security

### Environment Variables

Required for production:

```bash
# Required
NODE_ENV=production
API_KEY=your-secure-random-api-key

# Optional
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com
```

**Generate a secure API key:**
```bash
openssl rand -base64 32
```

### Nginx Configuration

The provided `nginx.conf` includes:
- Security headers
- CSP policy
- Request size limits
- Proxy headers for correct IP logging

### HTTPS/TLS

For production, always use HTTPS:

```nginx
# In nginx.conf, uncomment for production:
# listen 443 ssl http2;
# ssl_certificate /path/to/cert.pem;
# ssl_certificate_key /path/to/key.pem;
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## Security Checklist

Before deploying to production:

- [ ] Change default API key (`API_KEY`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` with production domains
- [ ] Enable HTTPS/TLS
- [ ] Review and customize CSP headers if needed
- [ ] Set up log monitoring
- [ ] Configure firewall rules
- [ ] Run `npm audit` to check dependencies

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
