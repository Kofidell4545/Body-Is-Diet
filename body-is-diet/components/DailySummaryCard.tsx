import { View, StyleSheet } from 'react-native';
import CalorieRing from './CalorieRing';
import MacroBar from './MacroBar';
import { DayPlan, MacroTargets } from '../types';

interface DailySummaryCardProps {
    dayPlan: DayPlan;
    targetCalories: number;
    macroTargets: MacroTargets;
}

export default function DailySummaryCard({ dayPlan, targetCalories, macroTargets }: DailySummaryCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.content}>
                <CalorieRing
                    consumed={dayPlan.completedCalories}
                    target={targetCalories}
                    size={120}
                />
                <View style={styles.macros}>
                    <MacroBar
                        protein={dayPlan.totalProtein}
                        carbs={dayPlan.totalCarbs}
                        fats={dayPlan.totalFats}
                        proteinTarget={macroTargets.proteinG}
                        carbsTarget={macroTargets.carbsG}
                        fatsTarget={macroTargets.fatsG}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#1C1C1C',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    macros: {
        flex: 1,
    },
});
