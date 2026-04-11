# FrostApp - Monorepo

A full-stack fridge management application with Angular frontend and Node.js REST API. Features **offline-first architecture** with automatic background sync and **SQLite persistent storage**.

## Architecture

```
frostapp/
├── apps/
│   ├── frontend/          # Angular 21+ SPA with offline support
│   └── api/               # Express.js REST API with security hardening
├── packages/
│   └── shared/            # Shared TypeScript types
├── docker-compose.yml     # Docker orchestration
├── Dockerfile             # Multi-stage build
└── .github/workflows/     # CI/CD for automated releases
```

## Quick Start

### Prerequisites
- Node.js 22+
- npm 11+

### Install & Run

```bash
# Install all dependencies
npm install

# Build shared package
npm run build --workspace=@frostapp/shared

# Terminal 1: Start API
npm run dev:api

# Terminal 2: Start Frontend
npm run dev:frontend
```

Access:
- Frontend: http://localhost:4200
- API: http://localhost:3000

## Development

### Individual Apps

```bash
# Frontend only
cd apps/frontend
npm install
npm start

# API only
cd apps/api
npm install
npm run dev
```

### Docker (Local Build)

```bash
# Start all services with local build
docker-compose up -d

# Access
# Frontend: http://localhost:8080
# API: http://localhost:3000
```

### Docker (Pre-built Images from GHCR)

```bash
# Use published images from GitHub Container Registry
# See docker-compose.ghcr.yml example below
docker-compose -f docker-compose.ghcr.yml up -d
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/fridges | List all fridges |
| POST | /api/fridges | Create fridge |
| GET | /api/fridges/:id | Get fridge |
| PATCH | /api/fridges/:id | Update fridge |
| DELETE | /api/fridges/:id | Delete fridge |
| PATCH | /api/fridges/:id/shelves/:shelfId | Update shelf name |
| POST | /api/fridges/:id/shelves/:shelfId/items | Add item |
| PATCH | /api/fridges/:id/shelves/:shelfId/items/:itemId | Update item |
| DELETE | /api/fridges/:id/shelves/:shelfId/items/:itemId | Delete item |

## Features

### Core Features
- ✅ Create/Update/Delete fridges with configurable shelves
- ✅ Add frost items with deposit dates (Einfrierdatum)
- ✅ German/English i18n (German default) with language switcher
- ✅ Mobile-first responsive design with Angular Material
- ✅ REST API with **SQLite persistent storage** (data survives restarts)
- ✅ Full CRUD for fridges, shelves, and items

### Offline-First Capabilities ⭐
- ✅ **IndexedDB Storage** - All data cached locally
- ✅ **Offline Detection** - Automatic network status monitoring
- ✅ **Optimistic Updates** - UI updates immediately, syncs in background
- ✅ **Pending Operations Queue** - Changes queued when offline
- ✅ **Automatic Background Sync** - Syncs when connection restored
- ✅ **Sync Status Indicator** - Visual indicator of sync state
- ✅ **Conflict Resolution** - Retries failed operations (3 attempts)
- ✅ **Offline Banner** - Visual notification when offline

### Security Features 🔒
- ✅ **API Key Authentication** - All API endpoints require `X-API-Key` header
- ✅ **Rate Limiting** - 100 requests per 15 minutes per IP
- ✅ **CORS** - Configured for specific origins only
- ✅ **Helmet.js** - Security headers (CSP, XSS protection, etc.)
- ✅ **Input Validation** - XSS prevention, length limits, format validation
- ✅ **Request Size Limits** - 10KB max body size
- ✅ **Error Handling** - No internal details leaked in production

### CI/CD 🚀
- ✅ **GitHub Actions** - Automated Docker builds on release tags
- ✅ **GitHub Container Registry** - Images published to GHCR
- ✅ **Multi-architecture** - Supports linux/amd64 and linux/arm64
- ✅ **Semantic Versioning** - Automatic tagging (v1.0.0, 1.0, 1)
- ✅ **SBOM Generation** - CycloneDX and SPDX formats on every release

### SBOM (Software Bill of Materials)

On every release, SBOMs are automatically generated and attached to the GitHub Release:

| Component | CycloneDX | SPDX |
|-----------|-----------|------|
| API | `apps/api/sbom/sbom.cyclonedx.json` | `apps/api/sbom/sbom.spdx.json` |
| Frontend | `apps/frontend/sbom/sbom.cyclonedx.json` | `apps/frontend/sbom/sbom.spdx.json` |

Access SBOMs from the [Releases](https://github.com/zahlenhelfer/frostapp/releases) page.

## Tech Stack

**Frontend:**
- Angular 21+ (standalone components, signals)
- Angular Material
- NgRx SignalStore with rxMethod
- RxJS
- HttpClient
- IndexedDB (via idb library)

**Backend:**
- Express.js
- TypeScript
- SQLite (persistent storage)
- UUID generation
- Helmet.js (security headers)
- express-rate-limit (rate limiting)

**DevOps:**
- Docker & Docker Compose
- Nginx (production frontend)
- GitHub Actions (CI/CD)
- GitHub Container Registry (GHCR)

**Shared:**
- TypeScript interfaces

## Scripts

```bash
# Root level
npm run dev          # Start API + Frontend concurrently
npm run build        # Build all packages
npm run test         # Run all tests

# Development
npm run dev:api      # Start API only
npm run dev:frontend # Start Frontend only
```

## Using Pre-built Docker Images

Images are automatically published to GitHub Container Registry on releases:

```bash
# Create and push a tag to trigger the workflow
git tag v1.0.0
git push origin v1.0.0
```

### docker-compose.ghcr.yml

```yaml
services:
  api:
    image: ghcr.io/zahlenhelfer/frostapp-api:v1.0.7
    container_name: frostapp-api
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - API_KEY=your-secure-api-key
      - DATA_DIR=/app/data
    volumes:
      - frostapp-data:/app/data

  frontend:
    image: ghcr.io/zahlenhelfer/frostapp-frontend:v1.0.7
    container_name: frostapp-frontend
    ports:
      - "8080:80"
    restart: unless-stopped
    depends_on:
      - api

volumes:
  frostapp-data:
```

## Project Structure

```
apps/frontend/src/app/
├── components/      # UI components
├── services/        # API, i18n, offline storage, network status, sync services
├── store/           # NgRx SignalStore (offline-aware)
└── pages/           # Route pages

apps/api/src/
├── middleware/      # Security middleware (auth, rate limiting)
├── routes/          # Express routes
├── utils/           # Validation & error utilities
├── tests/           # Security and API tests
└── index.ts         # Server entry

packages/shared/src/
└── types.ts         # Shared interfaces
```

## Security Configuration

### Environment Variables

```bash
# Required for production
NODE_ENV=production
API_KEY=your-secure-random-key

# Optional
ALLOWED_ORIGINS=https://yourdomain.com
PORT=3000
DATA_DIR=/app/data
```

### API Key Usage

All API requests must include the header:
```
X-API-Key: your-api-key
```

## Testing Offline Mode

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Toggle "Offline" checkbox
4. Make changes in the app (they persist locally)
5. Disable "Offline" to see automatic sync

## Browser Support

- Chrome/Edge (recommended for best offline support)
- Firefox
- Safari
- Mobile browsers with IndexedDB support
