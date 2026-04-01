import {
    View, Text, StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';
import { useRef, useEffect, useState } from 'react';
import { markOnboardingComplete, mealPlanApi } from '../../services/api';

const MESSAGES = [
    'Calculating your daily calories…',
    'Computing your BMR & TDEE…',
    'Matching your favourite meals…',
    'Building a Ghanaian macro profile…',
    'Selecting your best local proteins…',
    'Crafting your weekly meal structure…',
    'Finalising your personalised plan…',
];

export default function ProcessingScreen() {
    const { submit } = useOnboarding();
    const [msgIndex, setMsgIndex] = useState(0);
    const [error, setError] = useState('');

    const spin = useRef(new Animated.Value(0)).current;
    const msgFade = useRef(new Animated.Value(1)).current;
    const fade = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        // Fade in page
        Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();

        // Spinning ring
        Animated.loop(
            Animated.timing(spin, { toValue: 1, duration: 1400, useNativeDriver: true })
        ).start();

        // Pulse glow
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
            ])
        ).start();

        // Cycle messages
        const interval = setInterval(() => {
            Animated.timing(msgFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                setMsgIndex(i => (i + 1) % MESSAGES.length);
                Animated.timing(msgFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            });
        }, 1600);

        // Minimum display time so the animation always plays through once
        const minDelay = new Promise<void>(res => setTimeout(res, MESSAGES.length * 1600));

        let done = false;

        submit()
            .then(() => markOnboardingComplete())
            .then(() => mealPlanApi.generate())
            .then(() => minDelay)
            .then(() => {
                if (!done) {
                    done = true;
                    router.replace('/(tabs)/');
                }
            })
            .catch((e: any) => {
                clearInterval(interval);
                setError(e?.response?.data?.message || e?.message || 'Something went wrong. Please try again.');
            });

        return () => clearInterval(interval);
    }, []);

    const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    return (
        <SafeAreaView style={styles.safe}>
            {/* Progress — all filled */}
            <View style={styles.progressRow}>
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <View key={i} style={[styles.pip, styles.pipActive]} />
                ))}
                <Text style={styles.stepLabel}>7 of 7</Text>
            </View>

            <Animated.View style={[styles.content, { opacity: fade }]}>
                {/* Glow ring */}
                <View style={styles.ringWrap}>
                    <Animated.View style={[styles.glowRing, { opacity: pulse }]} />
                    <Animated.View style={[styles.spinRing, { transform: [{ rotate: spinDeg }] }]} />
                    <View style={styles.centerCircle}>
                        <Ionicons name="nutrition-outline" size={40} color="#00E676" />
                    </View>
                </View>

                <Text style={styles.title}>Building your plan</Text>

                {error ? (
                    <Text style={styles.error}>{error}</Text>
                ) : (
                    <Animated.Text style={[styles.message, { opacity: msgFade }]}>
                        {MESSAGES[msgIndex]}
                    </Animated.Text>
                )}

                <Text style={styles.hint}>This only takes a moment…</Text>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0A0A0A' },
    progressRow: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8,
    },
    pip: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
    pipActive: { backgroundColor: '#00E676' },
    stepLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '600', marginLeft: 4 },

    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

    ringWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 48 },
    glowRing: {
        position: 'absolute', width: 140, height: 140, borderRadius: 70,
        backgroundColor: 'transparent',
        shadowColor: '#00E676', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, shadowRadius: 30,
        borderWidth: 1, borderColor: 'rgba(0,230,118,0.15)',
    },
    spinRing: {
        position: 'absolute', width: 130, height: 130, borderRadius: 65,
        borderWidth: 2.5,
        borderColor: 'transparent',
        borderTopColor: '#00E676',
        borderRightColor: 'rgba(0,230,118,0.3)',
    },
    centerCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(0,230,118,0.08)',
        borderWidth: 1, borderColor: 'rgba(0,230,118,0.20)',
        alignItems: 'center', justifyContent: 'center',
    },


    title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 16, letterSpacing: -0.5, textAlign: 'center' },
    message: { fontSize: 16, color: '#00E676', fontWeight: '500', textAlign: 'center', marginBottom: 12, minHeight: 24 },
    error: { fontSize: 14, color: '#FF5252', textAlign: 'center', marginBottom: 12 },
    hint: { fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 8 },
});