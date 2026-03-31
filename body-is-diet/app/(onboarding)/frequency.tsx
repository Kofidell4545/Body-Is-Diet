import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';
import { useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

const OPTIONS: { value: number; label: string; desc: string }[] = [
    { value: 3, label: '3 meals a day', desc: 'Breakfast • Lunch • Dinner' },
    { value: 4, label: '4 meals a day', desc: 'Breakfast • Lunch • Snack • Dinner' },
    { value: 5, label: '2 mains + snack', desc: 'Breakfast • Dinner • Snack' },
];

export default function FrequencyScreen() {
    const { data, update } = useOnboarding();
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.safe}>
            {/* Progress */}
            <View style={styles.progressRow}>
                {[1,2,3,4,5,6,7].map(i => (
                    <View key={i} style={[styles.pip, i <= 6 && styles.pipActive]} />
                ))}
                <Text style={styles.stepLabel}>6 of 7</Text>
            </View>

            <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: slide }] }]}>
                <Text style={styles.title}>Meals per day</Text>
                <Text style={styles.sub}>How many times do you want to eat daily?</Text>

                <View style={styles.cards}>
                    {OPTIONS.map(o => {
                        const active = data.meals_per_day === o.value;
                        return (
                            <TouchableOpacity
                                key={o.value}
                                style={[styles.card, active && styles.cardActive]}
                                onPress={() => update({ meals_per_day: o.value })}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.badge, active && styles.badgeActive]}>
                                    <Text style={[styles.badgeNum, active && styles.badgeNumActive]}>{o.value}</Text>
                                </View>
                                <View style={styles.cardText}>
                                    <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>{o.label}</Text>
                                    <Text style={styles.cardDesc}>{o.desc}</Text>
                                </View>
                                {active && <Ionicons name="checkmark-circle" size={22} color="#00E676" />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Animated.View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.btn, !data.meals_per_day && styles.btnDisabled]}
                    disabled={!data.meals_per_day}
                    onPress={() => router.push('/(onboarding)/processing')}
                >
                    <Text style={styles.btnText}>Build My Plan</Text>
                    <Ionicons name="sparkles" size={18} color="#000" />
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

    content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
    title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 8, letterSpacing: -0.5 },
    sub: { fontSize: 15, color: '#666', marginBottom: 36 },

    cards: { gap: 14 },
    card: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    },
    cardActive: { borderColor: '#00E676', backgroundColor: 'rgba(0,230,118,0.06)' },
    badge: {
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: 'rgba(0,230,118,0.10)', alignItems: 'center', justifyContent: 'center',
    },
    badgeActive: { backgroundColor: '#00E676' },
    badgeNum: { fontSize: 22, fontWeight: '800', color: '#00E676' },
    badgeNumActive: { color: '#000' },
    cardText: { flex: 1 },
    cardLabel: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 },
    cardLabelActive: { color: '#00E676' },
    cardDesc: { fontSize: 12, color: '#555' },

    footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingBottom: 32 },
    backBtn: {
        width: 56, height: 56, borderRadius: 16, borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
    },
    btn: {
        flex: 1, backgroundColor: '#00E676', borderRadius: 16, height: 56,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    btnDisabled: { opacity: 0.35 },
    btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
