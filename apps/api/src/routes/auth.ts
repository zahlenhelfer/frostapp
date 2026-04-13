import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/database.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';
import type { LoginRequest, RegisterRequest, AuthResponse, UserProfile } from '@frostapp/shared';

const router = Router();

const BCRYPT_ROUNDS = 10;

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
}

// Helper to generate JWT
function generateToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, getJwtSecret(), { expiresIn: '24h' });
}

// POST /auth/register - Register a new user (allows only first user in production)
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body as RegisterRequest;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      throw new BadRequestError('Username must be at least 3 characters');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters');
    }

    const db = getDatabase();

    // In production, only allow registration if no users exist yet
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      const existingUsers = await db.get('SELECT COUNT(*) as count FROM users');
      if (existingUsers && (existingUsers as { count: number }).count > 0) {
        throw new BadRequestError('Registration is disabled. Please contact the administrator.');
      }
    }

    // Check for duplicate username
    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', username.trim());
    if (existingUser) {
      throw new BadRequestError('Username already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username.trim(), passwordHash]
    );

    const userId = (result as { lastID: number }).lastID;
    const token = generateToken(String(userId), username.trim());

    const response: AuthResponse = {
      token,
      user: { id: String(userId), username: username.trim() },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// POST /auth/login - Authenticate user and return JWT
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body as LoginRequest;

    if (!username || !password) {
      throw new BadRequestError('Username and password are required');
    }

    const db = getDatabase();
    const userRow = await db.get(
      'SELECT id, username, password_hash FROM users WHERE username = ?',
      username.trim()
    );

    if (!userRow) {
      throw new UnauthorizedError('Invalid username or password');
    }

    const { id, username: dbUsername, password_hash: passwordHash } = userRow as {
      id: number;
      username: string;
      password_hash: string;
    };

    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid username or password');
    }

    const token = generateToken(String(id), dbUsername);

    const response: AuthResponse = {
      token,
      user: { id: String(id), username: dbUsername },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /auth/me - Get current user profile
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required');
    }

    const token = authHeader.slice(7);
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const db = getDatabase();
    const userRow = await db.get('SELECT id, username FROM users WHERE id = ?', payload.userId);

    if (!userRow) {
      throw new UnauthorizedError('User not found');
    }

    const profile: UserProfile = {
      id: String((userRow as { id: number }).id),
      username: (userRow as { username: string }).username,
    };

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
