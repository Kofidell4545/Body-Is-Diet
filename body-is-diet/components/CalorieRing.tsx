import { View, Text, StyleSheet } from 'react-native';

interface CalorieRingProps {
    consumed: number;
    target: number;
    size?: number;
}

export default function CalorieRing({ consumed, target, size = 130 }: CalorieRingProps) {
    const progress = Math.min(consumed / Math.max(target, 1), 1);
    const remaining = Math.max(target - consumed, 0);
    const ringWidth = 10;
    const radius = (size - ringWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeOffset = circumference * (1 - progress);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Background ring */}
            <View style={[styles.ringBg, {
                width: size, height: size, borderRadius: size / 2,
                borderWidth: ringWidth,
            }]} />

            {/* Progress ring using border trick */}
            <View style={[styles.progressWrap, { width: size, height: size }]}>
                {/* We use 4 quarter-circle segments for smooth progress */}
                <View style={[styles.progressRing, {
                    width: size, height: size, borderRadius: size / 2,
                    borderWidth: ringWidth,
                    borderColor: '#00E676',
                    // Clip to show only the progress portion
                    opacity: progress > 0 ? 1 : 0,
                    transform: [{ rotate: '-90deg' }],
                    borderRightColor: progress > 0.25 ? '#00E676' : 'transparent',
                    borderBottomColor: progress > 0.5 ? '#00E676' : 'transparent',
                    borderLeftColor: progress > 0.75 ? '#00E676' : 'transparent',
                }]} />
            </View>

            {/* Center text */}
            <View style={styles.center}>
                <Text style={styles.consumedText}>{consumed}</Text>
                <Text style={styles.labelText}>of {target} kcal</Text>
                <Text style={styles.remainingText}>{remaining} left</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringBg: {
        position: 'absolute',
        borderColor: '#1C1C1C',
    },
    progressWrap: {
        position: 'absolute',
    },
    progressRing: {
        borderTopColor: '#00E676',
    },
    center: {
        alignItems: 'center',
    },
    consumedText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#00E676',
    },
    labelText: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    remainingText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
        marginTop: 2,
    },
});
