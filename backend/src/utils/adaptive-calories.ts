/**
 * Adaptive Calorie Algorithm
 *
 * Compares the user's actual weight change vs expected weight change
 * and adjusts next week's calorie target accordingly.
 *
 * Science:
 *  - 1 kg of body fat ≈ 7,700 calories
 *  - 1 kg of muscle ≈ 5,000 calories (with water/glycogen)
 *  - We use 7,700 cal/kg as a conservative estimate for all goals
 *
 * Safe limits:
 *  - Max weight loss: 1.0 kg/week (aggressive cut)
 *  - Max weight gain: 0.5 kg/week for muscle, 0.8 kg/week for bulk
 *  - Minimum calories: 1,200 kcal (female) / 1,500 kcal (male)
 *  - Max single-week adjustment: ±300 kcal
 */

export type Goal = 'lose_weight' | 'gain_muscle' | 'gain_weight' | 'maintain';
export type Gender = 'male' | 'female' | 'other';

// Calories per kg of body mass change
const CALS_PER_KG = 7700;

// Expected weekly weight change per goal (kg/week)
// min/max are the safe range boundaries (negative = loss)
// max_abs_rate is used for the goal realism check
const EXPECTED_WEEKLY_CHANGE: Record<Goal, { min: number; max: number; target: number; max_abs_rate: number }> = {
  lose_weight:  { min: -1.0, max: -0.3, target: -0.5, max_abs_rate: 1.0 },
  gain_muscle:  { min:  0.2, max:  0.5, target:  0.3, max_abs_rate: 0.5 },
  gain_weight:  { min:  0.3, max:  0.8, target:  0.5, max_abs_rate: 0.8 },
  maintain:     { min: -0.1, max:  0.1, target:  0.0, max_abs_rate: 0.15 },
};

// Min safe calories
const MIN_CALORIES: Record<Gender, number> = {
  male:   1500,
  female: 1200,
  other:  1350,
};

const MAX_WEEKLY_ADJUSTMENT = 300; // kcal, up or down
const MIN_WEEKS_FOR_ADJUSTMENT = 2; // Need at least 2 weight logs before adjusting

export interface WeightLog {
  weight_kg: number;
  logged_at: string; // ISO date string
}

export interface AdaptiveAnalysis {
  weeks_tracked: number;
  current_weight_kg: number;
  start_weight_kg: number;
  total_change_kg: number;
  weekly_rate_kg: number;          // Average change per week
  expected_rate_kg: number;        // What we expected per week
  on_track: boolean;
  status: 'on_track' | 'too_fast' | 'too_slow' | 'wrong_direction' | 'not_enough_data';
  status_message: string;
  recommended_adjustment_kcal: number; // + or - to add to current target
  reason: string;
  current_target_calories: number;
  new_target_calories: number;
}

export interface GoalRealism {
  is_realistic: boolean;
  requested_change_kg: number;
  requested_weeks: number;
  requested_rate_kg_per_week: number;
  max_safe_rate_kg_per_week: number;
  realistic_weeks: number;        // How many weeks it would actually take
  message: string;
}

/**
 * Checks if a user's goal is realistic given their starting weight,
 * target weight, and timeline.
 */
export function checkGoalRealism(
  current_weight_kg: number,
  target_weight_kg: number,
  goal: Goal,
  target_weeks: number,
): GoalRealism {
  const change = target_weight_kg - current_weight_kg;
  const absChange = Math.abs(change);
  const requestedRate = absChange / target_weeks;

  const limits = EXPECTED_WEEKLY_CHANGE[goal];
  const maxSafeRate = limits.max_abs_rate;
  const realisticWeeks = Math.ceil(absChange / Math.abs(limits.target));

  const is_realistic = requestedRate <= maxSafeRate * 1.2; // 20% tolerance

  let message = '';
  if (is_realistic) {
    message = `Your goal of ${change > 0 ? 'gaining' : 'losing'} ${absChange.toFixed(1)}kg in ${target_weeks} weeks is achievable. You're on a good track!`;
  } else if (goal === 'gain_muscle') {
    message = `Gaining ${absChange.toFixed(1)}kg of muscle in ${target_weeks} weeks isn't possible — muscle grows at most 0.5kg/week. A realistic timeline is ${realisticWeeks} weeks. We'll set your plan for steady muscle gain.`;
  } else if (goal === 'lose_weight') {
    message = `Losing ${absChange.toFixed(1)}kg in ${target_weeks} weeks would require an extreme deficit. Safe fat loss is max 1kg/week. A healthy timeline is ${realisticWeeks} weeks.`;
  } else {
    message = `${change > 0 ? 'Gaining' : 'Losing'} ${absChange.toFixed(1)}kg in ${target_weeks} weeks is faster than recommended. We'll aim for ${realisticWeeks} weeks instead to keep you healthy.`;
  }

  return {
    is_realistic,
    requested_change_kg: change,
    requested_weeks: target_weeks,
    requested_rate_kg_per_week: requestedRate,
    max_safe_rate_kg_per_week: maxSafeRate,
    realistic_weeks: realisticWeeks,
    message,
  };
}

/**
 * Analyses weight logs vs expected progress and calculates
 * how many calories to add or subtract for next week.
 */
export function analyseProgress(
  weightLogs: WeightLog[],
  goal: Goal,
  gender: Gender,
  current_target_calories: number,
): AdaptiveAnalysis {
  // Need at least 2 logs to compute a rate of change
  if (weightLogs.length < MIN_WEEKS_FOR_ADJUSTMENT) {
    return {
      weeks_tracked: weightLogs.length,
      current_weight_kg: weightLogs[weightLogs.length - 1]?.weight_kg ?? 0,
      start_weight_kg: weightLogs[0]?.weight_kg ?? 0,
      total_change_kg: 0,
      weekly_rate_kg: 0,
      expected_rate_kg: EXPECTED_WEEKLY_CHANGE[goal].target,
      on_track: true,
      status: 'not_enough_data',
      status_message: 'Log your weight for at least 2 weeks to get personalised adjustments.',
      recommended_adjustment_kcal: 0,
      reason: 'not_enough_data',
      current_target_calories,
      new_target_calories: current_target_calories,
    };
  }

  // Sort by date ascending
  const sorted = [...weightLogs].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
  );

  const startWeight = sorted[0].weight_kg;
  const latestWeight = sorted[sorted.length - 1].weight_kg;
  const totalChange = latestWeight - startWeight;

  // Calculate weeks elapsed between first and last log
  const msElapsed = new Date(sorted[sorted.length - 1].logged_at).getTime()
    - new Date(sorted[0].logged_at).getTime();
  const weeksElapsed = Math.max(msElapsed / (7 * 24 * 60 * 60 * 1000), 1);
  const weeklyRate = totalChange / weeksElapsed;

  const expected = EXPECTED_WEEKLY_CHANGE[goal];
  const expectedRate = expected.target;

  // Determine status
  let status: AdaptiveAnalysis['status'];
  let adjustment = 0;
  let reason = '';
  let statusMessage = '';

  if (goal === 'maintain') {
    if (Math.abs(weeklyRate) <= 0.15) {
      status = 'on_track';
      adjustment = 0;
      reason = 'on_track';
      statusMessage = 'Your weight is stable. Keep it up!';
    } else if (weeklyRate > 0.15) {
      status = 'too_fast';
      adjustment = -150;
      reason = 'gaining_unintentionally';
      statusMessage = `You're gaining ${weeklyRate.toFixed(2)}kg/week. Reducing calories slightly to maintain your weight.`;
    } else {
      status = 'too_fast';
      adjustment = +150;
      reason = 'losing_unintentionally';
      statusMessage = `You're losing ${Math.abs(weeklyRate).toFixed(2)}kg/week. Adding calories to maintain your weight.`;
    }
  } else if (goal === 'lose_weight') {
    if (weeklyRate > -0.1) {
      // Not losing enough / gaining
      status = weeklyRate > 0 ? 'wrong_direction' : 'too_slow';
      adjustment = Math.min(-200, -Math.round((expectedRate - weeklyRate) * CALS_PER_KG / 7));
      adjustment = Math.max(adjustment, -MAX_WEEKLY_ADJUSTMENT);
      reason = weeklyRate > 0 ? 'gaining_instead_of_losing' : 'losing_too_slowly';
      statusMessage = weeklyRate > 0
        ? `You're gaining weight instead of losing. Reducing your calories by ${Math.abs(adjustment)} kcal.`
        : `You're losing weight slower than expected (${Math.abs(weeklyRate).toFixed(2)}kg/week vs target ${Math.abs(expectedRate)}kg/week). Reducing by ${Math.abs(adjustment)} kcal.`;
    } else if (weeklyRate < expected.min) {
      // Losing too fast — unsafe
      status = 'too_fast';
      adjustment = +200;
      reason = 'losing_too_fast';
      statusMessage = `You're losing ${Math.abs(weeklyRate).toFixed(2)}kg/week which is too aggressive. Adding 200 kcal to protect muscle mass.`;
    } else {
      // On track
      status = 'on_track';
      adjustment = 0;
      reason = 'on_track';
      statusMessage = `You're losing ${Math.abs(weeklyRate).toFixed(2)}kg/week — right on target!`;
    }
  } else {
    // gain_muscle or gain_weight
    if (weeklyRate < expected.min * 0.5) {
      // Not gaining enough
      status = weeklyRate < 0 ? 'wrong_direction' : 'too_slow';
      adjustment = Math.min(+MAX_WEEKLY_ADJUSTMENT, Math.round((expectedRate - weeklyRate) * CALS_PER_KG / 7));
      reason = weeklyRate < 0 ? 'losing_instead_of_gaining' : 'gaining_too_slowly';
      statusMessage = weeklyRate < 0
        ? `You're losing weight instead of gaining! Adding ${adjustment} kcal to your daily target.`
        : `You're gaining ${weeklyRate.toFixed(2)}kg/week but target is ${expectedRate}kg/week. Adding ${adjustment} kcal.`;
    } else if (weeklyRate > expected.max * 1.3) {
      // Gaining too fast (mostly fat)
      status = 'too_fast';
      adjustment = -150;
      reason = 'gaining_too_fast';
      statusMessage = `You're gaining ${weeklyRate.toFixed(2)}kg/week which may be more fat than muscle. Reducing by 150 kcal.`;
    } else {
      // On track
      status = 'on_track';
      adjustment = 0;
      reason = 'on_track';
      statusMessage = `You're gaining ${weeklyRate.toFixed(2)}kg/week — right on target!`;
    }
  }

  // Clamp adjustment
  adjustment = Math.max(-MAX_WEEKLY_ADJUSTMENT, Math.min(MAX_WEEKLY_ADJUSTMENT, adjustment));

  // Apply minimum calorie floor
  const minCals = MIN_CALORIES[gender];
  const newTarget = Math.max(minCals, current_target_calories + adjustment);
  const actualAdjustment = newTarget - current_target_calories;

  const on_track = status === 'on_track';

  return {
    weeks_tracked: Math.floor(weeksElapsed),
    current_weight_kg: latestWeight,
    start_weight_kg: startWeight,
    total_change_kg: totalChange,
    weekly_rate_kg: Math.round(weeklyRate * 100) / 100,
    expected_rate_kg: expectedRate,
    on_track,
    status,
    status_message: statusMessage,
    recommended_adjustment_kcal: actualAdjustment,
    reason,
    current_target_calories,
    new_target_calories: newTarget,
  };
}
