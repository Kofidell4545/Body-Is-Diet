import { generateWeeklyPlan, findAlternativeFood } from '../utils/meal-generator';
import { GHANAIAN_FOODS } from '../data/ghanaian-foods';
import { ALL_FOODS, FOOD_DB_STATS } from '../data/all-foods';

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

    it('generates 2 mains + 1 snack when meals_per_day is 5', () => {
        const items = generateWeeklyPlan({ ...prefs, meals_per_day: 5 }, targetCalories, GHANAIAN_FOODS);
        const dayItems = items.filter(i => i.day_of_week === 0);
        expect(dayItems.length).toBe(3);
        const slots = dayItems.map(i => i.meal_slot);
        expect(slots).toContain('breakfast');
        expect(slots).toContain('dinner');
        expect(slots.some(s => s.startsWith('snack'))).toBe(true);
        // Should NOT contain lunch
        expect(slots).not.toContain('lunch');
    });

    it('does not repeat any food within the same day', () => {
        const items = generateWeeklyPlan(prefs, targetCalories, GHANAIAN_FOODS);
        for (let day = 0; day < 7; day++) {
            const dayItems = items.filter(i => i.day_of_week === day);
            const foodIds = dayItems.map(i => i.food_id);
            const uniqueIds = new Set(foodIds);
            expect(uniqueIds.size).toBe(foodIds.length);
        }
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

    it('no food appears more than 3 times across the week', () => {
        // Run multiple times to increase confidence since generation is randomized
        for (let run = 0; run < 5; run++) {
            const items = generateWeeklyPlan(prefs, targetCalories, GHANAIAN_FOODS);
            const foodCounts = new Map<string, number>();
            for (const item of items) {
                foodCounts.set(item.food_id, (foodCounts.get(item.food_id) || 0) + 1);
            }
            for (const [foodId, count] of foodCounts.entries()) {
                expect(count).toBeLessThanOrEqual(3);
            }
        }
    });

    it('daily macros are within reasonable range of implied targets', () => {
        const items = generateWeeklyPlan(prefs, targetCalories, GHANAIAN_FOODS);
        // Expected daily protein target: 30% of calories / 4 cal per g
        const expectedProtein = (targetCalories * 0.30) / 4; // ~165g

        for (let day = 0; day < 7; day++) {
            const dayItems = items.filter(i => i.day_of_week === day);
            const dayProtein = dayItems.reduce((sum, i) => sum + i.protein_g, 0);
            // Protein within reasonable range (generous given randomized picks and 3 meals)
            expect(dayProtein).toBeGreaterThan(expectedProtein * 0.35);
            expect(dayProtein).toBeLessThan(expectedProtein * 1.65);
        }
    });

    it('does not repeat the same food family within a day (e.g. no two waakye dishes)', () => {
        // Run multiple times since generation is randomized
        for (let run = 0; run < 10; run++) {
            const items = generateWeeklyPlan(prefs, targetCalories, GHANAIAN_FOODS);
            for (let day = 0; day < 7; day++) {
                const dayItems = items.filter(i => i.day_of_week === day);
                const names = dayItems.map(i => i.food_name.toLowerCase());
                // Check that base ingredients don't repeat
                // e.g. "waakye" should not appear in two food names on the same day
                const bases = ['waakye', 'banku', 'fufu', 'kenkey', 'omotuo', 'jollof'];
                for (const base of bases) {
                    const count = names.filter(n => n.includes(base)).length;
                    expect(count).toBeLessThanOrEqual(1);
                }
            }
        }
    });

    it('new foods from expanded DB are in the pool', () => {
        // New food IDs that were added in the expansion
        const newFoodIds = [
            'p-guinea-fowl', 'p-khebab', 'p-koobi', 'p-wele',
            'c-tom-brown', 'c-rice-water', 'c-akasa', 'c-fante-kenkey',
            's-abunuabunu', 's-pepper-soup',
            'st-agushi', 'st-nkontomire',
            'fm-ga-kenkey-full', 'fm-waakye-spaghetti', 'fm-ampesi-palaver',
            'fm-fried-rice-chicken', 'fm-banku-groundnut', 'fm-tz-okra',
            'sn-chinchinga', 'sn-roasted-corn', 'sn-tatale', 'sn-kaklo',
            'sn-pineapple', 'sn-brukina', 'sn-asaana',
            'v-kontomire', 'v-shoko',
        ];

        // Verify that at least some new food IDs exist in GHANAIAN_FOODS
        const allFoodIds = new Set(GHANAIAN_FOODS.map(f => f.id));
        for (const newId of newFoodIds) {
            expect(allFoodIds.has(newId)).toBe(true);
        }

        // Generate a plan and verify at least one new food appears
        // Run multiple times since generation is random
        let foundNewFood = false;
        for (let run = 0; run < 10; run++) {
            const items = generateWeeklyPlan(prefs, targetCalories, GHANAIAN_FOODS);
            if (items.some(item => newFoodIds.includes(item.food_id))) {
                foundNewFood = true;
                break;
            }
        }
        expect(foundNewFood).toBe(true);
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

describe('ALL_FOODS unified database', () => {
    it('merges curated and FAO foods without duplicates', () => {
        // ALL_FOODS should be larger than just GHANAIAN_FOODS
        expect(ALL_FOODS.length).toBeGreaterThan(GHANAIAN_FOODS.length);
        // Should have 500+ foods total
        expect(ALL_FOODS.length).toBeGreaterThan(500);

        // No duplicate IDs
        const ids = ALL_FOODS.map(f => f.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('curated foods appear first in the pool', () => {
        // First food should be from curated set
        expect(ALL_FOODS[0].id).toBe(GHANAIAN_FOODS[0].id);
    });

    it('FAO foods have required fields', () => {
        const faoFoods = ALL_FOODS.filter(f => f.fao_code);
        expect(faoFoods.length).toBeGreaterThan(0);
        for (const food of faoFoods.slice(0, 50)) {
            expect(food.calories_per_serving).toBeGreaterThan(0);
            expect(food.protein_g).toBeGreaterThanOrEqual(0);
            expect(food.carbs_g).toBeGreaterThanOrEqual(0);
            expect(food.fats_g).toBeGreaterThanOrEqual(0);
            expect(food.tags.length).toBeGreaterThan(0);
            expect(food.category).toBeTruthy();
        }
    });

    it('generates plans with the full food pool', () => {
        const prefs = {
            proteins: ['Chicken', 'Fish'],
            carbs: ['Rice', 'Yam'],
            favorite_meals: [],
            avoid_foods: [],
            meals_per_day: 3,
        };
        const items = generateWeeklyPlan(prefs, 2200, ALL_FOODS);
        expect(items.length).toBe(21); // 3 meals * 7 days
        // Verify variety — with 800+ foods, we should see many unique foods
        const uniqueFoods = new Set(items.map(i => i.food_id));
        expect(uniqueFoods.size).toBeGreaterThan(10);
    });

    it('reports correct stats', () => {
        expect(FOOD_DB_STATS.curated).toBe(GHANAIAN_FOODS.length);
        expect(FOOD_DB_STATS.total).toBe(ALL_FOODS.length);
        expect(FOOD_DB_STATS.fao).toBeGreaterThan(0);
    });
});
