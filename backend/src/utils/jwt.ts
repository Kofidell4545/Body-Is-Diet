import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in your environment.\n' +
    'Run: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))" to generate each secret.'
  );
}
const ACCESS_EXPIRY = (process.env.JWT_ACCESS_EXPIRY || '15m') as SignOptions['expiresIn'];
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || '7d') as SignOptions['expiresIn'];

export interface JwtPayload {
    userId: string;
    email: string;
    name: string;
}

export function signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, ACCESS_SECRET!, { expiresIn: ACCESS_EXPIRY });
}

export function signRefreshToken(payload: JwtPayload): string {
    // jti ensures each refresh token is unique even when issued in the same second
    return jwt.sign(payload, REFRESH_SECRET!, { expiresIn: REFRESH_EXPIRY, jwtid: crypto.randomUUID() });
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, ACCESS_SECRET!) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, REFRESH_SECRET!) as JwtPayload;
}
