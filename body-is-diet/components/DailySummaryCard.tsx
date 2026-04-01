import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import CalorieRing from './CalorieRing';
import MacroBar from './MacroBar';
import { DayPlan, MacroTargets } from '../types';

interface DailySummaryCardProps {
    dayPlan: DayPlan;
    targetCalories: number;
    macroTargets: MacroTargets;
}

export default function DailySummaryCard({ dayPlan, targetCalories, macroTargets }: DailySummaryCardProps) {
    const pct = targetCalories > 0
        ? Math.round((dayPlan.completedCalories / targetCalories) * 100)
        : 0;

    return (
        <View style={styles.wrapper}>
            {/* Glass shell */}
            <BlurView intensity={28} tint="dark" style={styles.blur}>
                {/* Top specular shine */}
                <View style={styles.topShine} />

                {/* Side specular edge */}
                <View style={styles.leftEdge} />

                <View style={styles.content}>
                    {/* Left — calorie ring */}
                    <View style={styles.ringWrap}>
                        <CalorieRing
                            consumed={dayPlan.completedCalories}
                            target={targetCalories}
                            size={118}
                        />
                    </View>

                    {/* Right — macros + progress label */}
                    <View style={styles.right}>
                        <View style={styles.progressRow}>
                            <Text style={styles.progressLabel}>Today</Text>
                            <View style={[
                                styles.progressBadge,
                                pct >= 80 && styles.progressBadgeGood,
                            ]}>
                                <Text style={[
                                    styles.progressBadgeText,
                                    pct >= 80 && styles.progressBadgeTextGood,
                                ]}>
                                    {pct}%
                                </Text>
                            </View>
                        </View>
                        <MacroBar
                            protein={dayPlan.totalProtein}
                            carbs={dayPlan.totalCarbs}
                            fats={dayPlan.totalFats}
                            proteinTarget={macroTargets.proteinG}
                            carbsTarget={macroTargets.carbsG}
                            fatsTarget={macroTargets.fatsG}
                        />
                        <Text style={styles.calsLabel}>
                            {dayPlan.completedCalories}
                            <Text style={styles.calsTarget}> / {targetCalories} kcal</Text>
                        </Text>
                    </View>
                </View>

                {/* Bottom inset glow line */}
                <View style={styles.bottomGlow} />
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        // Outer shadow for depth
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 12,
    },
    blur: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(16,16,16,0.72)',
    },

    // Specular highlights that give the glass its liquid feel
    topShine: {
        position: 'absolute',
        top: 0,
        left: 28,
        right: 28,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.28)',
        zIndex: 2,
    },
    leftEdge: {
        position: 'absolute',
        top: 12,
        bottom: 12,
        left: 0,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        zIndex: 2,
    },
    bottomGlow: {
        position: 'absolute',
        bottom: 0,
        left: 40,
        right: 40,
        height: 1,
        backgroundColor: 'rgba(0,230,118,0.12)',
        zIndex: 2,
    },

    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
        padding: 20,
    },
    ringWrap: {
        // subtle inset shadow around ring
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
    },
    right: { flex: 1, gap: 10 },

    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    progressLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.8, textTransform: 'uppercase' },
    progressBadge: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },
    progressBadgeGood: {
        backgroundColor: 'rgba(0,230,118,0.12)',
        borderColor: 'rgba(0,230,118,0.25)',
    },
    progressBadgeText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)' },
    progressBadgeTextGood: { color: '#00E676' },

    calsLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#00E676',
        marginTop: 2,
    },
    calsTarget: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.28)',
    },
});
