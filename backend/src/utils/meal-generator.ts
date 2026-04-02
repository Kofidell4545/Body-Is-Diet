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
  goal?: 'lose_weight' | 'gain_muscle' | 'gain_weight' | 'maintain';
}

interface DayMacros {
  protein: number;
  carbs: number;
  fats: number;
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
    case 5: // 2 mains + 1 snack
      return [
        { slot: 'breakfast', calorieRatio: 0.35 },
        { slot: 'dinner', calorieRatio: 0.45 },
        { slot: 'snack', calorieRatio: 0.20 },
      ];
    default: // 3 meals
      return [
        { slot: 'breakfast', calorieRatio: 0.28 },
        { slot: 'lunch', calorieRatio: 0.38 },
        { slot: 'dinner', calorieRatio: 0.34 },
      ];
  }
}

/**
 * Derive a food "family" from its properties so that foods sharing the same
 * base ingredient (waakye, banku, fufu, rice, yam, plantain, etc.) are treated
 * as the same family for same-day deduplication.
 *
 * This is algorithmic — it reads from the food's id, tags, and category to
 * determine the family. Users can still get repeats if the pool is exhausted.
 */
const FAMILY_KEYWORDS = [
  'waakye', 'banku', 'fufu', 'kenkey', 'jollof', 'omotuo', 'tuo-zaafi',
  'ampesi', 'gari', 'oats', 'hausa-koko', 'tom-brown', 'rice-water', 'akasa',
  'yam', 'plantain', 'rice', 'millet', 'bread', 'tilapia', 'chicken',
  'groundnut-soup', 'light-soup', 'palm-nut-soup', 'okra-soup',
];

function getFoodFamily(food: FoodItem): string {
  const idLower = food.id.toLowerCase();
  // Full meals: extract the dominant base from the ID
  // e.g. fm-waakye-full → waakye, fm-banku-tilapia → banku, fm-jollof-chicken → jollof
  for (const kw of FAMILY_KEYWORDS) {
    if (idLower.includes(kw)) return kw;
  }
  // Fallback: use the food id itself (unique family)
  return food.id;
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

function matchesPreferredProteinsOrCarbs(food: FoodItem, prefs: UserPrefsForGeneration): boolean {
  const nameLower = food.name.toLowerCase();
  const tagsLower = food.tags.map(t => t.toLowerCase());

  if (prefs.proteins?.length) {
    const protLower = prefs.proteins.map(p => p.toLowerCase());
    if (protLower.some(p => nameLower.includes(p) || tagsLower.some(t => t.includes(p)))) return true;
  }
  if (prefs.carbs?.length) {
    const carbLower = prefs.carbs.map(c => c.toLowerCase());
    if (carbLower.some(c => nameLower.includes(c) || tagsLower.some(t => t.includes(c)))) return true;
  }
  return false;
}

/**
 * Score a food candidate for a given slot (100 points max).
 *
 * Breakdown:
 *  - Calorie fit (35pts max)
 *  - Macro balance (25pts max)
 *  - Preference (20pts max)
 *  - Variety (10pts max)
 *  - GI bonus (10pts max)
 */
function scoreFood(
  food: FoodItem,
  targetCalories: number,
  prefs: UserPrefsForGeneration,
  previousDayFoodIds: Set<string>,
  weekFoodCounts: Map<string, number>,
  dayMacros: DayMacros,
  dailyMacroTargets: DayMacros,
): number {
  let score = 0;

  // ── Calorie fit (35pts) ──────────────────────────────────────────────
  const calorieDiff = Math.abs(food.calories_per_serving - targetCalories);
  const maxDiff = targetCalories * 0.5;
  const calorieFit = Math.max(0, 1 - calorieDiff / maxDiff);
  score += calorieFit * 35;

  // ── Macro balance (25pts) ────────────────────────────────────────────
  const remainingProtein = Math.max(0, dailyMacroTargets.protein - dayMacros.protein);
  const remainingCarbs = Math.max(0, dailyMacroTargets.carbs - dayMacros.carbs);
  const remainingFats = Math.max(0, dailyMacroTargets.fats - dayMacros.fats);
  const totalRemaining = remainingProtein + remainingCarbs + remainingFats;

  if (totalRemaining > 0) {
    // How well does this food fill remaining macro gaps?
    const proteinFill = remainingProtein > 0 ? Math.min(food.protein_g / remainingProtein, 1) : 0;
    const carbsFill = remainingCarbs > 0 ? Math.min(food.carbs_g / remainingCarbs, 1) : 0;
    const fatsFill = remainingFats > 0 ? Math.min(food.fats_g / remainingFats, 1) : 0;
    const macroScore = (proteinFill + carbsFill + fatsFill) / 3;
    score += macroScore * 25;
  } else {
    score += 12; // neutral when targets are already met
  }

  // ── Preference (20pts) ───────────────────────────────────────────────
  if (isFavorite(food, prefs)) {
    score += 20;
  } else if (matchesPreferredProteinsOrCarbs(food, prefs)) {
    score += 10;
  }

  // ── Variety (10pts) ──────────────────────────────────────────────────
  let varietyScore = 10;
  const weekCount = weekFoodCounts.get(food.id) || 0;
  if (weekCount > 0) varietyScore -= weekCount * 5;
  if (previousDayFoodIds.has(food.id)) varietyScore -= 10;
  score += Math.max(-10, varietyScore); // Allow slight negative for heavy repeats

  // ── GI bonus (10pts) ─────────────────────────────────────────────────
  if (prefs.goal === 'lose_weight' && food.glycemic_index != null) {
    if (food.glycemic_index < 55) {
      score += 10;
    } else if (food.glycemic_index < 70) {
      score += 5;
    }
    // high GI: 0 bonus
  } else {
    score += 5; // neutral when goal is not lose_weight
  }

  return score;
}

function pickFoodForSlot(
  slot: string,
  targetCalories: number,
  foods: FoodItem[],
  prefs: UserPrefsForGeneration,
  previousDayFoodIds: Set<string>,
  currentDayFoodIds: Set<string>,
  weekFoodCounts?: Map<string, number>,
  dayMacros?: DayMacros,
  dailyMacroTargets?: DayMacros,
  currentDayFamilies?: Set<string>,
): FoodItem | null {
  const _weekFoodCounts = weekFoodCounts ?? new Map<string, number>();
  const _dayMacros = dayMacros ?? { protein: 0, carbs: 0, fats: 0 };
  const _dailyMacroTargets = dailyMacroTargets ?? { protein: 60, carbs: 250, fats: 70 };
  const _dayFamilies = currentDayFamilies ?? new Set<string>();

  // Filter to slot-appropriate, preference-matching foods, excluding:
  // - same food ID used today
  // - same food FAMILY used today (e.g. two waakye dishes)
  // - foods used 3+ times this week
  // - foods eaten the previous day (hard-excluded first, relaxed below as fallback)
  let candidates = foods.filter(f =>
    !currentDayFoodIds.has(f.id) &&
    !previousDayFoodIds.has(f.id) &&
    !_dayFamilies.has(getFoodFamily(f)) &&
    (_weekFoodCounts.get(f.id) || 0) < 3 &&
    matchesSlotTags(f, slot) && matchesUserPrefs(f, prefs)
  );

  if (candidates.length === 0) {
    // Relax slot tags but keep previous-day + family + weekly exclusions
    candidates = foods.filter(f =>
      !currentDayFoodIds.has(f.id) &&
      !previousDayFoodIds.has(f.id) &&
      !_dayFamilies.has(getFoodFamily(f)) &&
      (_weekFoodCounts.get(f.id) || 0) < 3 &&
      matchesUserPrefs(f, prefs)
    );
  }

  if (candidates.length === 0) {
    // Allow previous-day repeats (penalised by score), keep family + weekly limits
    candidates = foods.filter(f =>
      !currentDayFoodIds.has(f.id) &&
      !_dayFamilies.has(getFoodFamily(f)) &&
      (_weekFoodCounts.get(f.id) || 0) < 3 &&
      matchesSlotTags(f, slot) && matchesUserPrefs(f, prefs)
    );
  }

  if (candidates.length === 0) {
    // Relax slot tags + allow previous-day repeats
    candidates = foods.filter(f =>
      !currentDayFoodIds.has(f.id) &&
      !_dayFamilies.has(getFoodFamily(f)) &&
      (_weekFoodCounts.get(f.id) || 0) < 3 &&
      matchesUserPrefs(f, prefs)
    );
  }

  if (candidates.length === 0) {
    // Last resort: allow family repeats but no exact same food today
    candidates = foods.filter(f => !currentDayFoodIds.has(f.id) && matchesUserPrefs(f, prefs));
  }

  if (candidates.length === 0) return null;

  // Score all candidates
  const scored = candidates.map(food => {
    const score = scoreFood(
      food,
      targetCalories,
      prefs,
      previousDayFoodIds,
      _weekFoodCounts,
      _dayMacros,
      _dailyMacroTargets,
    );
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

  // Weekly variety tracking
  const weekFoodCounts = new Map<string, number>();

  // Compute daily macro targets from targetCalories
  // Default macro split: 30% protein, 45% carbs, 25% fat
  const dailyMacroTargets: DayMacros = {
    protein: Math.round((targetCalories * 0.30) / 4), // 4 cal per g protein
    carbs: Math.round((targetCalories * 0.45) / 4),   // 4 cal per g carbs
    fats: Math.round((targetCalories * 0.25) / 9),     // 9 cal per g fat
  };

  for (let day = 0; day < 7; day++) {
    const currentDayFoodIds = new Set<string>();
    const currentDayFamilies = new Set<string>();
    const shuffledFoods = shuffleArray(foods);

    // Track running macros for the day
    const dayMacros: DayMacros = { protein: 0, carbs: 0, fats: 0 };

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
        currentDayFoodIds,
        weekFoodCounts,
        dayMacros,
        dailyMacroTargets,
        currentDayFamilies,
      );

      if (!food) continue;

      // Calculate servings to match target calories
      const servings = Math.max(0.5, Math.min(2.5,
        Math.round((slotCalories / food.calories_per_serving) * 10) / 10
      ));

      const actualCalories = Math.round(food.calories_per_serving * servings);
      const actualProtein = Math.round(food.protein_g * servings);
      const actualCarbs = Math.round(food.carbs_g * servings);
      const actualFats = Math.round(food.fats_g * servings);

      items.push({
        day_of_week: day,
        meal_slot: allocation.slot === 'snack' ? `snack_${++snackIndex}` : allocation.slot,
        food_id: food.id,
        food_name: food.name,
        servings,
        calories: actualCalories,
        protein_g: actualProtein,
        carbs_g: actualCarbs,
        fats_g: actualFats,
      });

      // Update running day macros
      dayMacros.protein += actualProtein;
      dayMacros.carbs += actualCarbs;
      dayMacros.fats += actualFats;

      // Update week food counts
      weekFoodCounts.set(food.id, (weekFoodCounts.get(food.id) || 0) + 1);

      currentDayFoodIds.add(food.id);
      currentDayFamilies.add(getFoodFamily(food));
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
