import { Stack } from 'expo-router';
import { OnboardingProvider } from '../../context/OnboardingContext';
import { View, Text, StyleSheet } from 'react-native';

const STEPS = ['Goal', 'Metrics', 'Activity', 'Food', 'Meals', 'Frequency', 'Plan'];

const ROUTE_ORDER = ['goal', 'metrics', 'activity', 'food-prefs', 'favorite-meals', 'frequency', 'processing'];

function OnboardingHeader({ step }: { step: number }) {
    return (
        <View style={styles.header}>
            {/* Step dots */}
            <View style={styles.dots}>
                {STEPS.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            i < step && styles.dotDone,
                            i === step - 1 && styles.dotActive,
                        ]}
                    />
                ))}
            </View>
            <Text style={styles.stepText}>{step} of {STEPS.length}</Text>
        </View>
    );
}

export default function OnboardingLayout() {
    return (
        <OnboardingProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </OnboardingProvider>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 28,
        paddingTop: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0A0A0A',
    },
    dots: {
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 28,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    dotDone: {
        backgroundColor: 'rgba(0,230,118,0.45)',
    },
    dotActive: {
        backgroundColor: '#00E676',
    },
    stepText: {
        color: 'rgba(255,255,255,0.40)',
        fontSize: 12,
        fontWeight: '600',
    },
});
