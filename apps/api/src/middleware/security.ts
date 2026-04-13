import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    return 'dev-jwt-secret-change-in-production';
  }
  return secret;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; username: string };
    }
  }
}

// JWT authentication middleware
export function authenticateJwt(req: Request, _res: Response, next: NextFunction): void {
  // Skip authentication for health check endpoint and auth routes
  if (req.path === '/health' || req.path.startsWith('/auth')) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authentication required. Provide a Bearer token in the Authorization header.'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: string; username: string };
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token.'));
  }
}

// Rate limiting configurations
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs (for sensitive operations)
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security event logger
export function securityLogger(req: Request, _res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const method = req.method;
  const path = req.path;
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Log all requests for audit trail
  console.log(`[SECURITY] ${timestamp} | ${ip} | ${method} ${path} | UA: ${userAgent}`);
  
  next();
}
