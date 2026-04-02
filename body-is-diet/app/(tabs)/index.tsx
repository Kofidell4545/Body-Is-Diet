import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useMealPlan } from '../../context/MealPlanContext';
import { useAuth } from '../../context/AuthContext';
import DailySummaryCard from '../../components/DailySummaryCard';
import MealCard from '../../components/MealCard';

//  Helpers 
function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 5)  return 'Up late';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function getFirstName(fullName: string | null): string {
    if (!fullName) return '';
    return fullName.trim().split(' ')[0];
}

//  Animated cycling button 
const IDLE_PHRASES = [
    'Craft my plate',
    'Nourish my week',
    'Build my meals',
    'Balance my macros',
    'Plan my nutrition',
    'Fuel my goals',
];

const WORKING_PHRASES = [
    'Selecting Ghanaian foods...',
    'Balancing your macros...',
    'Crafting your plate...',
    'Building your week...',
    'Nourishing your body...',
    'Almost ready...',
];

function CyclingPlanButton({ onPress, isGenerating }: { onPress: () => void; isGenerating: boolean }) {
    const [phraseIdx, setPhraseIdx] = useState(0);
    const fade = useRef(new Animated.Value(1)).current;
    const phrases = isGenerating ? WORKING_PHRASES : IDLE_PHRASES;

    useEffect(() => {
        setPhraseIdx(0);
    }, [isGenerating]);

    useEffect(() => {
        const interval = setInterval(() => {
            Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
                setPhraseIdx(i => (i + 1) % phrases.length);
                Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            });
        }, isGenerating ? 900 : 2600);

        return () => clearInterval(interval);
    }, [isGenerating, phrases.length]);

    return (
        <TouchableOpacity
            style={[styles.generateBtn, isGenerating && styles.generateBtnActive]}
            onPress={onPress}
            activeOpacity={0.85}
            disabled={isGenerating}
        >
            {isGenerating
                ? <ActivityIndicator color="#000" size="small" style={{ marginRight: 8 }} />
                : <Ionicons name="nutrition-outline" size={18} color="#000" style={{ marginRight: 8 }} />
            }
            <Animated.Text style={[styles.generateBtnText, { opacity: fade }]}>
                {phrases[phraseIdx]}
            </Animated.Text>
        </TouchableOpacity>
    );
}

//  Screen 
export default function Home() {
    const { userName } = useAuth();
    const {
        weekPlan, todayPlan, isLoading, error,
        fetchPlan, generatePlan, swapMeal, completeMeal,
    } = useMealPlan();

    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        await generatePlan();
        setIsGenerating(false);
    };

    const firstName = getFirstName(userName);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/*  Header  */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>{getGreeting()}</Text>
                        <Text style={styles.title} numberOfLines={1}>
                            {firstName || 'Welcome'}
                        </Text>
                    </View>
                    <View style={styles.avatarBadge}>
                        <Ionicons name="flame" size={20} color="#00E676" />
                    </View>
                </View>

                {/*  Loading  */}
                {isLoading && !weekPlan && (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator color="#00E676" size="large" />
                        <Text style={styles.loadingText}>Loading your plan...</Text>
                    </View>
                )}

                {/*  Error  */}
                {error && (
                    <View style={styles.errorCard}>
                        <Ionicons name="alert-circle-outline" size={16} color="#FF5252" style={{ marginRight: 8 }} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/*  Empty state  */}
                {!isLoading && !weekPlan && (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons name="restaurant-outline" size={40} color="#00E676" />
                        </View>
                        <Text style={styles.emptyTitle}>No Meal Plan Yet</Text>
                        <Text style={styles.emptyText}>
                            Get a personalised weekly menu built around Ghanaian foods and your goals.
                        </Text>
                        <CyclingPlanButton onPress={handleGenerate} isGenerating={isGenerating} />
                    </View>
                )}

                {/*  Plan exists  */}
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

//  Styles 
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    scroll: { padding: 24, paddingBottom: 120 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    headerLeft: { flex: 1, marginRight: 12 },
    greeting: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.8,
    },
    avatarBadge: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(0,230,118,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(0,230,118,0.20)',
        alignItems: 'center',
        justifyContent: 'center',
    },

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
    emptyText: {
        color: '#555', fontSize: 14, textAlign: 'center',
        lineHeight: 22, marginBottom: 28,
    },

    generateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00E676',
        borderRadius: 16,
        paddingHorizontal: 28,
        paddingVertical: 15,
        minWidth: 220,
    },
    generateBtnActive: { backgroundColor: 'rgba(0,230,118,0.85)' },
    generateBtnText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.2,
    },

    sectionTitle: {
        fontSize: 18, fontWeight: '700', color: '#FFF',
        marginBottom: 14, marginTop: 6,
    },
    noMeals: { color: '#555', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});
