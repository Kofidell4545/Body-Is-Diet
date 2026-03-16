"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const db_1 = __importStar(require("../db"));
const jwt_1 = require("../utils/jwt");
const email_1 = require("../utils/email");
const SALT_ROUNDS = 12;
// ── Zod schemas ──────────────────────────────────────────────────────────────
const RegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const ForgotSchema = zod_1.z.object({ email: zod_1.z.string().email() });
const ResetSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
const RefreshSchema = zod_1.z.object({ refreshToken: zod_1.z.string().min(1) });
const safeUser = (u) => ({
    id: u.id, name: u.name, email: u.email,
    emailVerified: !!u.email_verified, createdAt: u.created_at,
});
const refreshExpiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
// ── POST /api/auth/register ──────────────────────────────────────────────────
async function register(req, res) {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const { name, email, password } = parsed.data;
    const existing = await db_1.default.query((0, db_1.sql) `SELECT id FROM users WHERE email = ${email}`);
    if (existing.length) {
        res.status(409).json({ success: false, message: 'An account with this email already exists' });
        return;
    }
    const hashed = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    const userId = crypto_1.default.randomUUID();
    await db_1.default.query((0, db_1.sql) `INSERT INTO users (id, name, email, password) VALUES (${userId}, ${name}, ${email}, ${hashed})`);
    const [user] = await db_1.default.query((0, db_1.sql) `SELECT * FROM users WHERE id = ${userId}`);
    const payload = { userId: user.id, email: user.email };
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)(payload);
    await db_1.default.query((0, db_1.sql) `INSERT INTO refresh_tokens (id, token, user_id, expires_at) VALUES (${crypto_1.default.randomUUID()}, ${refreshToken}, ${userId}, ${refreshExpiry()})`);
    res.status(201).json({ success: true, data: { accessToken, refreshToken, user: safeUser(user) } });
}
// ── POST /api/auth/login ─────────────────────────────────────────────────────
async function login(req, res) {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const { email, password } = parsed.data;
    const [user] = await db_1.default.query((0, db_1.sql) `SELECT * FROM users WHERE email = ${email}`);
    if (!user || !(await bcrypt_1.default.compare(password, user.password))) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
    }
    const payload = { userId: user.id, email: user.email };
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)(payload);
    await db_1.default.query((0, db_1.sql) `INSERT INTO refresh_tokens (id, token, user_id, expires_at) VALUES (${crypto_1.default.randomUUID()}, ${refreshToken}, ${user.id}, ${refreshExpiry()})`);
    res.json({ success: true, data: { accessToken, refreshToken, user: safeUser(user) } });
}
// ── POST /api/auth/refresh ───────────────────────────────────────────────────
async function refresh(req, res) {
    const parsed = RefreshSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Refresh token required' });
        return;
    }
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(parsed.data.refreshToken);
    }
    catch {
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        return;
    }
    const [stored] = await db_1.default.query((0, db_1.sql) `SELECT * FROM refresh_tokens WHERE token = ${parsed.data.refreshToken}`);
    if (!stored || new Date(stored.expires_at) < new Date()) {
        res.status(401).json({ success: false, message: 'Refresh token revoked or expired' });
        return;
    }
    await db_1.default.query((0, db_1.sql) `DELETE FROM refresh_tokens WHERE id = ${stored.id}`);
    const newAccessToken = (0, jwt_1.signAccessToken)(payload);
    const newRefreshToken = (0, jwt_1.signRefreshToken)(payload);
    await db_1.default.query((0, db_1.sql) `INSERT INTO refresh_tokens (id, token, user_id, expires_at) VALUES (${crypto_1.default.randomUUID()}, ${newRefreshToken}, ${payload.userId}, ${refreshExpiry()})`);
    res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
}
// ── POST /api/auth/logout ────────────────────────────────────────────────────
async function logout(req, res) {
    if (req.body?.refreshToken) {
        await db_1.default.query((0, db_1.sql) `DELETE FROM refresh_tokens WHERE token = ${req.body.refreshToken}`);
    }
    res.json({ success: true, message: 'Logged out' });
}
// ── POST /api/auth/forgot-password ──────────────────────────────────────────
async function forgotPassword(req, res) {
    const parsed = ForgotSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Valid email required' });
        return;
    }
    const GENERIC = 'If an account with that email exists, a reset link has been sent.';
    const [user] = await db_1.default.query((0, db_1.sql) `SELECT * FROM users WHERE email = ${parsed.data.email}`);
    if (!user) {
        res.json({ success: true, message: GENERIC });
        return;
    }
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db_1.default.query((0, db_1.sql) `UPDATE users SET reset_token = ${resetToken}, reset_token_expires_at = ${expiresAt} WHERE id = ${user.id}`);
    await (0, email_1.sendPasswordResetEmail)(user.email, user.name, resetToken);
    res.json({ success: true, message: GENERIC });
}
// ── POST /api/auth/reset-password ───────────────────────────────────────────
async function resetPassword(req, res) {
    const parsed = ResetSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const now = new Date().toISOString();
    const [user] = await db_1.default.query((0, db_1.sql) `
    SELECT * FROM users WHERE reset_token = ${parsed.data.token} AND reset_token_expires_at > ${now}
  `);
    if (!user) {
        res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        return;
    }
    const hashed = await bcrypt_1.default.hash(parsed.data.password, SALT_ROUNDS);
    await db_1.default.query((0, db_1.sql) `UPDATE users SET password = ${hashed}, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ${user.id}`);
    await db_1.default.query((0, db_1.sql) `DELETE FROM refresh_tokens WHERE user_id = ${user.id}`);
    res.json({ success: true, message: 'Password reset successfully. Please log in again.' });
}
//# sourceMappingURL=auth.js.map