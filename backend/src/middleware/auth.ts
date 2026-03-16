import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
        return;
    }

    const token = header.split(' ')[1];

    try {
        req.user = verifyAccessToken(token);
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Invalid or expired access token' });
    }
}
