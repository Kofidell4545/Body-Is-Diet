import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useMealPlan } from '../../context/MealPlanContext';
import DayTabBar from '../../components/DayTabBar';
import DailySummaryCard from '../../components/DailySummaryCard';
import MealCard from '../../components/MealCard';

export default function Meals() {
    const {
        weekPlan, selectedDay, setSelectedDay, selectedDayPlan,
        isLoading, error, fetchPlan, generatePlan, swapMeal, completeMeal,
    } = useMealPlan();

    useEffect(() => {
        if (!weekPlan) fetchPlan();
    }, [weekPlan, fetchPlan]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Meal Plan</Text>

                {isLoading && !weekPlan && (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator color="#00E676" size="large" />
                        <Text style={styles.loadingText}>Loading your plan...</Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {!isLoading && !weekPlan && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyTitle}>No Plan This Week</Text>
                        <Text style={styles.emptyText}>
                            Generate a weekly meal plan tailored to your Ghanaian food preferences.
                        </Text>
                        <TouchableOpacity
                            style={styles.generateBtn}
                            onPress={() => generatePlan()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.generateBtnText}>Generate Meal Plan</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {weekPlan && selectedDayPlan && (
                    <>
                        <DayTabBar
                            selectedDay={selectedDay}
                            onSelectDay={setSelectedDay}
                        />

                        <DailySummaryCard
                            dayPlan={selectedDayPlan}
                            targetCalories={weekPlan.target_calories}
                            macroTargets={weekPlan.macro_targets}
                        />

                        <Text style={styles.sectionTitle}>Meals</Text>

                        {selectedDayPlan.meals.length === 0 ? (
                            <Text style={styles.noMeals}>No meals planned for this day.</Text>
                        ) : (
                            selectedDayPlan.meals.map(item => (
                                <MealCard
                                    key={item.id}
                                    item={item}
                                    onSwap={() => swapMeal(item.id)}
                                    onComplete={() => completeMeal(item.id)}
                                />
                            ))
                        )}

                        <TouchableOpacity
                            style={styles.regenBtn}
                            onPress={() => generatePlan()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.regenBtnText}>Regenerate This Week</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    scroll: { padding: 24, paddingBottom: 120 },
    title: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5, marginBottom: 8 },
    loadingWrap: { alignItems: 'center', paddingVertical: 60 },
    loadingText: { color: '#555', marginTop: 12, fontSize: 14 },
    errorCard: {
        backgroundColor: 'rgba(255,82,82,0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,82,82,0.2)',
    },
    errorText: { color: '#FF5252', fontSize: 14, textAlign: 'center' },
    emptyState: {
        backgroundColor: '#0F0F0F',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1A1A1A',
        borderStyle: 'dashed',
        marginTop: 40,
    },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 8 },
    emptyText: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    generateBtn: {
        backgroundColor: '#00E676',
        borderRadius: 14,
        paddingHorizontal: 28,
        paddingVertical: 14,
    },
    generateBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 16 },
    noMeals: { color: '#555', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
    regenBtn: {
        backgroundColor: '#111',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#1C1C1C',
    },
    regenBtnText: { color: '#888', fontSize: 14, fontWeight: '600' },
});
