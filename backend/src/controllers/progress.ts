import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sql } from '@databases/sqlite';
import db from '../db';
import { z } from 'zod';
import crypto from 'crypto';
import { analyseProgress, checkGoalRealism, WeightLog } from '../utils/adaptive-calories';
import { calculateTDEE } from '../utils/tdee';

// ─── Log Weight ───────────────────────────────────────────────────────────────
const logWeightSchema = z.object({
  weight_kg: z.number().min(20).max(500),
  body_fat_pct: z.number().min(1).max(70).optional(),
  notes: z.string().max(300).optional(),
});

export async function logWeight(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const body = logWeightSchema.parse(req.body);

    // Insert weight log
    const logId = crypto.randomUUID();
    await db.query(sql`
      INSERT INTO weight_logs (id, user_id, weight_kg, body_fat_pct, notes, logged_at)
      VALUES (
        ${logId},
        ${userId},
        ${body.weight_kg},
        ${body.body_fat_pct ?? null},
        ${body.notes ?? null},
        ${new Date().toISOString()}
      )
    `);

    // Also update the current weight in user_preferences
    await db.query(sql`
      UPDATE user_preferences
      SET weight_kg = ${body.weight_kg}, updated_at = ${new Date().toISOString()}
      WHERE user_id = ${userId}
    `);

    res.status(201).json({
      success: true,
      data: {
        id: logId,
        weight_kg: body.weight_kg,
        logged_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid data', errors: error.errors });
      return;
    }
    console.error('[logWeight]', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

// ─── Get Weight History ───────────────────────────────────────────────────────
export async function getWeightHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const limit = Math.min(parseInt(req.query.limit as string) || 52, 52); // max 52 weeks

    const logs = await db.query(sql`
      SELECT id, weight_kg, body_fat_pct, notes, logged_at
      FROM weight_logs
      WHERE user_id = ${userId}
      ORDER BY logged_at DESC
      LIMIT ${limit}
    `);

    // Reverse so oldest → newest for charting
    const sorted = [...logs].reverse();

    res.json({ success: true, data: sorted });
  } catch (error) {
    console.error('[getWeightHistory]', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

// ─── Get Progress Analysis ────────────────────────────────────────────────────
export async function getProgressAnalysis(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    // Get user preferences
    const [pref] = await db.query(sql`
      SELECT * FROM user_preferences WHERE user_id = ${userId}
    `);

    if (!pref) {
      res.status(400).json({ message: 'Complete onboarding first' });
      return;
    }

    // Get all weight logs
    const logs: WeightLog[] = await db.query(sql`
      SELECT weight_kg, logged_at
      FROM weight_logs
      WHERE user_id = ${userId}
      ORDER BY logged_at ASC
    `);

    // Calculate base TDEE
    const tdeeResult = calculateTDEE({
      age: pref.age,
      gender: pref.gender,
      height_cm: pref.height_cm,
      weight_kg: pref.weight_kg,
      activity_level: pref.activity_level,
      goal: pref.goal,
    });

    // Get latest calorie adjustment (if any)
    const [latestAdj] = await db.query(sql`
      SELECT adjusted_target FROM calorie_adjustments
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const currentTarget = latestAdj?.adjusted_target ?? tdeeResult.targetCalories;

    // Run adaptive analysis
    const analysis = analyseProgress(logs, pref.goal, pref.gender, currentTarget);

    // Goal realism check (if target_weight_kg is set)
    let goalRealism = null;
    if (pref.target_weight_kg && pref.target_weight_kg !== pref.weight_kg) {
      // Estimate weeks from start: use onboarding created_at
      const createdAt = new Date(pref.created_at);
      const now = new Date();
      const weeksElapsed = Math.max(
        (now.getTime() - createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000),
        1,
      );
      // Assume they gave themselves ~12 weeks by default if no explicit timeline
      const targetWeeks = 12;
      goalRealism = checkGoalRealism(
        pref.weight_kg,
        pref.target_weight_kg,
        pref.goal,
        targetWeeks,
      );
    }

    // Save the calorie adjustment if there's a change
    if (analysis.recommended_adjustment_kcal !== 0) {
      const today = new Date();
      const weekStart = getMonday(today.toISOString());
      const adjId = crypto.randomUUID();

      // Only save if we don't already have one for this week
      await db.query(sql`
        INSERT OR IGNORE INTO calorie_adjustments (
          id, user_id, week_start, base_tdee, adjustment_kcal,
          adjusted_target, reason, weight_start_kg, weight_end_kg,
          expected_change_kg, actual_change_kg
        ) VALUES (
          ${adjId},
          ${userId},
          ${weekStart},
          ${tdeeResult.tdee},
          ${analysis.recommended_adjustment_kcal},
          ${analysis.new_target_calories},
          ${analysis.reason},
          ${analysis.start_weight_kg},
          ${analysis.current_weight_kg},
          ${analysis.expected_rate_kg * analysis.weeks_tracked},
          ${analysis.total_change_kg}
        )
      `);
    }

    res.json({
      success: true,
      data: {
        analysis,
        goal_realism: goalRealism,
        base_tdee: tdeeResult.tdee,
        macro_targets: tdeeResult.macroSplit,
        logs_count: logs.length,
      },
    });
  } catch (error) {
    console.error('[getProgressAnalysis]', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

// ─── Get Weekly Summary ───────────────────────────────────────────────────────
export async function getWeeklySummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const weekStart = (req.query.week_start as string) || getMonday(new Date().toISOString());

    // Get the meal plan for this week
    const [plan] = await db.query(sql`
      SELECT mp.*, COUNT(CASE WHEN mpi.is_completed = 1 THEN 1 END) as completed_meals,
             COUNT(mpi.id) as total_meals,
             SUM(CASE WHEN mpi.is_completed = 1 THEN mpi.calories ELSE 0 END) as calories_consumed
      FROM meal_plans mp
      LEFT JOIN meal_plan_items mpi ON mpi.meal_plan_id = mp.id
      WHERE mp.user_id = ${userId} AND mp.week_start = ${weekStart}
      GROUP BY mp.id
    `);

    // Get weight logs for this week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekLogs = await db.query(sql`
      SELECT weight_kg, logged_at
      FROM weight_logs
      WHERE user_id = ${userId}
        AND logged_at >= ${weekStart}
        AND logged_at < ${weekEnd.toISOString()}
      ORDER BY logged_at ASC
    `);

    // Get calorie adjustment for this week
    const [adj] = await db.query(sql`
      SELECT * FROM calorie_adjustments
      WHERE user_id = ${userId} AND week_start = ${weekStart}
    `);

    res.json({
      success: true,
      data: {
        week_start: weekStart,
        plan: plan ?? null,
        weight_logs: weekLogs,
        calorie_adjustment: adj ?? null,
        adherence_pct: plan
          ? Math.round((plan.completed_meals / Math.max(plan.total_meals, 1)) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error('[getWeeklySummary]', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMonday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}
