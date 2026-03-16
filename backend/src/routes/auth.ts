import { Router } from 'express';
import {
    register,
    login,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
} from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require valid access token)
router.post('/logout', authenticate, logout);

export default router;
