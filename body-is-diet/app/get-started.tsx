import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../components/ui';

const { height } = Dimensions.get('window');

export default function GetStarted() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>

            {/* Top visual block */}
            <View style={styles.visual}>
                <View style={styles.circle1} />
                <View style={styles.circle2} />
                <View style={styles.circle3} />
                <Text style={styles.emoji}>🥗</Text>
            </View>

            {/* Content */}
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Text style={styles.heading}>Eat local.{'\n'}Train hard.{'\n'}Look good.</Text>
                <Text style={styles.sub}>
                    AI-powered meal plans built around your local food, your body, and your goals.
                </Text>

                <PrimaryButton
                    label="Get Started"
                    onPress={() => router.push('/(auth)/signup')}
                    style={styles.primaryGap}
                />
                <SecondaryButton
                    label="I already have an account"
                    onPress={() => router.push('/(auth)/login')}
                />
            </Animated.View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    visual: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    circle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#00E67615', top: height * 0.05 },
    circle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#00E67625', top: height * 0.08 },
    circle3: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#00E67635', top: height * 0.1 },
    emoji: { fontSize: 80, zIndex: 10 },
    content: { paddingHorizontal: 28, paddingBottom: 48 },
    heading: { fontSize: 40, fontWeight: '800', color: '#FFF', lineHeight: 48, letterSpacing: -1, marginBottom: 16 },
    sub: { fontSize: 15, color: '#888', lineHeight: 22, marginBottom: 40 },
    primaryGap: { marginBottom: 14 },
});
