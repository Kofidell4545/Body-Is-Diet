import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';

export default function Splash() {
    const opacity = new Animated.Value(0);
    const scale = new Animated.Value(0.8);

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

        // Auto navigate after 2.5s
        const timer = setTimeout(() => {
            router.replace('/get-started');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

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
