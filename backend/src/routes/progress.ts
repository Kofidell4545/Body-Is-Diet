import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  logWeight,
  getWeightHistory,
  getProgressAnalysis,
  getWeeklySummary,
} from '../controllers/progress';

const router = Router();

// All progress routes require authentication
router.use(authenticate);

router.post('/weight', logWeight);           // Log a weight entry
router.get('/weight/history', getWeightHistory); // Get weight history
router.get('/analysis', getProgressAnalysis);     // Get adaptive analysis + goal realism
router.get('/weekly-summary', getWeeklySummary);  // Get this week's adherence + logs

export default router;
