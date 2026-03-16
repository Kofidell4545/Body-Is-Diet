import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z } from 'zod';
import db, { sql } from '../db';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendPasswordResetEmail } from '../utils/email';

const SALT_ROUNDS = 12;

// ── Zod schemas ──────────────────────────────────────────────────────────────
const RegisterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const ForgotSchema = z.object({ email: z.string().email() });
const ResetSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
const RefreshSchema = z.object({ refreshToken: z.string().min(1) });

// ── Types ────────────────────────────────────────────────────────────────────
interface DbUser {
    id: string; name: string; email: string; password: string;
    email_verified: number; reset_token: string | null;
    reset_token_expires_at: string | null; created_at: string;
}

interface DbToken { id: string; token: string; user_id: string; expires_at: string; }

const safeUser = (u: DbUser) => ({
    id: u.id, name: u.name, email: u.email,
    emailVerified: !!u.email_verified, createdAt: u.created_at,
});

const refreshExpiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

// ── POST /api/auth/register ──────────────────────────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors }); return; }

    const { name, email, password } = parsed.data;
    const existing = await db.query(sql`SELECT id FROM users WHERE email = ${email}`);
    if (existing.length) { res.status(409).json({ success: false, message: 'An account with this email already exists' }); return; }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = crypto.randomUUID();
    await db.query(sql`INSERT INTO users (id, name, email, password) VALUES (${userId}, ${name}, ${email}, ${hashed})`);

    const [user] = await db.query(sql`SELECT * FROM users WHERE id = ${userId}`) as DbUser[];
    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await db.query(sql`INSERT INTO refresh_tokens (id, token, user_id, expires_at) VALUES (${crypto.randomUUID()}, ${refreshToken}, ${userId}, ${refreshExpiry()})`);

    res.status(201).json({ success: true, data: { accessToken, refreshToken, user: safeUser(user) } });
}

// ── POST /api/auth/login ─────────────────────────────────────────────────────
export async function login(req: Request, res: Response): Promise<void> {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors }); return; }

    const { email, password } = parsed.data;
    const [user] = await db.query(sql`SELECT * FROM users WHERE email = ${email}`) as DbUser[];
    if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ success: false, message: 'Invalid email or password' }); return;
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await db.query(sql`INSERT INTO refresh_tokens (id, token, user_id, expires_at) VALUES (${crypto.randomUUID()}, ${refreshToken}, ${user.id}, ${refreshExpiry()})`);

    res.json({ success: true, data: { accessToken, refreshToken, user: safeUser(user) } });
}

// ── POST /api/auth/refresh ───────────────────────────────────────────────────
export async function refresh(req: Request, res: Response): Promise<void> {
    const parsed = RefreshSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, message: 'Refresh token required' }); return; }

    let payload: { userId: string; email: string };
    try { payload = verifyRefreshToken(parsed.data.refreshToken); }
    catch { res.status(401).json({ success: false, message: 'Invalid or expired refresh token' }); return; }

    const [stored] = await db.query(sql`SELECT * FROM refresh_tokens WHERE token = ${parsed.data.refreshToken}`) as DbToken[];
    if (!stored || new Date(stored.expires_at) < new Date()) {
        res.status(401).json({ success: false, message: 'Refresh token revoked or expired' }); return;
    }

    await db.query(sql`DELETE FROM refresh_tokens WHERE id = ${stored.id}`);
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);
    await db.query(sql`INSERT INTO refresh_tokens (id, token, user_id, expires_at) VALUES (${crypto.randomUUID()}, ${newRefreshToken}, ${payload.userId}, ${refreshExpiry()})`);

    res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
}

// ── POST /api/auth/logout ────────────────────────────────────────────────────
export async function logout(req: Request, res: Response): Promise<void> {
    if (req.body?.refreshToken) {
        await db.query(sql`DELETE FROM refresh_tokens WHERE token = ${req.body.refreshToken}`);
    }
    res.json({ success: true, message: 'Logged out' });
}

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
export async function forgotPassword(req: Request, res: Response): Promise<void> {
    const parsed = ForgotSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, message: 'Valid email required' }); return; }

    const GENERIC = 'If an account with that email exists, a reset link has been sent.';
    const [user] = await db.query(sql`SELECT * FROM users WHERE email = ${parsed.data.email}`) as DbUser[];
    if (!user) { res.json({ success: true, message: GENERIC }); return; }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db.query(sql`UPDATE users SET reset_token = ${resetToken}, reset_token_expires_at = ${expiresAt} WHERE id = ${user.id}`);

    await sendPasswordResetEmail(user.email, user.name, resetToken);
    res.json({ success: true, message: GENERIC });
}

// ── POST /api/auth/reset-password ───────────────────────────────────────────
export async function resetPassword(req: Request, res: Response): Promise<void> {
    const parsed = ResetSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors }); return; }

    const now = new Date().toISOString();
    const [user] = await db.query(sql`
    SELECT * FROM users WHERE reset_token = ${parsed.data.token} AND reset_token_expires_at > ${now}
  `) as DbUser[];

    if (!user) { res.status(400).json({ success: false, message: 'Invalid or expired reset token' }); return; }

    const hashed = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
    await db.query(sql`UPDATE users SET password = ${hashed}, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ${user.id}`);
    await db.query(sql`DELETE FROM refresh_tokens WHERE user_id = ${user.id}`);

    res.json({ success: true, message: 'Password reset successfully. Please log in again.' });
}
