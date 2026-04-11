<!-- From: /Users/marcusross/workspace/privat/kimi-exp/frostapp/AGENTS.md -->
# Project Overview

**Project Name:** FrostApp

**Status:** Active Development with Security Hardening

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Angular 21+ (standalone components, signals) |
| **Backend** | Express.js 4.21.0 (Node.js) |
| **State Management** | NgRx SignalStore |
| **UI Library** | Angular Material |
| **Storage** | SQLite (backend), IndexedDB (frontend) |
| **Container** | Docker + Docker Compose |
| **Web Server** | Nginx (production) |
| **AI Integration** | GitHub MCP Server |

## GitHub MCP Server

This project includes GitHub MCP (Model Context Protocol) server configuration for AI assistants to interact with the repository.

### Configuration Files

- `.cursor/mcp.json` - Cursor IDE MCP configuration
- `mcp.json` - General MCP configuration
- `.github/mcp.yml` - Documentation and setup guide

### Setup

1. **Create GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Required scopes: `repo`, `read:org`, `read:user`
   - Generate and copy the token

2. **Set Environment Variable:**
   ```bash
   export GITHUB_TOKEN="ghp_your_token_here"
   ```

3. **For Cursor IDE:** The configuration is already in `.cursor/mcp.json`

4. **For Claude Desktop:** Add to `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "github": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-github"],
         "env": {
           "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
         }
       }
     }
   }
   ```

### Available MCP Tools

- `search_code` - Search code across the repository
- `search_issues` - Search issues and pull requests
- `create_issue` - Create a new issue
- `create_pull_request` - Create a pull request
- `get_issue` / `update_issue` - Manage issues
- `list_commits` - View commit history
- `get_file_contents` - Read file contents
- `create_branch` / `push_files` - Git operations

---

## Security Implementation

This codebase has been hardened with the following security measures:

### Implemented Security Features

1. **API Key Authentication** - All API endpoints require `X-API-Key` header
2. **Rate Limiting** - 100 requests per 15 minutes per IP
3. **CORS** - Configured for specific origins only
4. **Helmet.js** - Security headers (CSP, XSS protection, etc.)
5. **Input Validation** - XSS prevention, length limits, format validation
6. **Request Size Limits** - 10KB max body size
7. **Error Handling** - No internal details leaked in production

### Security Files

```
apps/api/src/
├── middleware/
│   └── security.ts       # Auth, rate limiting, logging
├── utils/
│   ├── validation.ts     # Input validation & sanitization
│   └── errors.ts         # Custom error classes
└── tests/
    ├── security.test.ts      # Security middleware tests
    └── fridges.security.test.ts  # Route security tests
```

### Environment Variables

```bash
# Required for production
NODE_ENV=production
API_KEY=your-secure-random-key

# Optional
ALLOWED_ORIGINS=https://yourdomain.com
PORT=3000
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development servers
npm run dev

# Run security tests
cd apps/api && npm test

# Build for production
npm run build

# Start production server
npm start
```

## Security Testing

All security fixes include comprehensive tests:

```bash
cd apps/api
npm test

# Test specific security features
npm test -- --grep "Authentication"
npm test -- --grep "XSS Prevention"
npm test -- --grep "Input Validation"
```

## Code Conventions

### API Routes

Always use the error handling pattern:

```typescript
router.post('/endpoint', (req, res, next) => {
  try {
    // Validate input
    const validation = validateInput(req.body.name);
    if (!validation.valid) {
      throw new BadRequestError(validation.error!);
    }
    // ... handle request
  } catch (error) {
    next(error);
  }
});
```

### Input Validation

Always validate and sanitize user inputs:

```typescript
import { validateFridgeName, isValidUUID } from '../utils/validation.js';

// Validate UUIDs
if (!isValidUUID(id)) {
  throw new BadRequestError('Invalid ID format');
}

// Validate strings
const nameValidation = validateFridgeName(req.body.name);
if (!nameValidation.valid) {
  throw new BadRequestError(nameValidation.error!);
}
```

## Important Security Notes

1. **Change the default API key in production** - Default: `dev-api-key-change-in-production`
2. **Always use HTTPS in production** - Configure TLS certificates
3. **Review CSP headers** - Customize `nginx.conf` CSP for your needs
4. **Monitor logs** - Security events are logged with `[SECURITY]` prefix
5. **Run npm audit regularly** - Check for vulnerable dependencies

---

*Last updated: 2026-04-11*
