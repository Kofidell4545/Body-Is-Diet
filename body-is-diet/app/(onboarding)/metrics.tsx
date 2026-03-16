import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, TextInput, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';
import { useRef, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

type Gender = 'male' | 'female' | 'other';

export default function MetricsScreen() {
    const { data, update } = useOnboarding();
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(24)).current;

    const [age, setAge] = useState(data.age?.toString() ?? '');
    const [height, setHeight] = useState(data.height_cm?.toString() ?? '');
    const [weight, setWeight] = useState(data.weight_kg?.toString() ?? '');
    const [target, setTarget] = useState(data.target_weight_kg?.toString() ?? '');
    const [gender, setGender] = useState<Gender | undefined>(data.gender);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    const canContinue = age && height && weight && gender;

    const handleContinue = () => {
        update({
            age: parseInt(age),
            height_cm: parseInt(height),
            weight_kg: parseFloat(weight),
            target_weight_kg: target ? parseFloat(target) : undefined,
            gender,
        });
        router.push('/(onboarding)/activity');
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Progress */}
            <View style={styles.progressRow}>
                {[1,2,3,4,5,6,7].map(i => (
                    <View key={i} style={[styles.pip, i <= 2 && styles.pipActive]} />
                ))}
                <Text style={styles.stepLabel}>2 of 7</Text>
            </View>

            <Animated.ScrollView
                style={{ opacity: fade }}
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ transform: [{ translateY: slide }] }}>
                    <Text style={styles.title}>Your body stats</Text>
                    <Text style={styles.sub}>Used to calculate your daily calorie needs.</Text>

                    {/* Gender */}
                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.genderRow}>
                        {(['male','female','other'] as Gender[]).map(g => (
                            <TouchableOpacity
                                key={g}
                                style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                                onPress={() => setGender(g)}
                            >
                                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                                    {g.charAt(0).toUpperCase() + g.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Inputs */}
                    {[
                        { label: 'Age', value: age, set: setAge, unit: 'yrs', placeholder: '25' },
                        { label: 'Height', value: height, set: setHeight, unit: 'cm', placeholder: '175' },
                        { label: 'Current Weight', value: weight, set: setWeight, unit: 'kg', placeholder: '73' },
                        { label: 'Target Weight (optional)', value: target, set: setTarget, unit: 'kg', placeholder: '80' },
                    ].map(field => (
                        <View key={field.label}>
                            <Text style={styles.label}>{field.label}</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={field.value}
                                    onChangeText={field.set}
                                    placeholder={field.placeholder}
                                    placeholderTextColor="#444"
                                    selectionColor="#00E676"
                                />
                                <Text style={styles.unit}>{field.unit}</Text>
                            </View>
                        </View>
                    ))}
                </Animated.View>
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

    scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 },
    title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 8, letterSpacing: -0.5 },
    sub: { fontSize: 15, color: '#666', marginBottom: 28 },

    label: { color: '#AAA', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16, letterSpacing: 0.3 },

    genderRow: { flexDirection: 'row', gap: 10 },
    genderBtn: {
        flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    },
    genderBtnActive: { borderColor: '#00E676', backgroundColor: 'rgba(0,230,118,0.08)' },
    genderText: { color: '#666', fontWeight: '600', fontSize: 14 },
    genderTextActive: { color: '#00E676' },

    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16,
    },
    input: { flex: 1, height: 52, color: '#FFF', fontSize: 17, fontWeight: '600' },
    unit: { color: '#555', fontSize: 14, fontWeight: '600' },

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
