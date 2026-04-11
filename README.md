# FrostApp - Monorepo

A full-stack fridge management application with Angular frontend and Node.js REST API.

## Architecture

```
frostapp/
├── apps/
│   ├── frontend/          # Angular 21+ SPA
│   └── api/               # Express.js REST API
├── packages/
│   └── shared/            # Shared TypeScript types
├── docker-compose.yml     # Docker orchestration
└── Dockerfile             # Multi-stage build
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

### Docker

```bash
# Start all services
docker-compose up -d

# Access
# Frontend: http://localhost:8080
# API: http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/fridges | List all fridges |
| POST | /api/fridges | Create fridge |
| GET | /api/fridges/:id | Get fridge |
| PATCH | /api/fridges/:id | Update fridge |
| DELETE | /api/fridges/:id | Delete fridge |
| POST | /api/fridges/:id/shelves/:shelfId/items | Add item |
| PATCH | /api/fridges/:id/shelves/:shelfId/items/:itemId | Update item |
| DELETE | /api/fridges/:id/shelves/:shelfId/items/:itemId | Delete item |

## Features

- ✅ Create/Update/Delete fridges with configurable shelves
- ✅ Add frost items with deposit dates
- ✅ German/English i18n (German default)
- ✅ Mobile-first responsive design
- ✅ REST API with in-memory storage
- ✅ Docker support

## Tech Stack

**Frontend:**
- Angular 21+ (standalone components)
- Angular Material
- NgRx SignalStore
- RxJS

**Backend:**
- Express.js
- TypeScript
- UUID generation

**Shared:**
- TypeScript interfaces

## Scripts

```bash
# Root level
npm run dev          # Start API + Frontend concurrently
npm run build        # Build all packages
npm run test         # Run all tests
```

## Project Structure

```
apps/frontend/src/app/
├── components/      # UI components
├── services/        # API & i18n services
├── store/           # NgRx SignalStore
└── pages/           # Route pages

apps/api/src/
├── routes/          # Express routes
└── index.ts         # Server entry

packages/shared/src/
└── types.ts         # Shared interfaces
```
