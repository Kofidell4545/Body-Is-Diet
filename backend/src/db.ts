import createSQLite from '@databases/sqlite';
import path from 'path';
import { sql } from '@databases/sqlite';
import { seedFoods } from './data/ghanaian-foods';

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

  await db.query(sql`
    CREATE TABLE IF NOT EXISTS foods (
      id                    TEXT PRIMARY KEY,
      name                  TEXT NOT NULL,
      category              TEXT NOT NULL,
      calories_per_serving  REAL NOT NULL,
      protein_g             REAL NOT NULL,
      carbs_g               REAL NOT NULL,
      fats_g                REAL NOT NULL,
      serving_size          TEXT NOT NULL,
      serving_weight_g      REAL NOT NULL,
      tags                  TEXT NOT NULL DEFAULT '[]',
      image_url             TEXT
    )
  `);

  await db.query(sql`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      week_start        TEXT NOT NULL,
      tdee              REAL NOT NULL,
      target_calories   REAL NOT NULL,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, week_start)
    )
  `);

  await db.query(sql`
    CREATE TABLE IF NOT EXISTS meal_plan_items (
      id              TEXT PRIMARY KEY,
      meal_plan_id    TEXT NOT NULL,
      day_of_week     INTEGER NOT NULL,
      meal_slot       TEXT NOT NULL,
      food_id         TEXT NOT NULL,
      food_name       TEXT NOT NULL,
      servings        REAL NOT NULL DEFAULT 1,
      calories        REAL NOT NULL,
      protein_g       REAL NOT NULL,
      carbs_g         REAL NOT NULL,
      fats_g          REAL NOT NULL,
      is_completed    INTEGER NOT NULL DEFAULT 0,
      swapped_from    TEXT,
      FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (food_id) REFERENCES foods(id)
    )
  `);

  await seedFoods(db);

  console.log(`[DB] Connected → ${DB_PATH}`);
}

bootstrap().catch(console.error);

export { sql };
export default db;
