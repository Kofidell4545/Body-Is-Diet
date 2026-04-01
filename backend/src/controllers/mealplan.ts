import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sql } from '@databases/sqlite';
import db from '../db';
import { z } from 'zod';
import crypto from 'crypto';
import { calculateTDEE, TDEEInput } from '../utils/tdee';
import { generateWeeklyPlan, findAlternativeFood } from '../utils/meal-generator';
import { ALL_FOODS } from '../data/all-foods';

function getMonday(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// ── Generate meal plan ──────────────────────────────────────────────────────
const generateSchema = z.object({
  week_start: z.string().optional(),
});

export const generateMealPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const { week_start } = generateSchema.parse(req.body);
    const weekStart = getMonday(week_start);

    // Get user preferences
    const prefRows = await db.query(sql`SELECT * FROM user_preferences WHERE user_id = ${userId}`);
    if (prefRows.length === 0) {
      res.status(400).json({ message: 'Complete onboarding first' });
      return;
    }

    const pref = prefRows[0];
    const tdeeInput: TDEEInput = {
      age: pref.age,
      gender: pref.gender,
      height_cm: pref.height_cm,
      weight_kg: pref.weight_kg,
      activity_level: pref.activity_level,
      goal: pref.goal,
    };

    const tdeeResult = calculateTDEE(tdeeInput);

    // Check for an active calorie adjustment (from adaptive algorithm)
    const [latestAdj] = await db.query(sql`
      SELECT adjusted_target FROM calorie_adjustments
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `);
    // Use adjusted target if available, otherwise use TDEE-calculated target
    const effectiveTargetCalories = latestAdj?.adjusted_target ?? tdeeResult.targetCalories;

    // Delete existing plan for this week if any
    const existing = await db.query(sql`SELECT id FROM meal_plans WHERE user_id = ${userId} AND week_start = ${weekStart}`);
    if (existing.length > 0) {
      await db.query(sql`DELETE FROM meal_plan_items WHERE meal_plan_id = ${existing[0].id}`);
      await db.query(sql`DELETE FROM meal_plans WHERE id = ${existing[0].id}`);
    }

    // Generate the plan
    const userPrefs = {
      proteins: JSON.parse(pref.proteins),
      carbs: JSON.parse(pref.carbs),
      favorite_meals: pref.favorite_meals ? JSON.parse(pref.favorite_meals) : [],
      avoid_foods: pref.avoid_foods ? JSON.parse(pref.avoid_foods) : [],
      meals_per_day: pref.meals_per_day,
    };

    const generatedItems = generateWeeklyPlan(userPrefs, effectiveTargetCalories, ALL_FOODS);

    // Store the plan
    const planId = crypto.randomUUID();
    await db.query(sql`
      INSERT INTO meal_plans (id, user_id, week_start, tdee, target_calories)
      VALUES (${planId}, ${userId}, ${weekStart}, ${tdeeResult.tdee}, ${effectiveTargetCalories})
    `);

    for (const item of generatedItems) {
      const itemId = crypto.randomUUID();
      await db.query(sql`
        INSERT INTO meal_plan_items (id, meal_plan_id, day_of_week, meal_slot, food_id, food_name, servings, calories, protein_g, carbs_g, fats_g)
        VALUES (${itemId}, ${planId}, ${item.day_of_week}, ${item.meal_slot}, ${item.food_id}, ${item.food_name}, ${item.servings}, ${item.calories}, ${item.protein_g}, ${item.carbs_g}, ${item.fats_g})
      `);
    }

    // Return the full plan
    const items = await db.query(sql`
      SELECT * FROM meal_plan_items WHERE meal_plan_id = ${planId} ORDER BY day_of_week, meal_slot
    `);

    res.json({
      success: true,
      data: {
        id: planId,
        week_start: weekStart,
        tdee: tdeeResult.tdee,
        target_calories: tdeeResult.targetCalories,
        macro_targets: tdeeResult.macroSplit,
        items: items.map(i => ({ ...i, is_completed: !!i.is_completed })),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid data', errors: error.errors });
      return;
    }
    console.error('Generate meal plan error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// ── Get meal plan ───────────────────────────────────────────────────────────
export const getMealPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const weekStart = getMonday(req.query.week_start as string | undefined);

    const plans = await db.query(sql`
      SELECT * FROM meal_plans WHERE user_id = ${userId} AND week_start = ${weekStart}
    `);

    if (plans.length === 0) {
      res.status(404).json({ message: 'No meal plan for this week. Generate one first.' });
      return;
    }

    const plan = plans[0];

    // Get user prefs for macro targets
    const prefRows = await db.query(sql`SELECT * FROM user_preferences WHERE user_id = ${userId}`);
    const pref = prefRows[0];
    const tdeeResult = calculateTDEE({
      age: pref.age, gender: pref.gender, height_cm: pref.height_cm,
      weight_kg: pref.weight_kg, activity_level: pref.activity_level, goal: pref.goal,
    });

    const items = await db.query(sql`
      SELECT * FROM meal_plan_items WHERE meal_plan_id = ${plan.id} ORDER BY day_of_week, meal_slot
    `);

    res.json({
      success: true,
      data: {
        id: plan.id,
        week_start: plan.week_start,
        tdee: plan.tdee,
        target_calories: plan.target_calories,
        macro_targets: tdeeResult.macroSplit,
        items: items.map(i => ({ ...i, is_completed: !!i.is_completed })),
      },
    });
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// ── Swap meal ───────────────────────────────────────────────────────────────
const swapSchema = z.object({
  item_id: z.string(),
  new_food_id: z.string().optional(),
});

export const swapMeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const { item_id, new_food_id } = swapSchema.parse(req.body);

    // Get the existing item and verify ownership
    const itemRows = await db.query(sql`
      SELECT mpi.*, mp.user_id, mp.target_calories
      FROM meal_plan_items mpi
      JOIN meal_plans mp ON mpi.meal_plan_id = mp.id
      WHERE mpi.id = ${item_id} AND mp.user_id = ${userId}
    `);

    if (itemRows.length === 0) {
      res.status(404).json({ message: 'Meal item not found' });
      return;
    }

    const oldItem = itemRows[0];

    // Get user prefs
    const prefRows = await db.query(sql`SELECT * FROM user_preferences WHERE user_id = ${userId}`);
    const pref = prefRows[0];
    const userPrefs = {
      proteins: JSON.parse(pref.proteins),
      carbs: JSON.parse(pref.carbs),
      favorite_meals: pref.favorite_meals ? JSON.parse(pref.favorite_meals) : [],
      avoid_foods: pref.avoid_foods ? JSON.parse(pref.avoid_foods) : [],
      meals_per_day: pref.meals_per_day,
    };

    let newFood;
    if (new_food_id) {
      newFood = ALL_FOODS.find(f => f.id === new_food_id);
      if (!newFood) { res.status(404).json({ message: 'Food not found' }); return; }
    } else {
      newFood = findAlternativeFood(
        oldItem.food_id,
        oldItem.meal_slot,
        oldItem.calories,
        ALL_FOODS,
        userPrefs,
      );
      if (!newFood) { res.status(400).json({ message: 'No alternatives available' }); return; }
    }

    const servings = Math.max(0.5, Math.min(2.5,
      Math.round((oldItem.calories / newFood.calories_per_serving) * 10) / 10
    ));

    await db.query(sql`
      UPDATE meal_plan_items
      SET food_id = ${newFood.id},
          food_name = ${newFood.name},
          servings = ${servings},
          calories = ${Math.round(newFood.calories_per_serving * servings)},
          protein_g = ${Math.round(newFood.protein_g * servings)},
          carbs_g = ${Math.round(newFood.carbs_g * servings)},
          fats_g = ${Math.round(newFood.fats_g * servings)},
          swapped_from = ${oldItem.food_id}
      WHERE id = ${item_id}
    `);

    const updated = await db.query(sql`SELECT * FROM meal_plan_items WHERE id = ${item_id}`);

    res.json({
      success: true,
      data: { ...updated[0], is_completed: !!updated[0].is_completed },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid data', errors: error.errors });
      return;
    }
    console.error('Swap meal error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// ── Complete meal ───────────────────────────────────────────────────────────
export const completeMeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const itemId = req.params.id;

    // Verify ownership
    const itemRows = await db.query(sql`
      SELECT mpi.*, mp.user_id
      FROM meal_plan_items mpi
      JOIN meal_plans mp ON mpi.meal_plan_id = mp.id
      WHERE mpi.id = ${itemId} AND mp.user_id = ${userId}
    `);

    if (itemRows.length === 0) {
      res.status(404).json({ message: 'Meal item not found' });
      return;
    }

    const newStatus = itemRows[0].is_completed ? 0 : 1;

    await db.query(sql`
      UPDATE meal_plan_items SET is_completed = ${newStatus} WHERE id = ${itemId}
    `);

    res.json({
      success: true,
      data: { ...itemRows[0], is_completed: !!newStatus },
    });
  } catch (error) {
    console.error('Complete meal error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};
