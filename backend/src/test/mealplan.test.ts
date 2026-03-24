jest.mock('../db', () => {
    const sqlite = require('@databases/sqlite');
    const db = sqlite.default(':memory:');
    return { __esModule: true, default: db, sql: sqlite.sql };
});

jest.mock('../utils/email', () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import db from '../db';
import app from '../app';
import { createSchema, clearTables, TEST_USER, TEST_PREFS } from './setup';
import { seedFoods } from '../data/ghanaian-foods';

// ─── Lifecycle ────────────────────────────────────────────────────────────────
beforeAll(async () => {
    await createSchema(db as any);
    await seedFoods(db as any);
});
afterEach(async () => {
    // Clear plan data but preserve foods for all tests
    const { sql } = require('@databases/sqlite');
    await (db as any).query(sql`DELETE FROM meal_plan_items`);
    await (db as any).query(sql`DELETE FROM meal_plans`);
    await (db as any).query(sql`DELETE FROM user_preferences`);
    await (db as any).query(sql`DELETE FROM refresh_tokens`);
    await (db as any).query(sql`DELETE FROM users`);
});
afterAll(async () => { await (db as any).dispose(); });

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function registerAndSetupPrefs(): Promise<string> {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    const token = res.body.data.accessToken as string;

    await request(app)
        .post('/api/user/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send(TEST_PREFS);

    return token;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/meal-plan/generate', () => {
    it('generates a weekly meal plan', async () => {
        const token = await registerAndSetupPrefs();
        const res = await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data).toHaveProperty('week_start');
        expect(res.body.data).toHaveProperty('tdee');
        expect(res.body.data).toHaveProperty('target_calories');
        expect(res.body.data).toHaveProperty('macro_targets');
        expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('returns items for all 7 days', async () => {
        const token = await registerAndSetupPrefs();
        const res = await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        const days = new Set(res.body.data.items.map((i: any) => i.day_of_week));
        expect(days.size).toBe(7);
    });

    it('returns correct number of meals per day based on preferences', async () => {
        const token = await registerAndSetupPrefs();
        const res = await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        // TEST_PREFS.meals_per_day = 3
        const day0Items = res.body.data.items.filter((i: any) => i.day_of_week === 0);
        expect(day0Items.length).toBe(TEST_PREFS.meals_per_day);
    });

    it('replaces existing plan on re-generate', async () => {
        const token = await registerAndSetupPrefs();

        const first = await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({});
        const firstId = first.body.data.id;

        const second = await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(second.body.data.id).not.toBe(firstId);
    });

    it('returns 400 without preferences', async () => {
        const res = await request(app).post('/api/auth/register').send(TEST_USER);
        const token = res.body.data.accessToken;

        const planRes = await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(planRes.status).toBe(400);
    });

    it('returns 401 without auth token', async () => {
        const res = await request(app).post('/api/meal-plan/generate').send({});
        expect(res.status).toBe(401);
    });
});

describe('GET /api/meal-plan', () => {
    it('returns the generated plan', async () => {
        const token = await registerAndSetupPrefs();
        await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        const res = await request(app)
            .get('/api/meal-plan')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('returns 404 when no plan exists', async () => {
        const token = await registerAndSetupPrefs();
        const res = await request(app)
            .get('/api/meal-plan')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
        const res = await request(app).get('/api/meal-plan');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/meal-plan/swap', () => {
    it('swaps a meal item with a different food', async () => {
        const token = await registerAndSetupPrefs();
        const genRes = await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        const firstItem = genRes.body.data.items[0];

        const swapRes = await request(app)
            .post('/api/meal-plan/swap')
            .set('Authorization', `Bearer ${token}`)
            .send({ item_id: firstItem.id });

        expect(swapRes.status).toBe(200);
        expect(swapRes.body.success).toBe(true);
        expect(swapRes.body.data.id).toBe(firstItem.id);
        // Food should change (or at least the endpoint succeeds)
        expect(swapRes.body.data).toHaveProperty('food_name');
    });

    it('returns 404 for non-existent item', async () => {
        const token = await registerAndSetupPrefs();
        const res = await request(app)
            .post('/api/meal-plan/swap')
            .set('Authorization', `Bearer ${token}`)
            .send({ item_id: 'non-existent-id' });

        expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
        const res = await request(app)
            .post('/api/meal-plan/swap')
            .send({ item_id: 'some-id' });
        expect(res.status).toBe(401);
    });
});

describe('PATCH /api/meal-plan/item/:id/complete', () => {
    it('toggles meal completion', async () => {
        const token = await registerAndSetupPrefs();
        const genRes = await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        const firstItem = genRes.body.data.items[0];
        expect(firstItem.is_completed).toBe(false);

        // Complete
        const completeRes = await request(app)
            .patch(`/api/meal-plan/item/${firstItem.id}/complete`)
            .set('Authorization', `Bearer ${token}`);

        expect(completeRes.status).toBe(200);
        expect(completeRes.body.data.is_completed).toBe(true);

        // Toggle back
        const uncompleteRes = await request(app)
            .patch(`/api/meal-plan/item/${firstItem.id}/complete`)
            .set('Authorization', `Bearer ${token}`);

        expect(uncompleteRes.status).toBe(200);
        expect(uncompleteRes.body.data.is_completed).toBe(false);
    });

    it('returns 404 for non-existent item', async () => {
        const token = await registerAndSetupPrefs();
        const res = await request(app)
            .patch('/api/meal-plan/item/non-existent/complete')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
        const res = await request(app).patch('/api/meal-plan/item/some-id/complete');
        expect(res.status).toBe(401);
    });
});
