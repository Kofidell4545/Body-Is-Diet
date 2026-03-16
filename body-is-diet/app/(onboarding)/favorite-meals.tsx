import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';
import { useRef, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const MEALS = [
    'Waakye', 'Banku & Tilapia', 'Jollof Rice', 'Fufu & Light Soup',
    'Kelewele', 'Omotuo & Groundnut Soup', 'Kontomire Stew & Rice',
    'Grilled Chicken & Yam', 'Rice & Beans', 'Ampesi & Palava Sauce',
    'Fried Rice & Chicken', 'Tuo Zaafi', 'Boiled Yam & Egg Stew',
    'Peanut Butter Soup & Rice', 'Garden Egg Stew', 'Bofroto',
];

export default function FavoriteMealsScreen() {
    const { data, update } = useOnboarding();
    const fade = useRef(new Animated.Value(0)).current;
    const [selected, setSelected] = useState<string[]>(data.favorite_meals ?? []);

    useEffect(() => {
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const toggle = (meal: string) => {
        setSelected(prev => prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]);
    };

    const handleContinue = () => {
        update({ favorite_meals: selected });
        router.push('/(onboarding)/frequency');
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Progress */}
            <View style={styles.progressRow}>
                {[1,2,3,4,5,6,7].map(i => (
                    <View key={i} style={[styles.pip, i <= 5 && styles.pipActive]} />
                ))}
                <Text style={styles.stepLabel}>5 of 7</Text>
            </View>

            <Animated.ScrollView style={{ opacity: fade }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Favourite meals</Text>
                <Text style={styles.sub}>The AI will adapt these to hit your macros. Pick as many as you like.</Text>

                <View style={styles.chipRow}>
                    {MEALS.map(meal => {
                        const on = selected.includes(meal);
                        return (
                            <TouchableOpacity
                                key={meal}
                                style={[styles.chip, on && styles.chipActive]}
                                onPress={() => toggle(meal)}
                                activeOpacity={0.75}
                            >
                                {on && <Ionicons name="checkmark" size={13} color="#00E676" style={{ marginRight: 4 }} />}
                                <Text style={[styles.chipText, on && styles.chipTextActive]}>{meal}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Animated.ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={handleContinue}>
                    <Text style={styles.btnText}>{selected.length === 0 ? 'Skip' : 'Continue'}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#000" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0A0A0A' },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
    pip: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
    pipActive: { backgroundColor: '#00E676' },
    stepLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '600', marginLeft: 4 },

    scroll: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16 },
    title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 8, letterSpacing: -0.5 },
    sub: { fontSize: 15, color: '#666', marginBottom: 24 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    },
    chipActive: { backgroundColor: 'rgba(0,230,118,0.08)', borderColor: '#00E676' },
    chipText: { color: '#666', fontSize: 14, fontWeight: '600' },
    chipTextActive: { color: '#00E676' },

    footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingBottom: 32 },
    backBtn: {
        width: 56, height: 56, borderRadius: 16, borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
    },
    btn: {
        flex: 1, backgroundColor: '#00E676', borderRadius: 16, height: 56,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
