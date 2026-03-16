import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, TextInput, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';
import { useRef, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const PROTEINS = ['Chicken', 'Fish', 'Beef', 'Lamb', 'Turkey', 'Eggs', 'Tofu', 'Beans', 'Shrimp', 'Sardines'];
const CARBS = ['Rice', 'Yam', 'Banku', 'Kenkey', 'Fufu', 'Eba', 'Plantain', 'Cocoyam', 'Oats', 'Bread'];

function ChipGroup({ label, options, selected, onToggle }: {
    label: string;
    options: string[];
    selected: string[];
    onToggle: (item: string) => void;
}) {
    return (
        <View style={styles.chipSection}>
            <Text style={styles.sectionLabel}>{label}</Text>
            <View style={styles.chipRow}>
                {options.map(o => {
                    const on = selected.includes(o);
                    return (
                        <TouchableOpacity
                            key={o}
                            style={[styles.chip, on && styles.chipActive]}
                            onPress={() => onToggle(o)}
                        >
                            <Text style={[styles.chipText, on && styles.chipTextActive]}>{o}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

export default function FoodPrefsScreen() {
    const { data, update } = useOnboarding();
    const fade = useRef(new Animated.Value(0)).current;

    const [proteins, setProteins] = useState<string[]>(data.proteins ?? []);
    const [carbs, setCarbs] = useState<string[]>(data.carbs ?? []);
    const [avoid, setAvoid] = useState(data.avoid_foods?.join(', ') ?? '');

    useEffect(() => {
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const toggle = (list: string[], set: (v: string[]) => void, item: string) => {
        set(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
    };

    const canContinue = proteins.length > 0 && carbs.length > 0;

    const handleContinue = () => {
        update({
            proteins,
            carbs,
            avoid_foods: avoid ? avoid.split(',').map(s => s.trim()).filter(Boolean) : [],
        });
        router.push('/(onboarding)/favorite-meals');
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Progress */}
            <View style={styles.progressRow}>
                {[1,2,3,4,5,6,7].map(i => (
                    <View key={i} style={[styles.pip, i <= 4 && styles.pipActive]} />
                ))}
                <Text style={styles.stepLabel}>4 of 7</Text>
            </View>

            <Animated.ScrollView style={{ opacity: fade }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Food preferences</Text>
                <Text style={styles.sub}>Pick what you enjoy eating. We'll build around these.</Text>

                <ChipGroup label="Proteins" options={PROTEINS} selected={proteins} onToggle={i => toggle(proteins, setProteins, i)} />
                <ChipGroup label="Carbohydrates" options={CARBS} selected={carbs} onToggle={i => toggle(carbs, setCarbs, i)} />

                <View style={styles.avoidSection}>
                    <Text style={styles.sectionLabel}>Foods to avoid (optional)</Text>
                    <TextInput
                        style={styles.avoidInput}
                        placeholder="e.g. Pork, Dairy, Gluten…"
                        placeholderTextColor="#444"
                        value={avoid}
                        onChangeText={setAvoid}
                        selectionColor="#00E676"
                        multiline
                    />
                </View>
            </Animated.ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.btn, !canContinue && styles.btnDisabled]}
                    disabled={!canContinue}
                    onPress={handleContinue}
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

    scroll: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16 },
    title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 8, letterSpacing: -0.5 },
    sub: { fontSize: 15, color: '#666', marginBottom: 24 },

    chipSection: { marginBottom: 24 },
    sectionLabel: { color: '#AAA', fontSize: 13, fontWeight: '600', marginBottom: 12, letterSpacing: 0.3 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    },
    chipActive: { backgroundColor: 'rgba(0,230,118,0.10)', borderColor: '#00E676' },
    chipText: { color: '#666', fontSize: 14, fontWeight: '600' },
    chipTextActive: { color: '#00E676' },

    avoidSection: { marginBottom: 24 },
    avoidInput: {
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
        padding: 16, color: '#FFF', fontSize: 15, minHeight: 72,
    },

    footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingBottom: 32 },
    backBtn: {
        width: 56, height: 56, borderRadius: 16, borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
    },
    btn: {
        flex: 1, backgroundColor: '#00E676', borderRadius: 16, height: 56,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    btnDisabled: { opacity: 0.35 },
    btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
