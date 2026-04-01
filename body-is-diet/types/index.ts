// ── User & Auth types ────────────────────────────────────────────────────────
export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

// ── API response wrapper ──────────────────────────────────────────────────────
export interface ApiSuccess<T> {
    success: true;
    data: T;
    message?: string;
}

export interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Preferences types ───────────────────────────────────────────────────────
export interface UserPreferences {
    goal: 'lose_weight' | 'gain_muscle' | 'gain_weight' | 'maintain';
    age: number;
    gender: 'male' | 'female' | 'other';
    height_cm: number;
    weight_kg: number;
    target_weight_kg?: number;
    activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete';
    proteins: string[];
    carbs: string[];
    avoid_foods?: string[];
    favorite_meals?: string[];
    meals_per_day: number;
}

// ── Meal Plan types ─────────────────────────────────────────────────────────
export interface MealPlanItem {
    id: string;
    meal_plan_id: string;
    day_of_week: number;
    meal_slot: string;
    food_id: string;
    food_name: string;
    servings: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    is_completed: boolean;
    swapped_from?: string;
}

export interface MacroTargets {
    proteinG: number;
    carbsG: number;
    fatsG: number;
}

export interface WeeklyMealPlan {
    id: string;
    week_start: string;
    tdee: number;
    target_calories: number;
    macro_targets: MacroTargets;
    items: MealPlanItem[];
}

export interface DayPlan {
    day_of_week: number;
    meals: MealPlanItem[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
    completedCalories: number;
}
