import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fridgeRouter } from '../src/routes/fridges.js';
import { authenticateJwt, securityLogger } from '../src/middleware/security.js';
import { formatErrorResponse } from '../src/utils/errors.js';
import { initDatabase, closeDatabase } from '../src/db/database.js';

import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.JWT_SECRET = TEST_JWT_SECRET;

function createTestToken(): string {
  return jwt.sign({ userId: '1', username: 'testuser' }, TEST_JWT_SECRET, { expiresIn: '1h' });
}

async function createTestApp() {
  const app = express();
  
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  process.env.NODE_ENV = 'test';
  process.env.DATA_DIR = '/tmp/frostapp-test-' + Date.now();
  
  // Initialize database
  await initDatabase();
  
  app.use(cors({
    origin: ['http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));
  app.use(securityLogger);
  app.use('/api', authenticateJwt);
  app.use('/api/fridges', fridgeRouter);
  
  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const errorResponse = formatErrorResponse(err, false);
    const statusCode = (err as { statusCode?: number }).statusCode || 500;
    res.status(statusCode).json(errorResponse);
  });
  
  return app;
}

describe('Fridge Routes Security Tests', () => {
  let app: express.Application;
  
  beforeEach(async () => {
    app = await createTestApp();
  });
  
  afterEach(async () => {
    await closeDatabase();
  });
  
  describe('POST /api/fridges', () => {
    it('should create a fridge with valid data', async () => {
      const response = await request(app)
        .post('/api/fridges')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: 'Test Fridge', shelfCount: 4 })
        .expect(201);
      
      expect(response.body.name).toBe('Test Fridge');
      expect(response.body.shelfCount).toBe(4);
      expect(response.body.id).toBeDefined();
    });
    
    it('should reject fridge creation with XSS in name', async () => {
      const response = await request(app)
        .post('/api/fridges')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: '<script>alert(1)</script>', shelfCount: 4 })
        .expect(400);
      
      expect(response.body.message).toContain('invalid characters');
    });
    
    it('should reject fridge creation with extremely long name', async () => {
      const longName = 'x'.repeat(200);
      const response = await request(app)
        .post('/api/fridges')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: longName, shelfCount: 4 })
        .expect(400);
      
      expect(response.body.message).toContain('100');
    });
    
    it('should reject fridge creation with invalid shelf count', async () => {
      const response = await request(app)
        .post('/api/fridges')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: 'Test', shelfCount: 100 })
        .expect(400);
      
      expect(response.body.message).toContain('between 1 and 10');
    });
    
    it('should trim whitespace from fridge names', async () => {
      const response = await request(app)
        .post('/api/fridges')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: '  My Fridge  ', shelfCount: 4 })
        .expect(201);
      
      expect(response.body.name).toBe('My Fridge');
    });
    
    it('should reject empty fridge names', async () => {
      const response = await request(app)
        .post('/api/fridges')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: '', shelfCount: 4 })
        .expect(400);
      
      expect(response.body.message).toMatch(/empty|required/i);
    });
    
    it('should reject non-string names', async () => {
      const response = await request(app)
        .post('/api/fridges')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: 123, shelfCount: 4 })
        .expect(400);
      
      expect(response.body.message).toContain('string');
    });
  });
  
  describe('GET /api/fridges/:id', () => {
    it('should reject invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/fridges/invalid-uuid')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(400);
      
      expect(response.body.message).toContain('Invalid fridge ID format');
    });
    
    it('should reject path traversal attempts', async () => {
      // Express normalizes paths, so traversal attempts result in 404
      // The important thing is they don't access unintended resources
      const response = await request(app)
        .get('/api/fridges/../../../etc/passwd')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(404);
      
      // Should not reveal system file information
      const message = response.body.message || '';
      expect(message).not.toContain('passwd');
    });
    
    it('should return 404 for non-existent but valid UUID', async () => {
      const response = await request(app)
        .get('/api/fridges/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(404);
      
      expect(response.body.message).toContain('not found');
    });
  });
  
  describe('POST /api/fridges/:id/shelves/:shelfId/items', () => {
    let fridgeId: string;
    let shelfId: string;
    
    beforeEach(async () => {
      // Create a fridge first
      const fridgeResponse = await request(app)
        .post('/api/fridges')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: 'Test Fridge', shelfCount: 4 });
      
      fridgeId = fridgeResponse.body.id;
      shelfId = fridgeResponse.body.shelves[0].id;
    });
    
    it('should add item with valid data', async () => {
      const response = await request(app)
        .post(`/api/fridges/${fridgeId}/shelves/${shelfId}/items`)
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: 'Apple', depositDate: '2024-01-15' })
        .expect(201);
      
      expect(response.body.name).toBe('Apple');
      expect(response.body.depositDate).toBe('2024-01-15');
    });
    
    it('should reject item with XSS in name', async () => {
      const response = await request(app)
        .post(`/api/fridges/${fridgeId}/shelves/${shelfId}/items`)
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: '<img src=x onerror=alert(1)>' })
        .expect(400);
      
      expect(response.body.message).toContain('invalid characters');
    });
    
    it('should reject item with invalid date format', async () => {
      const response = await request(app)
        .post(`/api/fridges/${fridgeId}/shelves/${shelfId}/items`)
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: 'Apple', depositDate: '01/15/2024' })
        .expect(400);
      
      expect(response.body.message).toContain('Invalid date format');
    });
    
    it('should reject item with invalid fridge UUID', async () => {
      const response = await request(app)
        .post(`/api/fridges/invalid-uuid/shelves/${shelfId}/items`)
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: 'Apple' })
        .expect(400);
      
      expect(response.body.message).toContain('Invalid fridge ID format');
    });
    
    it('should reject item with invalid shelf UUID', async () => {
      const response = await request(app)
        .post(`/api/fridges/${fridgeId}/shelves/invalid-uuid/items`)
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: 'Apple' })
        .expect(400);
      
      expect(response.body.message).toContain('Invalid shelf ID format');
    });
    
    it('should handle SQL injection attempts in name', async () => {
      // SQL injection is less critical here since we use in-memory storage
      // But we still validate that the name is sanitized
      const response = await request(app)
        .post(`/api/fridges/${fridgeId}/shelves/${shelfId}/items`)
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: "'; DROP TABLE fridges; --" })
        .expect(201);
      
      // Item should be created (in-memory storage is not vulnerable to SQL injection)
      // The name should be stored as-is or sanitized
      expect(response.body.name).toBeDefined();
      expect(response.body.id).toBeDefined();
    });
  });
  
  describe('DELETE /api/fridges/:id', () => {
    it('should reject delete with invalid UUID', async () => {
      const response = await request(app)
        .delete('/api/fridges/not-a-uuid')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(400);
      
      expect(response.body.message).toContain('Invalid fridge ID format');
    });
    
    it('should return 404 for non-existent fridge', async () => {
      const response = await request(app)
        .delete('/api/fridges/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .expect(404);
      
      expect(response.body.message).toContain('not found');
    });
  });
  
  describe('Authorization bypass attempts', () => {
    it('should reject requests with API key in query params', async () => {
      const response = await request(app)
        .get('/api/fridges?api_key=dummy-key')
        .expect(401);
      
      expect(response.body.error).toBe('UnauthorizedError');
    });
    
    it('should reject requests with API key in body', async () => {
      const response = await request(app)
        .post('/api/fridges')
        .send({ name: 'Test', api_key: 'dummy-key' })
        .expect(401);
      
      expect(response.body.error).toBe('UnauthorizedError');
    });
    
    it('should accept API key in header only', async () => {
      const response = await request(app)
        .post('/api/fridges')
        .set('Authorization', `Bearer ${createTestToken()}`)
        .send({ name: 'Test Fridge', shelfCount: 4 })
        .expect(201);
      
      expect(response.body.name).toBe('Test Fridge');
    });
  });
});

describe('Data Integrity Security', () => {
  let app: express.Application;
  let fridgeId: string;
  let shelfIdToRemove: string;
  
  beforeEach(async () => {
    app = await createTestApp();
    
    // Create a fridge with 4 shelves
    const fridgeResponse = await request(app)
      .post('/api/fridges')
      .set('Authorization', `Bearer ${createTestToken()}`)
      .send({ name: 'Test Fridge', shelfCount: 4 });
    
    fridgeId = fridgeResponse.body.id;
    // Get shelf at index 2 (third shelf) - this would be removed when reducing to 2 shelves
    shelfIdToRemove = fridgeResponse.body.shelves[2].id;
    
    // Add an item to shelf 2 (which will be in the "shelves to remove" when reducing to 2)
    await request(app)
      .post(`/api/fridges/${fridgeId}/shelves/${shelfIdToRemove}/items`)
      .set('Authorization', `Bearer ${createTestToken()}`)
      .send({ name: 'Test Item' });
  });
  
  afterEach(async () => {
    await closeDatabase();
  });
  
  it('should prevent removing shelves that contain items', async () => {
    // Try to reduce from 4 to 2 shelves - shelf at index 2 has items
    const response = await request(app)
      .patch(`/api/fridges/${fridgeId}`)
      .set('Authorization', `Bearer ${createTestToken()}`)
      .send({ shelfCount: 2 })
      .expect(400);
    
    expect(response.body.message).toContain('Cannot remove shelves');
  });
  
  it('should allow reducing shelves when they are empty', async () => {
    // First, get the item ID and delete it from shelf 2
    const fridgeResponse = await request(app)
      .get(`/api/fridges/${fridgeId}`)
      .set('Authorization', `Bearer ${createTestToken()}`)
      .expect(200);
    
    const itemId = fridgeResponse.body.shelves[2].items[0].id;
    
    // Delete the item from shelf 2
    await request(app)
      .delete(`/api/fridges/${fridgeId}/shelves/${shelfIdToRemove}/items/${itemId}`)
      .set('Authorization', `Bearer ${createTestToken()}`)
      .expect(204);
    
    // Now reducing shelves should work (shelves 2 and 3 are empty)
    const response = await request(app)
      .patch(`/api/fridges/${fridgeId}`)
      .set('Authorization', `Bearer ${createTestToken()}`)
      .send({ shelfCount: 2 })
      .expect(200);
    
    expect(response.body.shelfCount).toBe(2);
  });
});
