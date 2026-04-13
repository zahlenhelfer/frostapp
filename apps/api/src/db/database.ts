import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists and prevent path traversal
const RAW_DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const resolvedDataDir = path.resolve(RAW_DATA_DIR);
const allowedBase = path.resolve(process.cwd());
if (!resolvedDataDir.startsWith(allowedBase + path.sep) && resolvedDataDir !== allowedBase) {
  throw new Error('Invalid DATA_DIR: path traversal detected');
}
const DATA_DIR = resolvedDataDir;
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'frostapp.db');

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function initDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (db) return db;

  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON;');

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS fridges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      shelf_count INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shelves (
      id TEXT PRIMARY KEY,
      fridge_id TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fridge_id) REFERENCES fridges(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      shelf_id TEXT NOT NULL,
      name TEXT NOT NULL,
      deposit_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_shelves_fridge_id ON shelves(fridge_id);
    CREATE INDEX IF NOT EXISTS idx_items_shelf_id ON items(shelf_id);
  `);

  console.log(`📦 SQLite database initialized at ${DB_PATH}`);
  return db;
}

export function getDatabase(): Database<sqlite3.Database, sqlite3.Statement> {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('📦 SQLite database connection closed');
  }
}
