import { Router } from 'express';
import { savePreferences, getPreferences } from '../controllers/user';
import { authenticate } from '../middleware/auth';

const router = Router();

// All user routes are protected
router.use(authenticate);

router.get('/preferences', getPreferences);
router.post('/preferences', savePreferences);

export default router;
