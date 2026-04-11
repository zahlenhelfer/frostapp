import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// API Key authentication middleware
export function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
  // Skip authentication for health check endpoint
  if (req.path === '/health') {
    next();
    return;
  }

  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY || 'dev-api-key-change-in-production';

  if (!apiKey) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'API key is required. Provide it in the X-API-Key header.' 
    });
    return;
  }

  if (apiKey !== validApiKey) {
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Invalid API key.' 
    });
    return;
  }

  next();
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
export function securityLogger(req: Request, res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const method = req.method;
  const path = req.path;
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Log all requests for audit trail
  console.log(`[SECURITY] ${timestamp} | ${ip} | ${method} ${path} | UA: ${userAgent}`);
  
  next();
}
