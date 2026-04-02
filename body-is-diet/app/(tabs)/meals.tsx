import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
                        <Ionicons name="alert-circle-outline" size={16} color="#FF5252" style={{ marginRight: 8 }} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {!isLoading && !weekPlan && (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons name="calendar-outline" size={40} color="#00E676" />
                        </View>
                        <Text style={styles.emptyTitle}>No Plan This Week</Text>
                        <Text style={styles.emptyText}>
                            Build a weekly menu tailored to your Ghanaian food preferences and goals.
                        </Text>
                        <TouchableOpacity
                            style={styles.generateBtn}
                            onPress={() => generatePlan()}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="nutrition-outline" size={18} color="#000" style={{ marginRight: 8 }} />
                            <Text style={styles.generateBtnText}>Build My Plan</Text>
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
                            <Ionicons name="refresh-outline" size={16} color="#555" style={{ marginRight: 8 }} />
                            <Text style={styles.regenBtnText}>Rebuild This Week</Text>
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
    title: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5, marginBottom: 20 },

    loadingWrap: { alignItems: 'center', paddingVertical: 60 },
    loadingText: { color: '#555', marginTop: 12, fontSize: 14 },

    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,82,82,0.08)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,82,82,0.18)',
    },
    errorText: { color: '#FF5252', fontSize: 14, flex: 1 },

    emptyState: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        marginTop: 20,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,230,118,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(0,230,118,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 8 },
    emptyText: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    generateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00E676',
        borderRadius: 16,
        paddingHorizontal: 28,
        paddingVertical: 14,
    },
    generateBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 16 },
    noMeals: { color: '#555', fontSize: 14, textAlign: 'center', paddingVertical: 20 },

    regenBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        paddingVertical: 14,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    regenBtnText: { color: '#555', fontSize: 14, fontWeight: '600' },
});
