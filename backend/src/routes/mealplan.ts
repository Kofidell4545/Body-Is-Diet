import { Router } from 'express';
import { generateMealPlan, getMealPlan, swapMeal, completeMeal } from '../controllers/mealplan';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/generate', generateMealPlan);
router.get('/', getMealPlan);
router.post('/swap', swapMeal);
router.patch('/item/:id/complete', completeMeal);

export default router;
