import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { MealPlanItem } from '../types';

interface MealCardProps {
    item: MealPlanItem;
    onSwap: () => void;
    onComplete: () => void;
}

const SLOT_COLORS: Record<string, string> = {
    breakfast: '#F59E0B',
    lunch:     '#3B82F6',
    dinner:    '#8B5CF6',
    snack:     '#EC4899',
    evening_snack: '#EF4444',
};

function formatSlot(slot: string): string {
    const base = slot.replace(/_\d+$/, '');
    return base.charAt(0).toUpperCase() + base.slice(1).replace(/_/g, ' ');
}

export default function MealCard({ item, onSwap, onComplete }: MealCardProps) {
    const isCompleted = item.is_completed;
    const slotBase = item.meal_slot.replace(/_\d+$/, '');
    const accentColor = SLOT_COLORS[slotBase] ?? '#888';

    // Scale spring on press
    const scale = useRef(new Animated.Value(1)).current;
    const pressIn = () =>
        Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, tension: 200 }).start();
    const pressOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 160 }).start();

    return (
        <Animated.View style={[styles.wrapper, { transform: [{ scale }] }, isCompleted && styles.wrapperDone]}>
            <BlurView intensity={20} tint="dark" style={styles.blur}>
                {/* Coloured top accent bar */}
                <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                {/* Top specular shine */}
                <View style={styles.topShine} />

                <View style={styles.inner}>
                    {/* Header row */}
                    <View style={styles.header}>
                        <View style={[styles.slotPill, { borderColor: accentColor + '55', backgroundColor: accentColor + '18' }]}>
                            <Text style={[styles.slotText, { color: accentColor }]}>
                                {formatSlot(item.meal_slot)}
                            </Text>
                        </View>

                        <View style={styles.actions}>
                            {/* Swap */}
                            <TouchableOpacity
                                onPress={onSwap}
                                onPressIn={pressIn}
                                onPressOut={pressOut}
                                style={styles.actionBtn}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="shuffle-outline" size={16} color="#666" />
                            </TouchableOpacity>

                            {/* Complete */}
                            <TouchableOpacity
                                onPress={onComplete}
                                style={[styles.actionBtn, isCompleted && styles.actionBtnDone]}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={18}
                                    color={isCompleted ? '#00E676' : '#444'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Food name */}
                    <Text style={[styles.foodName, isCompleted && styles.foodNameDone]} numberOfLines={2}>
                        {item.food_name}
                    </Text>

                    {/* Macro strip */}
                    <View style={styles.macroRow}>
                        <Text style={[styles.calories, isCompleted && styles.caloriesDone]}>
                            {item.calories} kcal
                        </Text>
                        <View style={styles.pills}>
                            <MacroPill label="P" value={item.protein_g} color="#60A5FA" />
                            <MacroPill label="C" value={item.carbs_g} color="#FBBF24" />
                            <MacroPill label="F" value={item.fats_g} color="#F87171" />
                        </View>
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={[pillStyles.pill, { borderColor: color + '30', backgroundColor: color + '14' }]}>
            <Text style={[pillStyles.text, { color }]}>
                {label} <Text style={pillStyles.val}>{value}g</Text>
            </Text>
        </View>
    );
}

const pillStyles = StyleSheet.create({
    pill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
    },
    text: { fontSize: 11, fontWeight: '700' },
    val: { fontWeight: '500' },
});

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    wrapperDone: { opacity: 0.55 },

    blur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(14,14,14,0.75)',
    },

    accentBar: {
        height: 3,
        opacity: 0.75,
    },
    topShine: {
        position: 'absolute',
        top: 3,   // just below accent bar
        left: 20,
        right: 20,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.14)',
        zIndex: 2,
    },

    inner: { padding: 16 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    slotPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
    },
    slotText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },

    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnDone: {
        borderColor: 'rgba(0,230,118,0.25)',
        backgroundColor: 'rgba(0,230,118,0.08)',
    },

    foodName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 12,
        lineHeight: 22,
    },
    foodNameDone: {
        textDecorationLine: 'line-through',
        color: 'rgba(255,255,255,0.35)',
    },

    macroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    calories: { fontSize: 15, fontWeight: '800', color: '#00E676' },
    caloriesDone: { color: 'rgba(0,230,118,0.45)' },
    pills: { flexDirection: 'row', gap: 5 },
});
