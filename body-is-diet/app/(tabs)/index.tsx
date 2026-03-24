import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useMealPlan } from '../../context/MealPlanContext';
import DailySummaryCard from '../../components/DailySummaryCard';
import MealCard from '../../components/MealCard';

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function Home() {
    const {
        weekPlan, todayPlan, isLoading, error,
        fetchPlan, generatePlan, swapMeal, completeMeal,
    } = useMealPlan();

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                    <Text style={styles.title}>Your Dashboard</Text>
                </View>

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
                        <Text style={styles.emptyIcon}>🥗</Text>
                        <Text style={styles.emptyTitle}>No Meal Plan Yet</Text>
                        <Text style={styles.emptyText}>
                            Generate your personalized AI meal plan based on your goals and preferences.
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

                {weekPlan && todayPlan && (
                    <>
                        <DailySummaryCard
                            dayPlan={todayPlan}
                            targetCalories={weekPlan.target_calories}
                            macroTargets={weekPlan.macro_targets}
                        />

                        <Text style={styles.sectionTitle}>Today's Meals</Text>

                        {todayPlan.meals.length === 0 ? (
                            <Text style={styles.noMeals}>No meals planned for today.</Text>
                        ) : (
                            todayPlan.meals.map(item => (
                                <MealCard
                                    key={item.id}
                                    item={item}
                                    onSwap={() => swapMeal(item.id)}
                                    onComplete={() => completeMeal(item.id)}
                                />
                            ))
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    scroll: { padding: 24, paddingBottom: 120 },
    header: { marginBottom: 24 },
    greeting: { fontSize: 15, color: '#666', marginBottom: 4 },
    title: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
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
        marginTop: 20,
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
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 16, marginTop: 8 },
    noMeals: { color: '#555', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});
