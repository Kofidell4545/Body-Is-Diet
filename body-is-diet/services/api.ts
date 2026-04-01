import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AuthResponse, AuthTokens, UserPreferences, WeeklyMealPlan, MealPlanItem } from '../types';


// ── Config ────────────────────────────────────────────────────────────────────
export const API_URL = 'http://localhost:3000';

const KEYS = {
    ACCESS_TOKEN: 'bid_access_token',
    REFRESH_TOKEN: 'bid_refresh_token',
    ONBOARDING_DONE: 'bid_onboarding_done',
    USER_NAME: 'bid_user_name',
} as const;

// ── Token helpers ─────────────────────────────────────────────────────────────
export async function saveTokens(tokens: AuthTokens) {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, tokens.accessToken);
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, tokens.refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}

export async function clearTokens() {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
}

export async function saveUserName(name: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.USER_NAME, name);
}

export async function getUserName(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.USER_NAME);
}

// ── Onboarding helpers ────────────────────────────────────────────────────────
export async function markOnboardingComplete(): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ONBOARDING_DONE, 'true');
}

export async function getOnboardingComplete(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(KEYS.ONBOARDING_DONE);
    return val === 'true';
}

export async function clearOnboardingStatus(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.ONBOARDING_DONE);
}

// ── Axios instance ────────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Refresh token on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    failedQueue = [];
}

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = error.config as typeof error.config & { _retry?: boolean };

        // Don't try to refresh tokens on auth endpoints — these are initial
        // authentication requests where no token exists yet
        const isAuthEndpoint = original.url?.startsWith('/auth/');

        if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    if (original.headers) original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                });
            }

            original._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await getRefreshToken();
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
                const tokens: AuthTokens = data.data;
                await saveTokens(tokens);
                processQueue(null, tokens.accessToken);
                if (original.headers) original.headers.Authorization = `Bearer ${tokens.accessToken}`;
                return api(original);
            } catch (err) {
                processQueue(err, null);
                await clearTokens();
                throw err;
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// ── Auth API calls ────────────────────────────────────────────────────────────
export const authApi = {
    async register(name: string, email: string, password: string): Promise<AuthResponse> {
        const { data } = await api.post('/auth/register', { name, email, password });
        if (!data.success) throw new Error(data.message || 'Registration failed');
        await saveTokens(data.data);
        if (data.data.user?.name) await saveUserName(data.data.user.name);
        return data.data as AuthResponse;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const { data } = await api.post('/auth/login', { email, password });
        if (!data.success) throw new Error(data.message || 'Login failed');
        await saveTokens(data.data);
        if (data.data.user?.name) await saveUserName(data.data.user.name);
        return data.data as AuthResponse;
    },

    async forgotPassword(email: string): Promise<string> {
        const { data } = await api.post('/auth/forgot-password', { email });
        return data.message || 'Reset link sent!';
    },

    async resetPassword(token: string, password: string): Promise<string> {
        const { data } = await api.post('/auth/reset-password', { token, password });
        return data.message || 'Password reset successfully';
    },

    async logout(): Promise<void> {
        const refreshToken = await getRefreshToken();
        try {
            await api.post('/auth/logout', { refreshToken });
        } finally {
            await clearTokens();
            await SecureStore.deleteItemAsync(KEYS.USER_NAME);
        }
    },
};

// ── User API calls ────────────────────────────────────────────────────────────
export const userApi = {
    async getPreferences(): Promise<UserPreferences> {
        const { data } = await api.get('/user/preferences');
        return data as UserPreferences;
    },

    async savePreferences(preferences: UserPreferences): Promise<void> {
        await api.post('/user/preferences', preferences);
    },
};

// ── Meal Plan API calls ──────────────────────────────────────────────────────
export const mealPlanApi = {
    async generate(weekStart?: string): Promise<WeeklyMealPlan> {
        const { data } = await api.post('/meal-plan/generate', { week_start: weekStart });
        return data.data as WeeklyMealPlan;
    },

    async getWeekPlan(weekStart?: string): Promise<WeeklyMealPlan> {
        const params = weekStart ? { week_start: weekStart } : {};
        const { data } = await api.get('/meal-plan', { params });
        return data.data as WeeklyMealPlan;
    },

    async swapMeal(itemId: string, newFoodId?: string): Promise<MealPlanItem> {
        const { data } = await api.post('/meal-plan/swap', { item_id: itemId, new_food_id: newFoodId });
        return data.data as MealPlanItem;
    },

    async completeMeal(itemId: string): Promise<MealPlanItem> {
        const { data } = await api.patch(`/meal-plan/item/${itemId}/complete`);
        return data.data as MealPlanItem;
    },
};

// ── Progress API calls ───────────────────────────────────────────────────────
export const progressApi = {
    async logWeight(weight_kg: number, body_fat_pct?: number, notes?: string) {
        const { data } = await api.post('/progress/weight', { weight_kg, body_fat_pct, notes });
        return data.data;
    },

    async getWeightHistory(limit = 52) {
        const { data } = await api.get('/progress/weight/history', { params: { limit } });
        return data.data as Array<{ id: string; weight_kg: number; body_fat_pct?: number; notes?: string; logged_at: string }>;
    },

    async getAnalysis() {
        const { data } = await api.get('/progress/analysis');
        return data.data as {
            analysis: {
                weeks_tracked: number;
                current_weight_kg: number;
                start_weight_kg: number;
                total_change_kg: number;
                weekly_rate_kg: number;
                expected_rate_kg: number;
                on_track: boolean;
                status: string;
                status_message: string;
                recommended_adjustment_kcal: number;
                reason: string;
                current_target_calories: number;
                new_target_calories: number;
            };
            goal_realism: {
                is_realistic: boolean;
                message: string;
                realistic_weeks: number;
            } | null;
            base_tdee: number;
            macro_targets: { proteinG: number; carbsG: number; fatsG: number };
            logs_count: number;
        };
    },

    async getWeeklySummary(weekStart?: string) {
        const params = weekStart ? { week_start: weekStart } : {};
        const { data } = await api.get('/progress/weekly-summary', { params });
        return data.data;
    },
};

export default api;