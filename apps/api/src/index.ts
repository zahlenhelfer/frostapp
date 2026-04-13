import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fridgeRouter } from './routes/fridges.js';
import { authRouter } from './routes/auth.js';
import { authenticateJwt, standardLimiter, securityLogger } from './middleware/security.js';
import { formatErrorResponse } from './utils/errors.js';
import { initDatabase, closeDatabase } from './db/database.js';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Security: Configure CORS with specific origin
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:4200', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Reject null origins in production; allow in development
    if (!origin) {
      if (isProduction) {
        return callback(new Error('Not allowed by CORS'));
      }
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || !isProduction) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN']
}));

// Security: Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", ...(isProduction ? [] : ['http://localhost:4200', 'http://localhost:8080'])],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow loading resources from same origin
}));

// Security: Request size limits to prevent DoS
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Security: Request logging for audit trail
app.use(securityLogger);

// Security: Rate limiting
app.use('/api', standardLimiter);

// Security: JWT authentication for all API routes
app.use('/api', authenticateJwt);

// Health check (public, no auth required)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes (public, no auth required)
app.use('/auth', authRouter);

// API Routes (protected by authentication)
app.use('/api/fridges', fridgeRouter);

// Security: 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Endpoint not found' });
});

// Security: Global error handler (doesn't leak internal details in production)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  
  const errorResponse = formatErrorResponse(err, isProduction);
  const statusCode = (err as { statusCode?: number }).statusCode || 500;
  
  res.status(statusCode).json(errorResponse);
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize SQLite database
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 FrostApp API Server running on http://localhost:${PORT}`);
      console.log(`🔒 Environment: ${NODE_ENV}`);
      console.log(`🛡️  Security features enabled: CORS, Helmet, Rate Limiting, JWT Auth`);
      console.log(`📦 Database: SQLite (persistent storage)`);
      console.log(`📚 API Documentation:`);
      console.log(`   GET    /health              - Health check (public)`);
      console.log(`   GET    /api/fridges         - List all fridges (requires JWT)`);
      console.log(`   POST   /api/fridges         - Create a new fridge (requires JWT)`);
      console.log(`   GET    /api/fridges/:id     - Get a specific fridge (requires JWT)`);
      console.log(`   PATCH  /api/fridges/:id     - Update a fridge (requires JWT)`);
      console.log(`   DELETE /api/fridges/:id     - Delete a fridge (requires JWT)`);
      console.log(`   POST   /api/fridges/:id/shelves/:shelfId/items - Add item (requires JWT)`);
      console.log(`   PATCH  /api/fridges/:id/shelves/:shelfId/items/:itemId - Update item (requires JWT)`);
      console.log(`   DELETE /api/fridges/:id/shelves/:shelfId/items/:itemId - Delete item (requires JWT)`);
      console.log(`\n⚠️  IMPORTANT: All API endpoints (except /health) require Bearer JWT in Authorization header`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

startServer();
