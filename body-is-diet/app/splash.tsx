import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Splash() {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.8)).current;
    const { isAuthenticated, isLoading } = useAuth();
    const navigated = useRef(false);

    useEffect(() => {
        // Fade + scale in
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, [opacity, scale]);

    useEffect(() => {
        if (navigated.current || isLoading) return;

        const timer = setTimeout(() => {
            navigated.current = true;
            if (isAuthenticated) {
                router.replace('/(tabs)/');
            } else {
                router.replace('/get-started');
            }
        }, 1500); // reduced slightly to feel snappier 

        return () => clearTimeout(timer);
    }, [isLoading, isAuthenticated]);

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity, transform: [{ scale }] }}>
                <Text style={styles.logo}>Body is Diet</Text>
                <Text style={styles.tagline}>Fuel your goals with local meals</Text>
            </Animated.View>
            <Animated.View style={[styles.dot, { opacity }]}>
                <View style={styles.dotInner} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        fontSize: 42,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: -1,
    },
    tagline: {
        fontSize: 15,
        color: '#00E676',
        textAlign: 'center',
        marginTop: 10,
        letterSpacing: 0.5,
    },
    dot: {
        position: 'absolute',
        bottom: 80,
        alignItems: 'center',
    },
    dotInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00E676',
    },
});
