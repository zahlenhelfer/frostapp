import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authenticateJwt, standardLimiter, securityLogger } from '../src/middleware/security.js';
import { formatErrorResponse, BadRequestError, NotFoundError } from '../src/utils/errors.js';
import { validateFridgeName, validateShelfCount, validateItemName, validateDepositDate, isValidUUID } from '../src/utils/validation.js';

import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.JWT_SECRET = TEST_JWT_SECRET;

function createTestToken(): string {
  return jwt.sign({ userId: '1', username: 'testuser' }, TEST_JWT_SECRET, { expiresIn: '1h' });
}

// Create test app
function createTestApp() {
  const app = express();
  
  // Set test environment
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  process.env.NODE_ENV = 'test';
  
  // Security middleware
  app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));
  app.use(securityLogger);
  
  // Auth middleware
  app.use('/api', authenticateJwt);
  
  // Test routes
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  
  app.get('/api/test', (_req, res) => {
    res.json({ message: 'success' });
  });
  
  app.post('/api/test', (req, res) => {
    res.json({ received: req.body });
  });
  
  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorResponse = formatErrorResponse(err, isProduction);
    const statusCode = (err as { statusCode?: number }).statusCode || 500;
    res.status(statusCode).json(errorResponse);
  });
  
  return app;
}

describe('Security Tests', () => {
  let app: express.Application;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  describe('Authentication', () => {
    it('should allow access to health endpoint without API key', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('ok');
    });
    
    it('should reject API requests without JWT token', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(401);
      
      expect(response.body.error).toBe('UnauthorizedError');
      expect(response.body.message).toContain('Authentication required');
    });
    
    it('should reject API requests with invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.error).toBe('UnauthorizedError');
      expect(response.body.message).toContain('Invalid or expired token');
    });
    
    it('should allow API requests with valid JWT token', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(200);
      
      expect(response.body.message).toBe('success');
    });
  });
  
  describe('CORS', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:4200')
        .expect(200);
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
    
    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:4200')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);
      
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });
  
  describe('Helmet Security Headers', () => {
    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
    
    it('should include X-Frame-Options header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
    
    it('should include Content-Security-Policy header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });
  
  describe('Request Body Limits', () => {
    it('should reject requests with body exceeding 10kb', async () => {
      const largeBody = { data: 'x'.repeat(20 * 1024) };
      
      const response = await request(app)
        .post('/api/test')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(largeBody)
        .expect(413); // Payload Too Large
    });
    
    it('should accept requests with body under 10kb', async () => {
      const smallBody = { name: 'test' };
      
      const response = await request(app)
        .post('/api/test')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send(smallBody)
        .expect(200);
      
      expect(response.body.received).toEqual(smallBody);
    });
  });
  
  describe('Error Handling', () => {
    it('should not leak stack traces in production', () => {
      const error = new Error('Test error');
      const response = formatErrorResponse(error, true);
      
      expect(response.stack).toBeUndefined();
      expect(response.message).not.toContain('Test error');
    });
    
    it('should include stack traces in development', () => {
      const error = new Error('Test error');
      const response = formatErrorResponse(error, false);
      
      expect(response.stack).toBeDefined();
      expect(response.message).toBe('Test error');
    });
    
    it('should handle custom AppErrors correctly', () => {
      const error = new BadRequestError('Invalid input');
      const response = formatErrorResponse(error, false);
      
      expect(response.message).toBe('Invalid input');
      expect((error as { statusCode: number }).statusCode).toBe(400);
    });
  });
});

describe('Input Validation', () => {
  describe('validateFridgeName', () => {
    it('should validate valid fridge names', () => {
      const result = validateFridgeName('My Fridge');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('My Fridge');
    });
    
    it('should reject empty names', () => {
      const result = validateFridgeName('');
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/empty|required/i);
    });
    
    it('should reject whitespace-only names', () => {
      const result = validateFridgeName('   ');
      expect(result.valid).toBe(false);
    });
    
    it('should reject names exceeding max length', () => {
      const longName = 'x'.repeat(101);
      const result = validateFridgeName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('100');
    });
    
    it('should reject names with HTML tags', () => {
      const result = validateFridgeName('<script>alert(1)</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });
    
    it('should reject names with JavaScript protocol', () => {
      const result = validateFridgeName('javascript:alert(1)');
      expect(result.valid).toBe(false);
    });
    
    it('should trim whitespace from valid names', () => {
      const result = validateFridgeName('  My Fridge  ');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('My Fridge');
    });
  });
  
  describe('validateShelfCount', () => {
    it('should validate valid shelf counts', () => {
      const result = validateShelfCount(5);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
    });
    
    it('should accept minimum value of 1', () => {
      const result = validateShelfCount(1);
      expect(result.valid).toBe(true);
    });
    
    it('should accept maximum value of 10', () => {
      const result = validateShelfCount(10);
      expect(result.valid).toBe(true);
    });
    
    it('should reject values below 1', () => {
      const result = validateShelfCount(0);
      expect(result.valid).toBe(false);
    });
    
    it('should reject values above 10', () => {
      const result = validateShelfCount(11);
      expect(result.valid).toBe(false);
    });
    
    it('should reject non-numeric values', () => {
      const result = validateShelfCount('abc');
      expect(result.valid).toBe(false);
    });
    
    it('should accept numeric strings', () => {
      const result = validateShelfCount('5');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
    });
  });
  
  describe('validateItemName', () => {
    it('should validate valid item names', () => {
      const result = validateItemName('Apple');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Apple');
    });
    
    it('should reject empty names', () => {
      const result = validateItemName('');
      expect(result.valid).toBe(false);
    });
    
    it('should reject names with XSS attempts', () => {
      const result = validateItemName('<img src=x onerror=alert(1)>');
      expect(result.valid).toBe(false);
    });
  });
  
  describe('validateDepositDate', () => {
    it('should validate valid date strings', () => {
      const result = validateDepositDate('2024-01-15');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('2024-01-15');
    });
    
    it('should default to today when no date provided', () => {
      const result = validateDepositDate(undefined);
      expect(result.valid).toBe(true);
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
    
    it('should reject invalid date formats', () => {
      const result = validateDepositDate('15-01-2024');
      expect(result.valid).toBe(false);
    });
    
    it('should reject invalid dates', () => {
      const result = validateDepositDate('2024-13-45');
      expect(result.valid).toBe(false);
    });
  });
  
  describe('isValidUUID', () => {
    it('should validate valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
    
    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
    });
    
    it('should reject empty strings', () => {
      expect(isValidUUID('')).toBe(false);
    });
    
    it('should reject UUIDs with wrong version', () => {
      // Version 6 is not valid
      expect(isValidUUID('550e8400-e29b-61d4-a716-446655440000')).toBe(false);
    });
  });
});

describe('XSS Prevention', () => {
  it('should sanitize script tags in names', () => {
    const result = validateFridgeName('<script>alert("xss")</script>');
    expect(result.valid).toBe(false);
  });
  
  it('should sanitize event handlers', () => {
    const result = validateFridgeName('" onclick="alert(1)');
    expect(result.valid).toBe(false);
  });
  
  it('should sanitize javascript: protocol', () => {
    const result = validateFridgeName('javascript:alert(1)');
    expect(result.valid).toBe(false);
  });
  
  it('should allow safe special characters', () => {
    const result = validateFridgeName('Fridge @ Home #1 (Main)');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('Fridge @ Home #1 (Main)');
  });
});
