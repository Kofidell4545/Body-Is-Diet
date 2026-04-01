/**
 * FAO/INFOODS WAFCT 2019 → Body is Diet Food Database Converter
 *
 * Parses the official West African Food Composition Table (1,028 foods)
 * and converts prepared/cooked foods into our FoodItem format.
 *
 * Data source: https://www.fao.org/infoods/infoods/tables-and-databases/africa/en/
 * Citation: Vincent A, Grande F, Compaore E, et al. FAO/INFOODS Food Composition
 *           Table for Western Africa (2019). Rome, FAO.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

interface FAOFood {
  code: string;
  name_en: string;
  name_fr: string;
  scientific_name: string;
  energy_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  calcium_mg: number;
  iron_mg: number;
  magnesium_mg: number;
  phosphorus_mg: number;
  potassium_mg: number;
  sodium_mg: number;
  zinc_mg: number;
  vitamin_a_mcg: number;
  vitamin_c_mg: number;
  vitamin_b1_mg: number;
  vitamin_b2_mg: number;
  vitamin_b6_mg: number;
  folate_mcg: number;
  vitamin_b12_mcg: number;
  cholesterol_mg: number;
}

interface FoodItem {
  id: string;
  name: string;
  name_local?: string;
  category: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  serving_g: number;
  tags: string[];
  glycemic_index?: number;
  prep_method?: string;
  region?: string[];
  cost_tier?: string;
  pairs_with?: string[];
  food_family?: string;
  fao_code?: string;
  // Micronutrients
  calcium_mg?: number;
  iron_mg?: number;
  zinc_mg?: number;
  vitamin_a_mcg?: number;
  vitamin_c_mg?: number;
  folate_mcg?: number;
}

// Clean numeric value — handle brackets [x] which mean estimated values
function cleanNum(val: any): number {
  if (val === null || val === undefined || val === '' || val === '-') return 0;
  if (typeof val === 'number') return Math.round(val * 10) / 10;
  const str = String(val).replace(/[\[\]]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * 10) / 10;
}

// Determine food category from FAO food code prefix
function getCategory(code: string, name: string): string {
  const prefix = code.split('_')[0];
  const lower = name.toLowerCase();

  // Check for snacks/street food
  if (lower.includes('kelewele') || lower.includes('chin chin') || lower.includes('cake') ||
      lower.includes('biscuit') || lower.includes('doughnut') || lower.includes('puff puff') ||
      lower.includes('bofrot') || lower.includes('spring roll') || lower.includes('meat pie') ||
      lower.includes('samosa') || lower.includes('popcorn') || lower.includes('roasted corn') ||
      lower.includes('tatale') || lower.includes('kaklo')) {
    return 'snack';
  }

  // Check for beverages
  if (prefix === '12' || lower.includes('beer') || lower.includes('wine') || lower.includes('juice') ||
      lower.includes('tea') || lower.includes('coffee') || lower.includes('drink') ||
      lower.includes('sobolo') || lower.includes('asaana') || lower.includes('brukina')) {
    return 'beverage';
  }

  // Check for composite/full meals (soups, sauces with protein+carb combos)
  if (prefix === '14') return 'full_meal';

  // Map FAO food groups to our categories
  switch (prefix) {
    case '01': return 'carb';          // Cereals
    case '02': return 'carb';          // Starchy roots/tubers
    case '03': return 'protein';       // Legumes
    case '04': return 'vegetable';     // Vegetables
    case '05': return 'fruit';         // Fruits
    case '06': return 'protein';       // Nuts/seeds
    case '07': return 'protein';       // Meat/poultry
    case '08': return 'protein';       // Eggs
    case '09': return 'protein';       // Fish
    case '10': return 'dairy';         // Milk
    case '11': return 'fat';           // Fats/oils
    case '13': return 'spice';         // Spices
    default: return 'other';
  }
}

// Determine meal slot tags
function getMealTags(name: string, category: string, calories: number): string[] {
  const lower = name.toLowerCase();
  const tags: string[] = [];

  // Category-based tags
  tags.push(category);

  // Prep method
  if (lower.includes('boiled')) tags.push('boiled');
  if (lower.includes('fried') || lower.includes('deep fried')) tags.push('fried');
  if (lower.includes('grilled')) tags.push('grilled');
  if (lower.includes('stewed') || lower.includes('stew')) tags.push('stewed');
  if (lower.includes('steamed')) tags.push('steamed');
  if (lower.includes('roasted')) tags.push('roasted');
  if (lower.includes('smoked')) tags.push('smoked');
  if (lower.includes('dried')) tags.push('dried');
  if (lower.includes('fermented')) tags.push('fermented');
  if (lower.includes('raw')) tags.push('raw');

  // Meal slot assignment
  if (category === 'snack' || category === 'fruit') {
    tags.push('snack');
  } else if (category === 'beverage') {
    tags.push('snack', 'breakfast');
  } else if (lower.includes('porridge') || lower.includes('hausa koko') ||
             lower.includes('oats') || lower.includes('tom brown') ||
             lower.includes('akasa') || lower.includes('koko')) {
    tags.push('breakfast');
  } else if (category === 'full_meal' || category === 'soup' || category === 'stew') {
    tags.push('lunch', 'dinner');
  } else if (category === 'protein') {
    tags.push('lunch', 'dinner');
  } else if (category === 'carb') {
    tags.push('breakfast', 'lunch', 'dinner');
  } else if (category === 'vegetable') {
    tags.push('lunch', 'dinner');
  }

  // Ingredient tags
  if (lower.includes('rice')) tags.push('rice');
  if (lower.includes('maize') || lower.includes('corn')) tags.push('maize');
  if (lower.includes('cassava')) tags.push('cassava');
  if (lower.includes('yam')) tags.push('yam');
  if (lower.includes('plantain')) tags.push('plantain');
  if (lower.includes('millet')) tags.push('millet');
  if (lower.includes('sorghum')) tags.push('sorghum');
  if (lower.includes('fish') || lower.includes('tilapia') || lower.includes('carp') ||
      lower.includes('catfish') || lower.includes('mackerel')) tags.push('fish');
  if (lower.includes('chicken') || lower.includes('poultry')) tags.push('chicken');
  if (lower.includes('beef') || lower.includes('cattle')) tags.push('beef');
  if (lower.includes('goat') || lower.includes('mutton')) tags.push('goat');
  if (lower.includes('egg')) tags.push('eggs');
  if (lower.includes('bean') || lower.includes('cowpea') || lower.includes('lentil')) tags.push('beans');
  if (lower.includes('groundnut') || lower.includes('peanut')) tags.push('peanut');
  if (lower.includes('palm')) tags.push('palm');
  if (lower.includes('tomato')) tags.push('tomato');
  if (lower.includes('okra')) tags.push('okra');
  if (lower.includes('spinach') || lower.includes('amaranth') || lower.includes('kontomire')) tags.push('leafy_green');

  return [...new Set(tags)]; // Deduplicate
}

// Get prep method from food name
function getPrepMethod(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (lower.includes('deep fried') || lower.includes('deep-fried')) return 'deep_fried';
  if (lower.includes('fried')) return 'fried';
  if (lower.includes('grilled')) return 'grilled';
  if (lower.includes('boiled')) return 'boiled';
  if (lower.includes('steamed')) return 'steamed';
  if (lower.includes('stewed')) return 'stewed';
  if (lower.includes('roasted')) return 'roasted';
  if (lower.includes('smoked')) return 'smoked';
  if (lower.includes('baked')) return 'baked';
  if (lower.includes('raw')) return 'raw';
  return undefined;
}

// Get food family (for dedup)
function getFoodFamily(name: string, category: string): string {
  const lower = name.toLowerCase();

  // Carb families
  if (lower.includes('rice') && !lower.includes('rice water')) return 'rice';
  if (lower.includes('maize') || lower.includes('corn')) return 'maize';
  if (lower.includes('cassava')) return 'cassava';
  if (lower.includes('yam')) return 'yam';
  if (lower.includes('plantain')) return 'plantain';
  if (lower.includes('millet')) return 'millet';
  if (lower.includes('sorghum')) return 'sorghum';
  if (lower.includes('wheat') || lower.includes('bread')) return 'wheat';
  if (lower.includes('fonio')) return 'fonio';
  if (lower.includes('teff')) return 'teff';

  // Protein families
  if (lower.includes('tilapia')) return 'tilapia';
  if (lower.includes('catfish')) return 'catfish';
  if (lower.includes('mackerel')) return 'mackerel';
  if (lower.includes('carp')) return 'carp';
  if (lower.includes('chicken')) return 'chicken';
  if (lower.includes('beef') || lower.includes('cattle')) return 'beef';
  if (lower.includes('goat')) return 'goat';
  if (lower.includes('guinea fowl')) return 'guinea_fowl';
  if (lower.includes('egg')) return 'egg';
  if (lower.includes('cowpea') || lower.includes('black-eyed')) return 'cowpea';
  if (lower.includes('groundnut') || lower.includes('peanut')) return 'groundnut';
  if (lower.includes('soya') || lower.includes('soy')) return 'soybean';
  if (lower.includes('bambara')) return 'bambara';

  return category;
}

// Generate a clean ID from food name
function generateId(code: string, name: string, category: string): string {
  // Use FAO code prefix + cleaned name
  const prefix = category.slice(0, 3);
  const cleanName = name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')           // Remove parentheticals
    .replace(/[^a-z0-9\s]/g, '')       // Remove special chars
    .trim()
    .split(/\s+/)
    .slice(0, 4)                        // First 4 words
    .join('-');
  return `fao-${prefix}-${cleanName}`;
}

// Simplify verbose FAO names into cleaner display names
function simplifyName(name: string): string {
  return name
    .replace(/\s*\(.*?Burkina Faso.*?\)\*?:?\s*/g, ' ')
    .replace(/\s*\(.*?Ghana.*?\).*$/g, '')
    .replace(/\s*\(.*?Nigeria.*?\).*$/g, '')
    .replace(/\s*\(.*?Benin.*?\).*$/g, '')
    .replace(/\s*\(.*?without salt.*?\)/g, '')
    .replace(/\s*\(.*?without salt or fat.*?\)/g, '')
    .replace(/,\s*n=\d+/g, '')
    .replace(/\*$/, '')
    .replace(/\*:/, ':')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// MAIN PARSER
// ============================================================
function parseWAFCT() {
  const xlsxPath = path.join(__dirname, '..', 'data', 'WAFCT_2019.xlsx');

  if (!fs.existsSync(xlsxPath)) {
    console.error('WAFCT_2019.xlsx not found at', xlsxPath);
    process.exit(1);
  }

  console.log('Reading WAFCT 2019...');
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets['03 NV_sum_39 (per 100g EP)'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  console.log(`Total rows: ${data.length}`);

  const foods: FoodItem[] = [];
  const skipped: string[] = [];
  const seenIds = new Set<string>();

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row || !row[0] || !row[1]) continue;

    const code = String(row[0]);
    const name = String(row[1]);

    // Skip section headers (they don't have energy values)
    if (!code.includes('_')) continue;

    const kcal = cleanNum(row[7]);
    const protein = cleanNum(row[9]);
    const fat = cleanNum(row[10]);
    const carbs = cleanNum(row[11]);

    // Skip foods with no calorie data
    if (kcal <= 0) {
      skipped.push(`No kcal: ${name}`);
      continue;
    }

    // Skip raw ingredients that aren't typically eaten alone
    // (keep raw fruits, nuts, raw vegetables that are eaten as-is)
    const lower = name.toLowerCase();
    const prefix = code.split('_')[0];
    const isRaw = lower.includes(', raw') || lower.includes(', dry, raw');
    const isEdibleRaw = prefix === '05' || prefix === '06' || prefix === '04' || prefix === '12';

    if (isRaw && !isEdibleRaw) {
      // Still include some important raw staples
      if (!lower.includes('gari') && !lower.includes('flour') && !lower.includes('sugar')) {
        skipped.push(`Raw: ${name}`);
        continue;
      }
    }

    // Skip very niche scientific varieties
    if (lower.includes('variety') && lower.includes('n=1')) {
      skipped.push(`Single variety: ${name}`);
      continue;
    }

    const category = getCategory(code, name);

    // Skip fats/oils and spices (not standalone meals)
    if (category === 'fat' || category === 'spice' || category === 'dairy') {
      skipped.push(`Category skip (${category}): ${name}`);
      continue;
    }

    const simpleName = simplifyName(name);
    let id = generateId(code, simpleName, category);

    // Ensure unique IDs
    if (seenIds.has(id)) {
      id = id + '-' + code.replace('_', '');
    }
    seenIds.add(id);

    const food: any = {
      id,
      name: simpleName,
      category,
      calories_per_serving: Math.round(kcal),
      protein_g: protein,
      carbs_g: carbs,
      fats_g: fat,
      serving_size: '100g',
      serving_weight_g: 100,
      tags: getMealTags(name, category, kcal),
      image_url: null,
      prep_method: getPrepMethod(name),
      food_family: getFoodFamily(name, category),
      fao_code: code,
      fiber_g: cleanNum(row[12]),
      calcium_mg: cleanNum(row[14]),
      iron_mg: cleanNum(row[15]),
      zinc_mg: cleanNum(row[20]),
      vitamin_a_mcg: cleanNum(row[22]),
      vitamin_c_mg: cleanNum(row[37]),
      folate_mcg: cleanNum(row[34]),
    };

    foods.push(food);
  }

  console.log(`\nParsed: ${foods.length} usable foods`);
  console.log(`Skipped: ${skipped.length} foods`);

  // Category breakdown
  const categories: Record<string, number> = {};
  for (const f of foods) {
    categories[f.category] = (categories[f.category] || 0) + 1;
  }
  console.log('\nBy category:');
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  // Write output
  const outputPath = path.join(__dirname, '..', 'data', 'wafct-foods.json');
  fs.writeFileSync(outputPath, JSON.stringify(foods, null, 2));
  console.log(`\nWritten to ${outputPath}`);

  // Also generate a TypeScript export
  const tsPath = path.join(__dirname, '..', 'data', 'wafct-foods.ts');
  const tsContent = `/**
 * FAO/INFOODS West African Food Composition Table (2019)
 *
 * ${foods.length} foods parsed from the official WAFCT 2019 database.
 * All nutrition values are per 100g of edible portion.
 *
 * Source: https://www.fao.org/infoods/infoods/tables-and-databases/africa/en/
 * Citation: Vincent A, Grande F, Compaore E, et al. FAO/INFOODS Food Composition
 *           Table for Western Africa (2019). Rome, FAO.
 * License: CC BY-NC-SA 3.0 IGO
 */

import { FoodItem } from './ghanaian-foods';

export const WAFCT_FOODS: FoodItem[] = ${JSON.stringify(foods, null, 2)};
`;
  fs.writeFileSync(tsPath, tsContent);
  console.log(`Written TypeScript to ${tsPath}`);

  // Print skip reasons summary
  const skipReasons: Record<string, number> = {};
  for (const s of skipped) {
    const reason = s.split(':')[0];
    skipReasons[reason] = (skipReasons[reason] || 0) + 1;
  }
  console.log('\nSkip reasons:');
  for (const [reason, count] of Object.entries(skipReasons).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason}: ${count}`);
  }
}

parseWAFCT();
