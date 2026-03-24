// jest.mock is hoisted above imports by Jest — the require() factory pattern
// lets us create the in-memory db inside the factory without hoisting issues.
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
const VALID_USER = { name: 'Test User', email: 'test@example.com', password: 'password123' };

async function registerAndGetTokens() {
    const res = await request(app).post('/api/auth/register').send(VALID_USER);
    return res.body.data as { accessToken: string; refreshToken: string };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
    it('returns 201 with tokens on valid data', async () => {
        const res = await request(app).post('/api/auth/register').send(VALID_USER);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');
        expect(res.body.data.user.email).toBe(VALID_USER.email);
    });

    it('returns 400 when name is too short', async () => {
        const res = await request(app).post('/api/auth/register').send({ ...VALID_USER, name: 'A' });
        expect(res.status).toBe(400);
    });

    it('returns 400 when email is invalid', async () => {
        const res = await request(app).post('/api/auth/register').send({ ...VALID_USER, email: 'bad-email' });
        expect(res.status).toBe(400);
    });

    it('returns 400 when password is too short', async () => {
        const res = await request(app).post('/api/auth/register').send({ ...VALID_USER, password: 'abc' });
        expect(res.status).toBe(400);
    });

    it('returns 409 on duplicate email', async () => {
        await request(app).post('/api/auth/register').send(VALID_USER);
        const res = await request(app).post('/api/auth/register').send(VALID_USER);
        expect(res.status).toBe(409);
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        await request(app).post('/api/auth/register').send(VALID_USER);
    });

    it('returns 200 with tokens on valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: VALID_USER.email, password: VALID_USER.password });
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('accessToken');
    });

    it('returns 401 on wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: VALID_USER.email, password: 'wrongpassword' });
        expect(res.status).toBe(401);
    });

    it('returns 401 on unknown email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@example.com', password: 'password123' });
        expect(res.status).toBe(401);
    });
});

describe('POST /api/auth/refresh', () => {
    it('returns 200 with new token pair on valid refresh token', async () => {
        const { refreshToken } = await registerAndGetTokens();
        const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
        expect(res.status).toBe(200);
        expect(res.body.data.refreshToken).not.toBe(refreshToken); // token rotation
    });

    it('returns 401 on invalid refresh token', async () => {
        const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'garbage' });
        expect(res.status).toBe(401);
    });

    it('returns 401 when refresh token is reused after rotation', async () => {
        const { refreshToken } = await registerAndGetTokens();
        await request(app).post('/api/auth/refresh').send({ refreshToken });
        const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
        expect(res.status).toBe(401);
    });
});

describe('POST /api/auth/logout', () => {
    it('returns 200 and revokes the refresh token', async () => {
        const { accessToken, refreshToken } = await registerAndGetTokens();
        await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ refreshToken });
        // Refresh should now fail (token revoked)
        const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
        expect(res.status).toBe(401);
    });

    it('returns 200 even without a refresh token body (only needs auth header)', async () => {
        const { accessToken } = await registerAndGetTokens();
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});
        expect(res.status).toBe(200);
    });
});

describe('POST /api/auth/forgot-password', () => {
    it('returns 200 for known email', async () => {
        await request(app).post('/api/auth/register').send(VALID_USER);
        const res = await request(app).post('/api/auth/forgot-password').send({ email: VALID_USER.email });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 200 for unknown email (no user enumeration)', async () => {
        const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
        expect(res.status).toBe(200);
    });

    it('returns 400 for invalid email format', async () => {
        const res = await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' });
        expect(res.status).toBe(400);
    });
});
