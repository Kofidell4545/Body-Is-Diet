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
}

export async function clearTables(db: Db) {
    await db.query(sql`DELETE FROM user_preferences`);
    await db.query(sql`DELETE FROM refresh_tokens`);
    await db.query(sql`DELETE FROM users`);
}
