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
