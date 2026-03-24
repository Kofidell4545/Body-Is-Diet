import { View, Text, StyleSheet } from 'react-native';

interface MacroBarProps {
    protein: number;
    carbs: number;
    fats: number;
    proteinTarget: number;
    carbsTarget: number;
    fatsTarget: number;
}

function Bar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
    const progress = Math.min(value / Math.max(target, 1), 1);

    return (
        <View style={styles.barRow}>
            <View style={styles.barLabel}>
                <Text style={[styles.barLabelText, { color }]}>{label}</Text>
                <Text style={styles.barValue}>{value}g <Text style={styles.barTarget}>/ {target}g</Text></Text>
            </View>
            <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
}

export default function MacroBar({ protein, carbs, fats, proteinTarget, carbsTarget, fatsTarget }: MacroBarProps) {
    return (
        <View style={styles.container}>
            <Bar label="Protein" value={protein} target={proteinTarget} color="#42A5F5" />
            <Bar label="Carbs" value={carbs} target={carbsTarget} color="#FFB74D" />
            <Bar label="Fats" value={fats} target={fatsTarget} color="#EF5350" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10,
    },
    barRow: {
        gap: 4,
    },
    barLabel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    barLabelText: {
        fontSize: 12,
        fontWeight: '600',
    },
    barValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
    },
    barTarget: {
        color: '#555',
        fontWeight: '400',
    },
    barTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#1C1C1C',
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
});
