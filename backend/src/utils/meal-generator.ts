import { FoodItem } from '../data/ghanaian-foods';

export interface MealSlotAllocation {
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calorieRatio: number;
}

export interface GeneratedMealItem {
  day_of_week: number;
  meal_slot: string;
  food_id: string;
  food_name: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

interface UserPrefsForGeneration {
  proteins: string[];
  carbs: string[];
  favorite_meals?: string[];
  avoid_foods?: string[];
  meals_per_day: number;
}

function getSlotAllocations(mealsPerDay: number): MealSlotAllocation[] {
  switch (mealsPerDay) {
    case 4:
      return [
        { slot: 'breakfast', calorieRatio: 0.25 },
        { slot: 'lunch', calorieRatio: 0.30 },
        { slot: 'dinner', calorieRatio: 0.30 },
        { slot: 'snack', calorieRatio: 0.15 },
      ];
    case 5:
      return [
        { slot: 'breakfast', calorieRatio: 0.22 },
        { slot: 'lunch', calorieRatio: 0.28 },
        { slot: 'dinner', calorieRatio: 0.28 },
        { slot: 'snack', calorieRatio: 0.12 },
        { slot: 'snack', calorieRatio: 0.10 },
      ];
    default: // 3 meals
      return [
        { slot: 'breakfast', calorieRatio: 0.28 },
        { slot: 'lunch', calorieRatio: 0.38 },
        { slot: 'dinner', calorieRatio: 0.34 },
      ];
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function matchesSlotTags(food: FoodItem, slot: string): boolean {
  const tags = food.tags;
  if (slot === 'breakfast') return tags.includes('breakfast') || tags.includes('porridge');
  if (slot === 'snack') return tags.includes('snack') || food.category === 'snack';
  // lunch and dinner are broadly compatible
  return tags.includes('lunch') || tags.includes('dinner');
}

function matchesUserPrefs(food: FoodItem, prefs: UserPrefsForGeneration): boolean {
  // Check avoid_foods
  if (prefs.avoid_foods?.length) {
    const avoidLower = prefs.avoid_foods.map(f => f.toLowerCase());
    if (avoidLower.some(a => food.name.toLowerCase().includes(a))) return false;
  }
  return true;
}

function isFavorite(food: FoodItem, prefs: UserPrefsForGeneration): boolean {
  if (!prefs.favorite_meals?.length) return false;
  const favLower = prefs.favorite_meals.map(f => f.toLowerCase());
  return favLower.some(f => food.name.toLowerCase().includes(f));
}

function pickFoodForSlot(
  slot: string,
  targetCalories: number,
  foods: FoodItem[],
  prefs: UserPrefsForGeneration,
  previousDayFoodIds: Set<string>,
): FoodItem | null {
  // Filter to slot-appropriate, preference-matching foods
  let candidates = foods.filter(f =>
    matchesSlotTags(f, slot) && matchesUserPrefs(f, prefs)
  );

  if (candidates.length === 0) {
    // Fallback: any food that matches prefs
    candidates = foods.filter(f => matchesUserPrefs(f, prefs));
  }

  if (candidates.length === 0) return null;

  // Sort by preference: favorites first, then closeness to target calories
  const scored = candidates.map(food => {
    let score = 0;
    // Favor favorites
    if (isFavorite(food, prefs)) score += 100;
    // Penalize repeats from previous day
    if (previousDayFoodIds.has(food.id)) score -= 200;
    // Favor closeness to target calories (within 30% tolerance)
    const calorieDiff = Math.abs(food.calories_per_serving - targetCalories);
    const maxDiff = targetCalories * 0.5;
    score -= (calorieDiff / maxDiff) * 50;

    return { food, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Pick from top 5 with some randomness
  const topN = scored.slice(0, Math.min(5, scored.length));
  const pick = topN[Math.floor(Math.random() * topN.length)];
  return pick.food;
}

export function generateWeeklyPlan(
  prefs: UserPrefsForGeneration,
  targetCalories: number,
  foods: FoodItem[],
): GeneratedMealItem[] {
  const slotAllocations = getSlotAllocations(prefs.meals_per_day);
  const items: GeneratedMealItem[] = [];
  let previousDayFoodIds = new Set<string>();

  for (let day = 0; day < 7; day++) {
    const currentDayFoodIds = new Set<string>();
    const shuffledFoods = shuffleArray(foods);

    // Track snack index for multiple snacks
    let snackIndex = 0;

    for (const allocation of slotAllocations) {
      const slotCalories = Math.round(targetCalories * allocation.calorieRatio);
      const food = pickFoodForSlot(
        allocation.slot,
        slotCalories,
        shuffledFoods,
        prefs,
        previousDayFoodIds,
      );

      if (!food) continue;

      // Calculate servings to match target calories
      const servings = Math.max(0.5, Math.min(2.5,
        Math.round((slotCalories / food.calories_per_serving) * 10) / 10
      ));

      const actualCalories = Math.round(food.calories_per_serving * servings);

      items.push({
        day_of_week: day,
        meal_slot: allocation.slot === 'snack' ? `snack_${++snackIndex}` : allocation.slot,
        food_id: food.id,
        food_name: food.name,
        servings,
        calories: actualCalories,
        protein_g: Math.round(food.protein_g * servings),
        carbs_g: Math.round(food.carbs_g * servings),
        fats_g: Math.round(food.fats_g * servings),
      });

      currentDayFoodIds.add(food.id);
    }

    previousDayFoodIds = currentDayFoodIds;
  }

  return items;
}

export function findAlternativeFood(
  currentFoodId: string,
  slot: string,
  targetCalories: number,
  foods: FoodItem[],
  prefs: UserPrefsForGeneration,
): FoodItem | null {
  const candidates = foods.filter(f =>
    f.id !== currentFoodId &&
    matchesSlotTags(f, slot.replace(/_\d+$/, '')) &&
    matchesUserPrefs(f, prefs) &&
    Math.abs(f.calories_per_serving - targetCalories) < targetCalories * 0.4
  );

  if (candidates.length === 0) return null;

  const shuffled = shuffleArray(candidates);
  return shuffled[0];
}
