import { analyseProgress, checkGoalRealism, WeightLog } from '../utils/adaptive-calories';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeLog(weight_kg: number, daysAgo: number): WeightLog {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return { weight_kg, logged_at: d.toISOString() };
}

// ─── Goal Realism Tests ───────────────────────────────────────────────────────
describe('checkGoalRealism', () => {
    it('flags 10kg gain in 3 weeks as unrealistic', () => {
        const result = checkGoalRealism(70, 80, 'gain_muscle', 3);
        expect(result.is_realistic).toBe(false);
        expect(result.realistic_weeks).toBeGreaterThan(3);
        expect(result.message).toContain('realistic');
    });

    it('accepts 2kg loss in 4 weeks as realistic', () => {
        const result = checkGoalRealism(80, 78, 'lose_weight', 4);
        expect(result.is_realistic).toBe(true);
    });

    it('flags 5kg weight loss in 2 weeks as unrealistic', () => {
        const result = checkGoalRealism(80, 75, 'lose_weight', 2);
        expect(result.is_realistic).toBe(false);
    });

    it('accepts 3kg muscle gain in 12 weeks as realistic', () => {
        const result = checkGoalRealism(70, 73, 'gain_muscle', 12);
        expect(result.is_realistic).toBe(true);
    });

    it('returns correct requested_change_kg', () => {
        const result = checkGoalRealism(70, 80, 'gain_weight', 10);
        expect(result.requested_change_kg).toBe(10);
    });

    it('returns negative change for weight loss goal', () => {
        const result = checkGoalRealism(80, 70, 'lose_weight', 12);
        expect(result.requested_change_kg).toBe(-10);
    });
});

// ─── Progress Analysis Tests ──────────────────────────────────────────────────
describe('analyseProgress', () => {
    it('returns not_enough_data with fewer than 2 logs', () => {
        const result = analyseProgress([], 'gain_muscle', 'male', 2500);
        expect(result.status).toBe('not_enough_data');
        expect(result.recommended_adjustment_kcal).toBe(0);
    });

    it('returns not_enough_data with 1 log', () => {
        const result = analyseProgress([makeLog(75, 0)], 'gain_muscle', 'male', 2500);
        expect(result.status).toBe('not_enough_data');
    });

    // ── Gain muscle: on track ──────────────────────────────────────────────────
    it('gain_muscle: marks as on_track when gaining ~0.3kg/week', () => {
        const logs = [
            makeLog(70.0, 21),
            makeLog(70.3, 14),
            makeLog(70.6, 7),
            makeLog(70.9, 0),
        ];
        const result = analyseProgress(logs, 'gain_muscle', 'male', 2500);
        expect(result.status).toBe('on_track');
        expect(result.recommended_adjustment_kcal).toBe(0);
        expect(result.on_track).toBe(true);
    });

    // ── Gain muscle: too slow ──────────────────────────────────────────────────
    it('gain_muscle: increases calories when gaining too slowly', () => {
        const logs = [
            makeLog(70.0, 28),
            makeLog(70.0, 21),
            makeLog(70.1, 14),
            makeLog(70.1, 0),
        ];
        const result = analyseProgress(logs, 'gain_muscle', 'male', 2500);
        expect(['too_slow', 'wrong_direction']).toContain(result.status);
        expect(result.recommended_adjustment_kcal).toBeGreaterThan(0);
        expect(result.new_target_calories).toBeGreaterThan(2500);
    });

    // ── Gain muscle: too fast (fat gain) ──────────────────────────────────────
    it('gain_muscle: reduces calories when gaining too fast', () => {
        const logs = [
            makeLog(70.0, 21),
            makeLog(71.5, 14),
            makeLog(73.0, 7),
            makeLog(74.5, 0),
        ];
        const result = analyseProgress(logs, 'gain_muscle', 'male', 2500);
        expect(result.status).toBe('too_fast');
        expect(result.recommended_adjustment_kcal).toBeLessThan(0);
        expect(result.new_target_calories).toBeLessThan(2500);
    });

    // ── Lose weight: on track ─────────────────────────────────────────────────
    it('lose_weight: marks as on_track when losing ~0.5kg/week', () => {
        const logs = [
            makeLog(80.0, 21),
            makeLog(79.5, 14),
            makeLog(79.0, 7),
            makeLog(78.5, 0),
        ];
        const result = analyseProgress(logs, 'lose_weight', 'male', 1800);
        expect(result.status).toBe('on_track');
        expect(result.recommended_adjustment_kcal).toBe(0);
    });

    // ── Lose weight: not losing ────────────────────────────────────────────────
    it('lose_weight: reduces calories when not losing', () => {
        const logs = [
            makeLog(80.0, 28),
            makeLog(80.1, 21),
            makeLog(80.0, 14),
            makeLog(80.2, 0),
        ];
        const result = analyseProgress(logs, 'lose_weight', 'male', 1800);
        expect(['too_slow', 'wrong_direction']).toContain(result.status);
        expect(result.recommended_adjustment_kcal).toBeLessThan(0);
    });

    // ── Lose weight: too fast ─────────────────────────────────────────────────
    it('lose_weight: adds calories when losing too fast', () => {
        const logs = [
            makeLog(80.0, 21),
            makeLog(78.0, 14),
            makeLog(76.0, 7),
            makeLog(74.0, 0),
        ];
        const result = analyseProgress(logs, 'lose_weight', 'male', 1800);
        expect(result.status).toBe('too_fast');
        expect(result.recommended_adjustment_kcal).toBeGreaterThan(0);
    });

    // ── Maintain: on track ────────────────────────────────────────────────────
    it('maintain: marks as on_track when weight is stable', () => {
        const logs = [
            makeLog(75.0, 21),
            makeLog(74.9, 14),
            makeLog(75.1, 7),
            makeLog(75.0, 0),
        ];
        const result = analyseProgress(logs, 'maintain', 'male', 2200);
        expect(result.status).toBe('on_track');
        expect(result.recommended_adjustment_kcal).toBe(0);
    });

    // ── Safety: minimum calories floor ────────────────────────────────────────
    it('never drops below minimum safe calories (female: 1200 kcal)', () => {
        const logs = [
            makeLog(60.0, 28),
            makeLog(60.2, 0),
        ];
        const result = analyseProgress(logs, 'lose_weight', 'female', 1250);
        expect(result.new_target_calories).toBeGreaterThanOrEqual(1200);
    });

    it('never drops below minimum safe calories (male: 1500 kcal)', () => {
        const logs = [
            makeLog(80.0, 28),
            makeLog(80.5, 0),
        ];
        const result = analyseProgress(logs, 'lose_weight', 'male', 1550);
        expect(result.new_target_calories).toBeGreaterThanOrEqual(1500);
    });

    // ── Max adjustment cap ────────────────────────────────────────────────────
    it('caps adjustment at ±300 kcal per week', () => {
        // Extreme case: gaining way too fast
        const logs = [
            makeLog(70.0, 7),
            makeLog(80.0, 0), // +10kg in 1 week (impossible IRL but tests the cap)
        ];
        const result = analyseProgress(logs, 'gain_muscle', 'male', 2500);
        expect(Math.abs(result.recommended_adjustment_kcal)).toBeLessThanOrEqual(300);
    });

    // ── Return fields completeness ─────────────────────────────────────────────
    it('returns all required fields', () => {
        const logs = [makeLog(75, 14), makeLog(75.3, 0)];
        const result = analyseProgress(logs, 'gain_muscle', 'male', 2500);
        expect(result).toHaveProperty('weeks_tracked');
        expect(result).toHaveProperty('current_weight_kg');
        expect(result).toHaveProperty('start_weight_kg');
        expect(result).toHaveProperty('total_change_kg');
        expect(result).toHaveProperty('weekly_rate_kg');
        expect(result).toHaveProperty('expected_rate_kg');
        expect(result).toHaveProperty('on_track');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('status_message');
        expect(result).toHaveProperty('recommended_adjustment_kcal');
        expect(result).toHaveProperty('current_target_calories');
        expect(result).toHaveProperty('new_target_calories');
    });
});
