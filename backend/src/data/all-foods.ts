/**
 * Unified Food Database — Merges curated Ghanaian foods with FAO WAFCT 2019 data.
 *
 * Priority: Hand-curated foods take precedence (better names, tags, pairings).
 * FAO foods fill the gaps with 700+ additional West African ingredients and dishes.
 *
 * Total pool: ~850 unique foods (85 curated + ~765 FAO)
 */

import { GHANAIAN_FOODS, FoodItem } from './ghanaian-foods';
import { WAFCT_FOODS } from './wafct-foods';

// Build a set of food families already covered by curated foods
const curatedFamilies = new Set<string>();
const curatedNames = new Set<string>();

for (const food of GHANAIAN_FOODS) {
  curatedNames.add(food.name.toLowerCase());
  if ((food as any).food_family) {
    curatedFamilies.add((food as any).food_family);
  }
}

// Filter FAO foods to avoid duplicating what we already have
const filteredWAFCT = WAFCT_FOODS.filter((food: FoodItem) => {
  const lower = food.name.toLowerCase();

  // Skip if exact name match exists in curated
  if (curatedNames.has(lower)) return false;

  // Skip if it's a very similar name (fuzzy match)
  for (const curated of curatedNames) {
    // If either name contains the other, likely duplicate
    if (curated.length > 5 && lower.includes(curated)) return false;
    if (lower.length > 5 && curated.includes(lower)) return false;
  }

  return true;
});

/**
 * ALL_FOODS — The complete food database.
 * Curated Ghanaian foods first (priority), then FAO WAFCT foods.
 */
export const ALL_FOODS: FoodItem[] = [
  ...GHANAIAN_FOODS,
  ...filteredWAFCT,
];

// Export counts for logging
export const FOOD_DB_STATS = {
  curated: GHANAIAN_FOODS.length,
  fao: filteredWAFCT.length,
  total: GHANAIAN_FOODS.length + filteredWAFCT.length,
};
