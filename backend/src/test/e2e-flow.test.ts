/**
 * End-to-end smoke tests — simulates the full app flow:
 *   Register → Login → Save preferences → Generate meal plan → View plan → Swap meal → Complete meal
 *
 * These tests verify that the entire backend works as a connected system,
 * not just individual endpoints in isolation.
 */
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
import { createSchema, clearTables } from './setup';

beforeAll(async () => { await createSchema(db as any); });
afterEach(async () => { await clearTables(db as any); });
afterAll(async () => { await (db as any).dispose(); });

const USER = { name: 'Kwame Mensah', email: 'kwame@example.com', password: 'strongPass123' };

const PREFS = {
    goal: 'gain_muscle',
    age: 25,
    gender: 'male',
    height_cm: 180,
    weight_kg: 75,
    target_weight_kg: 82,
    activity_level: 'moderate',
    proteins: ['Chicken', 'Fish', 'Eggs'],
    carbs: ['Rice', 'Yam', 'Plantain'],
    avoid_foods: ['Pork'],
    favorite_meals: ['Jollof Rice', 'Banku with Tilapia'],
    meals_per_day: 3,
};

describe('Full app flow: register → login → preferences → meal plan', () => {
    let accessToken: string;
    let refreshToken: string;

    it('1. registers a new user and returns tokens', async () => {
        const res = await request(app).post('/api/auth/register').send(USER);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.email).toBe(USER.email);
        expect(res.body.data.user.name).toBe(USER.name);
        accessToken = res.body.data.accessToken;
        refreshToken = res.body.data.refreshToken;
        expect(accessToken).toBeTruthy();
        expect(refreshToken).toBeTruthy();
    });

    it('2. logs in with the same credentials', async () => {
        // Register first
        await request(app).post('/api/auth/register').send(USER);

        const res = await request(app).post('/api/auth/login').send({
            email: USER.email,
            password: USER.password,
        });
        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe(USER.email);
        accessToken = res.body.data.accessToken;
        refreshToken = res.body.data.refreshToken;
    });

    it('3. rejects login with wrong password', async () => {
        await request(app).post('/api/auth/register').send(USER);

        const res = await request(app).post('/api/auth/login').send({
            email: USER.email,
            password: 'wrongPassword',
        });
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/invalid/i);
    });

    it('4. saves user preferences after registration', async () => {
        const reg = await request(app).post('/api/auth/register').send(USER);
        accessToken = reg.body.data.accessToken;

        const res = await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(PREFS);
        expect(res.status).toBe(200);
    });

    it('5. retrieves saved preferences', async () => {
        const reg = await request(app).post('/api/auth/register').send(USER);
        accessToken = reg.body.data.accessToken;
        await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(PREFS);

        const res = await request(app)
            .get('/api/user/preferences')
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(res.body.goal).toBe('gain_muscle');
        expect(res.body.meals_per_day).toBe(3);
    });

    it('6. generates a weekly meal plan', async () => {
        const reg = await request(app).post('/api/auth/register').send(USER);
        accessToken = reg.body.data.accessToken;
        await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(PREFS);

        const res = await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('items');
        expect(res.body.data.items.length).toBeGreaterThan(0);
        expect(res.body.data).toHaveProperty('target_calories');
    });

    it('7. retrieves the generated meal plan', async () => {
        const reg = await request(app).post('/api/auth/register').send(USER);
        accessToken = reg.body.data.accessToken;
        await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(PREFS);
        await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});

        const res = await request(app)
            .get('/api/meal-plan')
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('items');
        expect(res.body.data).toHaveProperty('target_calories');
        expect(res.body.data.target_calories).toBeGreaterThan(0);
        // Should have 7 days * meals_per_day items
        expect(res.body.data.items.length).toBe(7 * PREFS.meals_per_day);
    });

    it('8. swaps a meal in the plan', async () => {
        const reg = await request(app).post('/api/auth/register').send(USER);
        accessToken = reg.body.data.accessToken;
        await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(PREFS);
        await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});

        // Get plan and find a meal item to swap
        const plan = await request(app)
            .get('/api/meal-plan')
            .set('Authorization', `Bearer ${accessToken}`);
        const firstMeal = plan.body.data.items[0];

        const res = await request(app)
            .post('/api/meal-plan/swap')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ item_id: firstMeal.id });
        expect(res.status).toBe(200);
    });

    it('9. marks a meal as completed', async () => {
        const reg = await request(app).post('/api/auth/register').send(USER);
        accessToken = reg.body.data.accessToken;
        await request(app)
            .post('/api/user/preferences')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(PREFS);
        await request(app)
            .post('/api/meal-plan/generate')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});

        const plan = await request(app)
            .get('/api/meal-plan')
            .set('Authorization', `Bearer ${accessToken}`);
        const firstMeal = plan.body.data.items[0];

        const res = await request(app)
            .patch(`/api/meal-plan/item/${firstMeal.id}/complete`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.is_completed).toBe(true);
    });

    it('10. refreshes tokens successfully', async () => {
        const reg = await request(app).post('/api/auth/register').send(USER);
        refreshToken = reg.body.data.refreshToken;

        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken });
        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeTruthy();
        expect(res.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('11. rejects requests without auth token', async () => {
        const endpoints = [
            { method: 'get', path: '/api/user/preferences' },
            { method: 'post', path: '/api/user/preferences' },
            { method: 'post', path: '/api/meal-plan/generate' },
            { method: 'get', path: '/api/meal-plan' },
        ];

        for (const ep of endpoints) {
            const res = await (request(app) as any)[ep.method](ep.path);
            expect(res.status).toBe(401);
        }
    });

    it('12. logs out and invalidates refresh token', async () => {
        const reg = await request(app).post('/api/auth/register').send(USER);
        accessToken = reg.body.data.accessToken;
        refreshToken = reg.body.data.refreshToken;

        const logoutRes = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ refreshToken });
        expect(logoutRes.status).toBe(200);

        // Refresh token should now be revoked
        const refreshRes = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken });
        expect(refreshRes.status).toBe(401);
    });
});
