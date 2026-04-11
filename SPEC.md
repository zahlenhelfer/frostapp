# FrostApp Specification

## Project Overview

FrostApp is a full-stack monorepo for managing freezer/fridge contents with a REST API backend and Angular frontend. Features **offline-first** architecture with automatic background sync.

always try to build the containers after implementing new featrures.
always try to start the compose stack.
if you implemented a feature from the "new feature" chapter, move it out of this chapter

## Architecture

```
frostapp/
├── apps/
│   ├── frontend/           # Angular app (port 4200)
│   │   ├── src/app/
│   │   │   ├── components/    # UI components
│   │   │   ├── services/      # API, i18n, offline, sync services
│   │   │   ├── store/         # NgRx SignalStore (offline-aware)
│   │   │   └── pages/         # Route pages
│   │   └── package.json
│   └── api/                # Express.js REST API (port 3000)
│       ├── src/
│       │   ├── routes/        # API routes
│       │   └── index.ts       # Server entry
│       └── package.json
├── packages/
│   └── shared/             # Shared TypeScript types
│       ├── src/types.ts
│       └── package.json
├── docker-compose.yml      # Docker orchestration
├── Dockerfile              # Multi-stage builds
└── package.json            # npm workspaces
```

## Key Features

### Backend (API)

- ✅ REST API with Express.js
- ✅ ~~In-memory storage (resets on restart)~~ **SQLite persistent storage**
- ✅ Full CRUD for fridges
- ✅ Full CRUD for frost items
- ✅ CORS enabled
- ✅ Health check endpoint
- ✅ Data persistence across container restarts

### Frontend

- ✅ Create/Update/Delete fridges with name and number of shelves
- ✅ Each shelf can have many contents (frost items)
- ✅ Frost items with name and deposit date (Einfrierdatum)
- ✅ German i18n with English option
- ✅ Language switcher (German default)
- ✅ Mobile-first responsive design
- ✅ Angular Material UI
- ✅ NgRx SignalStore state management
- ✅ HTTP client for API communication

### Offline-First Capabilities ⭐ NEW

- ✅ **IndexedDB Storage** - All data cached locally
- ✅ **Offline Detection** - Automatic network status monitoring
- ✅ **Optimistic Updates** - UI updates immediately, syncs in background
- ✅ **Pending Operations Queue** - Changes queued when offline
- ✅ **Automatic Background Sync** - Syncs when connection restored
- ✅ **Sync Status Indicator** - Visual indicator of sync state
- ✅ **Conflict Resolution** - Retries failed operations (3 attempts)
- ✅ **Offline Banner** - Visual notification when offline

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/fridges | List all fridges |
| POST | /api/fridges | Create new fridge |
| GET | /api/fridges/:id | Get specific fridge |
| PATCH | /api/fridges/:id | Update fridge |
| DELETE | /api/fridges/:id | Delete fridge |
| POST | /api/fridges/:id/shelves/:shelfId/items | Add item to shelf |
| PATCH | /api/fridges/:id/shelves/:shelfId/items/:itemId | Update item |
| DELETE | /api/fridges/:id/shelves/:shelfId/items/:itemId | Delete item |
| PATCH | /api/fridges/:id/shelves/:shelfId | Update shelf name |

## Offline Behavior

### When Online

1. All data fetched from API and cached in IndexedDB
2. Changes sent immediately to API
3. On API failure, operation queued for retry

### When Offline

1. Data loaded from IndexedDB cache
2. Changes saved locally and queued for sync
3. Optimistic UI updates show changes immediately
4. Offline banner displayed
5. Sync indicator shows pending count

### When Coming Back Online

1. Automatic background sync triggered
2. Pending operations executed in order
3. UI updates with server-confirmed data
4. Sync status indicator updated

## Translation Mapping

| English | German |
|---------|--------|
| Fridge | Gefrierschrank |
| Shelf | Fach |
| Item | Gefriergut |
| Deposit Date | Einfrierdatum |

## Development Commands

```bash
# Install dependencies
npm install

# Build shared package
npm run build --workspace=@frostapp/shared

# Start API (http://localhost:3000)
npm run dev:api

# Start Frontend (http://localhost:4200)
npm run dev:frontend

# Start both
npm run dev

# Run tests
npm test

# Docker
docker-compose up -d
```

## Testing Offline Mode

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Toggle "Offline" checkbox
4. Make changes in the app
5. Disable "Offline" to see automatic sync

### Expected Behavior

- Changes persist while offline
- Pending count shown in sync indicator
- Orange offline banner displayed
- Changes sync automatically when back online

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
- UUID
- CORS

**Shared:**

- TypeScript interfaces

**DevOps:**

- Docker & Docker Compose
- Nginx (production)
- npm workspaces

## Services Overview

| Service | Purpose |
|---------|---------|
| `FridgeApiService` | HTTP calls to REST API |
| `OfflineStorageService` | IndexedDB operations |
| `NetworkStatusService` | Online/offline detection |
| `SyncService` | Background sync queue |
| `I18nService` | Translations (de/en) |

## Browser Support

- Chrome/Edge (recommended for best offline support)
- Firefox
- Safari
- Mobile browsers with IndexedDB support

# new feature

<!-- Add new features here -->
