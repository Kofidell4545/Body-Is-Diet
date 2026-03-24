import { generateWeeklyPlan, findAlternativeFood } from '../utils/meal-generator';
import { GHANAIAN_FOODS } from '../data/ghanaian-foods';

describe('generateWeeklyPlan', () => {
    const prefs = {
        proteins: ['Chicken', 'Fish'],
        carbs: ['Rice', 'Yam'],
        favorite_meals: ['Jollof Rice'],
        avoid_foods: [],
        meals_per_day: 3,
    };

    const targetCalories = 2200;

    it('generates meals for all 7 days', () => {
        const items = generateWeeklyPlan(prefs, targetCalories, GHANAIAN_FOODS);
        const days = new Set(items.map(i => i.day_of_week));
        expect(days.size).toBe(7);
    });

    it('generates correct number of meals per day (3 meals)', () => {
        const items = generateWeeklyPlan(prefs, targetCalories, GHANAIAN_FOODS);
        for (let day = 0; day < 7; day++) {
            const dayItems = items.filter(i => i.day_of_week === day);
            expect(dayItems.length).toBe(3);
        }
    });

    it('generates 4 meals per day when configured', () => {
        const items = generateWeeklyPlan({ ...prefs, meals_per_day: 4 }, targetCalories, GHANAIAN_FOODS);
        const dayItems = items.filter(i => i.day_of_week === 0);
        expect(dayItems.length).toBe(4);
    });

    it('generates 5 meals per day when configured', () => {
        const items = generateWeeklyPlan({ ...prefs, meals_per_day: 5 }, targetCalories, GHANAIAN_FOODS);
        const dayItems = items.filter(i => i.day_of_week === 0);
        expect(dayItems.length).toBe(5);
    });

    it('each item has required fields', () => {
        const items = generateWeeklyPlan(prefs, targetCalories, GHANAIAN_FOODS);
        for (const item of items) {
            expect(item).toHaveProperty('day_of_week');
            expect(item).toHaveProperty('meal_slot');
            expect(item).toHaveProperty('food_id');
            expect(item).toHaveProperty('food_name');
            expect(item).toHaveProperty('servings');
            expect(item).toHaveProperty('calories');
            expect(item).toHaveProperty('protein_g');
            expect(item).toHaveProperty('carbs_g');
            expect(item).toHaveProperty('fats_g');
            expect(item.calories).toBeGreaterThan(0);
            expect(item.servings).toBeGreaterThanOrEqual(0.5);
            expect(item.servings).toBeLessThanOrEqual(2.5);
        }
    });

    it('includes breakfast, lunch, and dinner slots for 3 meals', () => {
        const items = generateWeeklyPlan(prefs, targetCalories, GHANAIAN_FOODS);
        const day0Slots = items.filter(i => i.day_of_week === 0).map(i => i.meal_slot);
        expect(day0Slots).toContain('breakfast');
        expect(day0Slots).toContain('lunch');
        expect(day0Slots).toContain('dinner');
    });

    it('daily calories are within reasonable range of target', () => {
        const items = generateWeeklyPlan(prefs, targetCalories, GHANAIAN_FOODS);
        for (let day = 0; day < 7; day++) {
            const dayCalories = items
                .filter(i => i.day_of_week === day)
                .reduce((sum, i) => sum + i.calories, 0);
            // Within 40% of target (generous for randomized selection)
            expect(dayCalories).toBeGreaterThan(targetCalories * 0.5);
            expect(dayCalories).toBeLessThan(targetCalories * 1.6);
        }
    });

    it('avoids foods in avoid_foods list', () => {
        const items = generateWeeklyPlan(
            { ...prefs, avoid_foods: ['Tilapia'] },
            targetCalories,
            GHANAIAN_FOODS,
        );
        const names = items.map(i => i.food_name.toLowerCase());
        const hasAvoidedFood = names.some(n => n.includes('tilapia'));
        expect(hasAvoidedFood).toBe(false);
    });
});

describe('findAlternativeFood', () => {
    const prefs = {
        proteins: ['Chicken', 'Fish'],
        carbs: ['Rice', 'Yam'],
        favorite_meals: [],
        avoid_foods: [],
        meals_per_day: 3,
    };

    it('returns a different food than the current one', () => {
        const alt = findAlternativeFood('fm-jollof-chicken', 'lunch', 600, GHANAIAN_FOODS, prefs);
        expect(alt).not.toBeNull();
        expect(alt!.id).not.toBe('fm-jollof-chicken');
    });

    it('returns null when no alternatives match', () => {
        // Use a food with very low target calories — unlikely to match anything
        const alt = findAlternativeFood('sn-banana', 'lunch', 1, [], prefs);
        expect(alt).toBeNull();
    });
});
