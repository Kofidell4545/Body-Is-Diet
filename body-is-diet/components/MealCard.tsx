import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MealPlanItem } from '../types';

interface MealCardProps {
    item: MealPlanItem;
    onSwap: () => void;
    onComplete: () => void;
}

function formatSlot(slot: string): string {
    const base = slot.replace(/_\d+$/, '');
    return base.charAt(0).toUpperCase() + base.slice(1);
}

export default function MealCard({ item, onSwap, onComplete }: MealCardProps) {
    const isCompleted = item.is_completed;

    return (
        <View style={[styles.card, isCompleted && styles.cardCompleted]}>
            <View style={styles.header}>
                <Text style={styles.slot}>{formatSlot(item.meal_slot)}</Text>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={onSwap} style={styles.actionBtn} activeOpacity={0.7}>
                        <Text style={styles.swapIcon}>↻</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onComplete} style={styles.actionBtn} activeOpacity={0.7}>
                        <Text style={[styles.checkIcon, isCompleted && styles.checkIconActive]}>
                            {isCompleted ? '✓' : '○'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={[styles.foodName, isCompleted && styles.foodNameCompleted]}>
                {item.food_name}
            </Text>

            <View style={styles.macroRow}>
                <Text style={styles.calories}>{item.calories} kcal</Text>
                <View style={styles.macroPills}>
                    <View style={[styles.pill, { backgroundColor: 'rgba(66,165,245,0.15)' }]}>
                        <Text style={[styles.pillText, { color: '#42A5F5' }]}>P {item.protein_g}g</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: 'rgba(255,183,77,0.15)' }]}>
                        <Text style={[styles.pillText, { color: '#FFB74D' }]}>C {item.carbs_g}g</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: 'rgba(239,83,80,0.15)' }]}>
                        <Text style={[styles.pillText, { color: '#EF5350' }]}>F {item.fats_g}g</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1C1C1C',
    },
    cardCompleted: {
        opacity: 0.65,
        borderColor: 'rgba(0,230,118,0.2)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    slot: {
        fontSize: 11,
        fontWeight: '700',
        color: '#555',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    swapIcon: {
        fontSize: 16,
        color: '#888',
    },
    checkIcon: {
        fontSize: 16,
        color: '#555',
    },
    checkIconActive: {
        color: '#00E676',
        fontWeight: '700',
    },
    foodName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 10,
    },
    foodNameCompleted: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    macroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    calories: {
        fontSize: 15,
        fontWeight: '700',
        color: '#00E676',
    },
    macroPills: {
        flexDirection: 'row',
        gap: 6,
    },
    pill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    pillText: {
        fontSize: 11,
        fontWeight: '600',
    },
});
