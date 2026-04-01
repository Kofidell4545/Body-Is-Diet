export interface TDEEInput {
  age: number;
  gender: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete';
  goal: 'lose_weight' | 'gain_muscle' | 'gain_weight' | 'maintain';
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  macroSplit: {
    proteinG: number;
    carbsG: number;
    fatsG: number;
  };
}

const ACTIVITY_MULTIPLIERS: Record<TDEEInput['activity_level'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

const GOAL_MODIFIERS: Record<TDEEInput['goal'], number> = {
  lose_weight: 0.80,
  gain_muscle: 1.10,
  gain_weight: 1.15,
  maintain: 1.0,
};

// Macro ratios by goal: [protein%, carbs%, fats%]
const MACRO_RATIOS: Record<TDEEInput['goal'], [number, number, number]> = {
  lose_weight: [0.35, 0.40, 0.25],
  gain_muscle: [0.35, 0.45, 0.20],
  gain_weight: [0.25, 0.50, 0.25],
  maintain: [0.30, 0.45, 0.25],
};

export function calculateTDEE(input: TDEEInput): TDEEResult {
  // Mifflin-St Jeor equation
  const genderOffset = input.gender === 'male' ? 5 : -161;
  const bmr = Math.round(
    10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age + genderOffset
  );

  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[input.activity_level]);
  const targetCalories = Math.round(tdee * GOAL_MODIFIERS[input.goal]);

  const [proteinRatio, carbsRatio, fatsRatio] = MACRO_RATIOS[input.goal];

  // Protein: 4 cal/g, Carbs: 4 cal/g, Fats: 9 cal/g
  const macroSplit = {
    proteinG: Math.round((targetCalories * proteinRatio) / 4),
    carbsG: Math.round((targetCalories * carbsRatio) / 4),
    fatsG: Math.round((targetCalories * fatsRatio) / 9),
  };

  return { bmr, tdee, targetCalories, macroSplit };
}
