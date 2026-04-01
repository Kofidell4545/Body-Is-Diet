import { calculateTDEE, TDEEInput } from '../utils/tdee';

describe('calculateTDEE', () => {
    const baseMale: TDEEInput = {
        age: 25,
        gender: 'male',
        height_cm: 175,
        weight_kg: 70,
        activity_level: 'moderate',
        goal: 'maintain',
    };

    const baseFemale: TDEEInput = {
        age: 25,
        gender: 'female',
        height_cm: 165,
        weight_kg: 60,
        activity_level: 'moderate',
        goal: 'maintain',
    };

    it('returns correct BMR for male using Mifflin-St Jeor', () => {
        const result = calculateTDEE(baseMale);
        // 10 * 70 + 6.25 * 175 - 5 * 25 + 5 = 1674
        expect(result.bmr).toBe(1674);
    });

    it('returns correct BMR for female using Mifflin-St Jeor', () => {
        const result = calculateTDEE(baseFemale);
        // 10 * 60 + 6.25 * 165 - 5 * 25 - 161 = 1345
        expect(result.bmr).toBe(1345);
    });

    it('applies activity multiplier correctly', () => {
        const sedentary = calculateTDEE({ ...baseMale, activity_level: 'sedentary' });
        const athlete = calculateTDEE({ ...baseMale, activity_level: 'athlete' });
        expect(athlete.tdee).toBeGreaterThan(sedentary.tdee);
    });

    it('applies goal modifier for weight loss (20% deficit)', () => {
        const maintain = calculateTDEE({ ...baseMale, goal: 'maintain' });
        const lose = calculateTDEE({ ...baseMale, goal: 'lose_weight' });
        expect(lose.targetCalories).toBe(Math.round(maintain.tdee * 0.80));
    });

    it('applies goal modifier for muscle gain (10% surplus)', () => {
        const maintain = calculateTDEE({ ...baseMale, goal: 'maintain' });
        const gain = calculateTDEE({ ...baseMale, goal: 'gain_muscle' });
        expect(gain.targetCalories).toBe(Math.round(maintain.tdee * 1.10));
    });

    it('returns macro split that sums to approximately target calories', () => {
        const result = calculateTDEE(baseMale);
        const { proteinG, carbsG, fatsG } = result.macroSplit;
        const totalCals = (proteinG * 4) + (carbsG * 4) + (fatsG * 9);
        // Allow ~5% tolerance for rounding
        expect(totalCals).toBeGreaterThan(result.targetCalories * 0.95);
        expect(totalCals).toBeLessThan(result.targetCalories * 1.05);
    });

    it('returns positive values for all fields', () => {
        const result = calculateTDEE(baseMale);
        expect(result.bmr).toBeGreaterThan(0);
        expect(result.tdee).toBeGreaterThan(0);
        expect(result.targetCalories).toBeGreaterThan(0);
        expect(result.macroSplit.proteinG).toBeGreaterThan(0);
        expect(result.macroSplit.carbsG).toBeGreaterThan(0);
        expect(result.macroSplit.fatsG).toBeGreaterThan(0);
    });

    it('higher protein ratio for muscle gain goal', () => {
        const maintain = calculateTDEE({ ...baseMale, goal: 'maintain' });
        const muscle = calculateTDEE({ ...baseMale, goal: 'gain_muscle' });
        // gain_muscle has 35% protein vs maintain 30% — protein ratio should be higher
        const maintainProteinRatio = (maintain.macroSplit.proteinG * 4) / maintain.targetCalories;
        const muscleProteinRatio = (muscle.macroSplit.proteinG * 4) / muscle.targetCalories;
        expect(muscleProteinRatio).toBeGreaterThanOrEqual(maintainProteinRatio);
    });
});
