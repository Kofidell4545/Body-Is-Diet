import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';
import { useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

type Goal = 'lose_weight' | 'gain_muscle' | 'gain_weight' | 'maintain';

const GOALS: { key: Goal; label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'lose_weight',  label: 'Lose Weight',   subtitle: 'Burn fat, stay lean',         icon: 'flame-outline' },
    { key: 'gain_muscle',  label: 'Gain Muscle',   subtitle: 'Build strength & size',        icon: 'barbell-outline' },
    { key: 'gain_weight',  label: 'Gain Weight',   subtitle: 'Healthy mass & energy',        icon: 'trending-up-outline' },
    { key: 'maintain',     label: 'Maintain',      subtitle: 'Stay balanced & consistent',   icon: 'checkmark-circle-outline' },
];

export default function GoalScreen() {
    const { data, update } = useOnboarding();
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    const select = (key: Goal) => update({ goal: key });

    return (
        <SafeAreaView style={styles.safe}>
            {/* Progress */}
            <View style={styles.progressRow}>
                {[1,2,3,4,5,6,7].map(i => (
                    <View key={i} style={[styles.pip, i === 1 && styles.pipActive]} />
                ))}
                <Text style={styles.stepLabel}>1 of 7</Text>
            </View>

            <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: slide }] }]}>
                <Text style={styles.title}>What's your goal?</Text>
                <Text style={styles.sub}>We'll tailor your meal plan around this.</Text>

                <View style={styles.cards}>
                    {GOALS.map(g => {
                        const active = data.goal === g.key;
                        return (
                            <TouchableOpacity
                                key={g.key}
                                style={[styles.card, active && styles.cardActive]}
                                onPress={() => select(g.key)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                                    <Ionicons name={g.icon} size={26} color={active ? '#000' : '#00E676'} />
                                </View>
                                <View style={styles.cardText}>
                                    <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>{g.label}</Text>
                                    <Text style={styles.cardSub}>{g.subtitle}</Text>
                                </View>
                                {active && <Ionicons name="checkmark-circle" size={22} color="#00E676" />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Animated.View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.btn, !data.goal && styles.btnDisabled]}
                    disabled={!data.goal}
                    onPress={() => router.push('/(onboarding)/metrics')}
                >
                    <Text style={styles.btnText}>Continue</Text>
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

    content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
    title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 8, letterSpacing: -0.5 },
    sub:   { fontSize: 15, color: '#666', marginBottom: 32 },

    cards: { gap: 12 },
    card: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18, padding: 18,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    },
    cardActive: { borderColor: '#00E676', backgroundColor: 'rgba(0,230,118,0.06)' },
    iconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0,230,118,0.10)', alignItems: 'center', justifyContent: 'center' },
    iconWrapActive: { backgroundColor: '#00E676' },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 2 },
    cardTitleActive: { color: '#00E676' },
    cardSub: { fontSize: 13, color: '#555' },

    footer: { paddingHorizontal: 24, paddingBottom: 32 },
    btn: {
        backgroundColor: '#00E676', borderRadius: 16, height: 56,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    btnDisabled: { opacity: 0.35 },
    btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
