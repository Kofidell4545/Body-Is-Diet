import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sql } from '@databases/sqlite';
import db from '../db';
import { z } from 'zod';
import crypto from 'crypto';

const preferencesSchema = z.object({
    goal: z.enum(['lose_weight', 'gain_muscle', 'gain_weight', 'maintain']),
    age: z.number().int().min(12).max(120),
    gender: z.enum(['male', 'female', 'other']),
    height_cm: z.number().positive(),
    weight_kg: z.number().positive(),
    target_weight_kg: z.number().positive().optional(),
    activity_level: z.enum(['sedentary', 'light', 'moderate', 'very_active', 'athlete']),
    proteins: z.array(z.string()),
    carbs: z.array(z.string()),
    avoid_foods: z.array(z.string()).optional(),
    favorite_meals: z.array(z.string()).optional(),
    meals_per_day: z.number().int().min(2).max(6).default(3)
});

export const savePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const val = preferencesSchema.parse(req.body);

        const existingPref = await db.query(sql`SELECT id FROM user_preferences WHERE user_id = ${userId}`);

        if (existingPref.length > 0) {
            // Update
            await db.query(sql`
        UPDATE user_preferences 
        SET goal = ${val.goal},
            age = ${val.age},
            gender = ${val.gender},
            height_cm = ${val.height_cm},
            weight_kg = ${val.weight_kg},
            target_weight_kg = ${val.target_weight_kg ?? null},
            activity_level = ${val.activity_level},
            proteins = ${JSON.stringify(val.proteins)},
            carbs = ${JSON.stringify(val.carbs)},
            avoid_foods = ${JSON.stringify(val.avoid_foods ?? [])},
            favorite_meals = ${JSON.stringify(val.favorite_meals ?? [])},
            meals_per_day = ${val.meals_per_day},
            updated_at = datetime('now')
        WHERE user_id = ${userId}
      `);
        } else {
            // Insert
            const id = crypto.randomUUID();
            await db.query(sql`
        INSERT INTO user_preferences (
          id, user_id, goal, age, gender, height_cm, weight_kg, target_weight_kg,
          activity_level, proteins, carbs, avoid_foods, favorite_meals, meals_per_day
        ) VALUES (
          ${id}, ${userId}, ${val.goal}, ${val.age}, ${val.gender}, ${val.height_cm}, 
          ${val.weight_kg}, ${val.target_weight_kg ?? null}, ${val.activity_level}, 
          ${JSON.stringify(val.proteins)}, ${JSON.stringify(val.carbs)}, 
          ${JSON.stringify(val.avoid_foods ?? [])}, ${JSON.stringify(val.favorite_meals ?? [])}, 
          ${val.meals_per_day}
        )
      `);
        }

        res.json({ message: 'Preferences saved successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: 'Invalid data', errors: error.errors });
            return;
        }
        console.error('Save preferences error:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const rows = await db.query(sql`SELECT * FROM user_preferences WHERE user_id = ${userId}`);

        if (rows.length === 0) {
            res.status(404).json({ message: 'Preferences not found' });
            return;
        }

        const pref = rows[0];

        // Parse JSON strings back to arrays
        res.json({
            ...pref,
            proteins: JSON.parse(pref.proteins),
            carbs: JSON.parse(pref.carbs),
            avoid_foods: pref.avoid_foods ? JSON.parse(pref.avoid_foods) : [],
            favorite_meals: pref.favorite_meals ? JSON.parse(pref.favorite_meals) : []
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};
