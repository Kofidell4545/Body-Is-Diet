import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { mealPlanApi } from '../services/api';
import { WeeklyMealPlan, MealPlanItem, DayPlan } from '../types';

type MealPlanContextType = {
    weekPlan: WeeklyMealPlan | null;
    selectedDay: number;
    setSelectedDay: (day: number) => void;
    isLoading: boolean;
    error: string | null;
    fetchPlan: (weekStart?: string) => Promise<void>;
    generatePlan: (weekStart?: string) => Promise<void>;
    swapMeal: (itemId: string) => Promise<void>;
    completeMeal: (itemId: string) => Promise<void>;
    todayPlan: DayPlan | null;
    selectedDayPlan: DayPlan | null;
};

const MealPlanContext = createContext<MealPlanContextType | null>(null);

export function useMealPlan() {
    const context = useContext(MealPlanContext);
    if (!context) throw new Error('useMealPlan must be used within a MealPlanProvider');
    return context;
}

function buildDayPlan(items: MealPlanItem[], dayOfWeek: number): DayPlan {
    const meals = items.filter(i => i.day_of_week === dayOfWeek);
    return {
        day_of_week: dayOfWeek,
        meals,
        totalCalories: meals.reduce((s, m) => s + m.calories, 0),
        totalProtein: meals.reduce((s, m) => s + m.protein_g, 0),
        totalCarbs: meals.reduce((s, m) => s + m.carbs_g, 0),
        totalFats: meals.reduce((s, m) => s + m.fats_g, 0),
        completedCalories: meals.filter(m => m.is_completed).reduce((s, m) => s + m.calories, 0),
    };
}

function getTodayDayOfWeek(): number {
    const jsDay = new Date().getDay(); // 0=Sun, 1=Mon...
    return jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon, 6=Sun
}

export function MealPlanProvider({ children }: { children: React.ReactNode }) {
    const [weekPlan, setWeekPlan] = useState<WeeklyMealPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState(getTodayDayOfWeek());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPlan = useCallback(async (weekStart?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const plan = await mealPlanApi.getWeekPlan(weekStart);
            setWeekPlan(plan);
        } catch (err: any) {
            if (err?.response?.status === 404) {
                setWeekPlan(null);
            } else {
                setError(err?.response?.data?.message || err?.message || 'Failed to load meal plan');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const generatePlan = useCallback(async (weekStart?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const plan = await mealPlanApi.generate(weekStart);
            setWeekPlan(plan);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to generate meal plan');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const swapMeal = useCallback(async (itemId: string) => {
        if (!weekPlan) return;
        try {
            const updated = await mealPlanApi.swapMeal(itemId);
            setWeekPlan(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    items: prev.items.map(i => i.id === itemId ? updated : i),
                };
            });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to swap meal');
        }
    }, [weekPlan]);

    const completeMeal = useCallback(async (itemId: string) => {
        if (!weekPlan) return;
        try {
            const updated = await mealPlanApi.completeMeal(itemId);
            setWeekPlan(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    items: prev.items.map(i => i.id === itemId ? updated : i),
                };
            });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to update meal');
        }
    }, [weekPlan]);

    const todayPlan = useMemo(() => {
        if (!weekPlan) return null;
        return buildDayPlan(weekPlan.items, getTodayDayOfWeek());
    }, [weekPlan]);

    const selectedDayPlan = useMemo(() => {
        if (!weekPlan) return null;
        return buildDayPlan(weekPlan.items, selectedDay);
    }, [weekPlan, selectedDay]);

    return (
        <MealPlanContext.Provider value={{
            weekPlan, selectedDay, setSelectedDay, isLoading, error,
            fetchPlan, generatePlan, swapMeal, completeMeal,
            todayPlan, selectedDayPlan,
        }}>
            {children}
        </MealPlanContext.Provider>
    );
}
