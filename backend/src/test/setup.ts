/**
 * Pure test helpers — no Jest globals here.
 * Import these into test files and call them from beforeAll / afterEach / afterAll.
 */
import { sql } from '@databases/sqlite';

type Db = { query: (q: any) => Promise<any[]>; dispose: () => Promise<void> };

export async function createSchema(db: Db) {
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
            goal              TEXT NOT NULL,
            age               INTEGER NOT NULL,
            gender            TEXT NOT NULL,
            height_cm         REAL NOT NULL,
            weight_kg         REAL NOT NULL,
            target_weight_kg  REAL,
            activity_level    TEXT NOT NULL,
            proteins          TEXT NOT NULL,
            carbs             TEXT NOT NULL,
            avoid_foods       TEXT,
            favorite_meals    TEXT,
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
            image_url             TEXT,
            glycemic_index        REAL,
            prep_method           TEXT,
            region                TEXT DEFAULT '[]',
            cost_tier             TEXT,
            pairs_with            TEXT DEFAULT '[]'
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
}

export async function clearTables(db: Db) {
    await db.query(sql`DELETE FROM meal_plan_items`);
    await db.query(sql`DELETE FROM meal_plans`);
    await db.query(sql`DELETE FROM foods`);
    await db.query(sql`DELETE FROM user_preferences`);
    await db.query(sql`DELETE FROM refresh_tokens`);
    await db.query(sql`DELETE FROM users`);
}

/** Shared test data */
export const TEST_USER = { name: 'Kofi Test', email: 'kofi@example.com', password: 'secure123' };

export const TEST_PREFS = {
    goal: 'gain_muscle' as const,
    age: 24,
    gender: 'male' as const,
    height_cm: 178,
    weight_kg: 72,
    target_weight_kg: 80,
    activity_level: 'moderate' as const,
    proteins: ['Chicken', 'Fish'],
    carbs: ['Rice', 'Yam'],
    avoid_foods: [],
    favorite_meals: ['Jollof Rice', 'Waakye'],
    meals_per_day: 3,
};
