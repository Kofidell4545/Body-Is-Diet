import createSQLite from '@databases/sqlite';
import path from 'path';
import { sql } from '@databases/sqlite';

const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') ?? path.join(__dirname, '../../dev.db');

const db = createSQLite(DB_PATH);

async function bootstrap() {
  await db.query(sql`
    CREATE TABLE IF NOT EXISTS users (
      id                      TEXT PRIMARY KEY,
      name                    TEXT NOT NULL,
      email                   TEXT NOT NULL UNIQUE,
      password                TEXT NOT NULL,
      email_verified          INTEGER NOT NULL DEFAULT 0,
      reset_token             TEXT,
      reset_token_expires_at  TEXT,
      created_at              TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.query(sql`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id          TEXT PRIMARY KEY,
      token       TEXT NOT NULL UNIQUE,
      user_id     TEXT NOT NULL,
      expires_at  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.query(sql`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL UNIQUE,
      goal              TEXT NOT NULL, -- 'lose_weight', 'gain_muscle', 'gain_weight', 'maintain'
      age               INTEGER NOT NULL,
      gender            TEXT NOT NULL,
      height_cm         REAL NOT NULL,
      weight_kg         REAL NOT NULL,
      target_weight_kg  REAL,
      activity_level    TEXT NOT NULL, -- 'sedentary', 'light', 'moderate', 'very_active', 'athlete'
      proteins          TEXT NOT NULL, -- JSON array
      carbs             TEXT NOT NULL, -- JSON array
      avoid_foods       TEXT,          -- JSON array
      favorite_meals    TEXT,          -- JSON array
      meals_per_day     INTEGER NOT NULL DEFAULT 3,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log(`[DB] Connected → ${DB_PATH}`);
}

bootstrap().catch(console.error);

export { sql };
export default db;
