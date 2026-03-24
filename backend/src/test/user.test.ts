jest.mock('../db', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
import { createSchema, clearTables } from './setup';

// ─── Lifecycle ────────────────────────────────────────────────────────────────
beforeAll(async () => { await createSchema(db as any); });
afterEach(async () => { await clearTables(db as any); });
afterAll(async () => { await (db as any).dispose(); });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const VALID_USER = { name: 'Kofi Test', email: 'kofi@example.com', password: 'secure123' };

const VALID_PREFS = {
    goal: 'gain_muscle',
    age: 24,
    gender: 'male',
    height_cm: 178,
    weight_kg: 72,
    target_weight_kg: 80,
    activity_level: 'moderate',
    proteins: ['Chicken', 'Eggs'],
    carbs: ['Rice', 'Yam'],
    avoid_foods: [],
    favorite_meals: ['Jollof Rice', 'Waakye'],
    meals_per_day: 4,
};

async function getAuthToken(): Promise<string> {
    const res = await request(app).post('/api/auth/register').send(VALID_USER);
    return res.body.data.accessToken as string;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/user/preferences', () => {
    it('returns 200 when authenticated with valid data', async () => {
        const token = await getAuthToken();
        const res = await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${token}`)
            .send(VALID_PREFS);
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/saved/i);
    });

    it('returns 401 without auth token', async () => {
        const res = await request(app).post('/api/user/preferences').send(VALID_PREFS);
        expect(res.status).toBe(401);
    });

    it('returns 400 when goal is invalid', async () => {
        const token = await getAuthToken();
        const res = await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...VALID_PREFS, goal: 'become_superhero' });
        expect(res.status).toBe(400);
    });

    it('returns 400 when required field (age) is missing', async () => {
        const token = await getAuthToken();
        const { age, ...withoutAge } = VALID_PREFS;
        const res = await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${token}`)
            .send(withoutAge);
        expect(res.status).toBe(400);
    });

    it('updates correctly on second save (upsert)', async () => {
        const token = await getAuthToken();
        await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${token}`)
            .send(VALID_PREFS);

        await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...VALID_PREFS, weight_kg: 75, goal: 'maintain' });

        const getRes = await request(app)
            .get('/api/user/preferences')
            .set('Authorization', `Bearer ${token}`);
        expect(getRes.body.weight_kg).toBe(75);
        expect(getRes.body.goal).toBe('maintain');
    });
});

describe('GET /api/user/preferences', () => {
    it('returns 404 before any preferences are saved', async () => {
        const token = await getAuthToken();
        const res = await request(app)
            .get('/api/user/preferences')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });

    it('returns 200 with correct data after saving', async () => {
        const token = await getAuthToken();
        await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${token}`)
            .send(VALID_PREFS);

        const res = await request(app)
            .get('/api/user/preferences')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.goal).toBe(VALID_PREFS.goal);
        expect(res.body.age).toBe(VALID_PREFS.age);
        expect(res.body.proteins).toEqual(VALID_PREFS.proteins);
        expect(res.body.favorite_meals).toEqual(VALID_PREFS.favorite_meals);
    });

    it('returns 401 without auth token', async () => {
        const res = await request(app).get('/api/user/preferences');
        expect(res.status).toBe(401);
    });
});
