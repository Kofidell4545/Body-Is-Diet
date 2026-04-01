import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Modal, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { progressApi } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeightLog {
    id: string;
    weight_kg: number;
    body_fat_pct?: number;
    notes?: string;
    logged_at: string;
}

interface ProgressAnalysis {
    weeks_tracked: number;
    current_weight_kg: number;
    start_weight_kg: number;
    total_change_kg: number;
    weekly_rate_kg: number;
    expected_rate_kg: number;
    on_track: boolean;
    status: string;
    status_message: string;
    recommended_adjustment_kcal: number;
    current_target_calories: number;
    new_target_calories: number;
}

// ─── Weight Chart (simple bar chart) ─────────────────────────────────────────
function WeightChart({ logs }: { logs: WeightLog[] }) {
    if (logs.length < 2) return null;

    const weights = logs.map(l => l.weight_kg);
    const min = Math.min(...weights) - 1;
    const max = Math.max(...weights) + 1;
    const range = max - min || 1;

    const last12 = logs.slice(-12);

    return (
        <View style={chartStyles.container}>
            <Text style={chartStyles.title}>Weight History</Text>
            <View style={chartStyles.chart}>
                {last12.map((log, i) => {
                    const height = ((log.weight_kg - min) / range) * 80 + 10;
                    const isLatest = i === last12.length - 1;
                    return (
                        <View key={log.id} style={chartStyles.barCol}>
                            <Text style={chartStyles.barValue}>
                                {isLatest ? `${log.weight_kg}` : ''}
                            </Text>
                            <View
                                style={[
                                    chartStyles.bar,
                                    { height, backgroundColor: isLatest ? '#22C55E' : '#2A2A2A' },
                                ]}
                            />
                            <Text style={chartStyles.barLabel}>
                                {new Date(log.logged_at).toLocaleDateString('en', { day: 'numeric', month: 'short' }).split(' ')[0]}
                            </Text>
                        </View>
                    );
                })}
            </View>
            <View style={chartStyles.legend}>
                <Text style={chartStyles.legendText}>
                    Start: {logs[0].weight_kg}kg → Now: {logs[logs.length - 1].weight_kg}kg
                    {'  '}
                    ({logs[logs.length - 1].weight_kg - logs[0].weight_kg > 0 ? '+' : ''}
                    {(logs[logs.length - 1].weight_kg - logs[0].weight_kg).toFixed(1)}kg)
                </Text>
            </View>
        </View>
    );
}

// ─── Status Card ──────────────────────────────────────────────────────────────
function StatusCard({ analysis }: { analysis: ProgressAnalysis }) {
    const statusColour: Record<string, string> = {
        on_track: '#22C55E',
        too_slow: '#F59E0B',
        too_fast: '#F59E0B',
        wrong_direction: '#EF4444',
        not_enough_data: '#6B7280',
    };

    const statusIcon: Record<string, string> = {
        on_track: 'checkmark-circle',
        too_slow: 'trending-down',
        too_fast: 'trending-up',
        wrong_direction: 'alert-circle',
        not_enough_data: 'time-outline',
    };

    const colour = statusColour[analysis.status] ?? '#6B7280';
    const icon = statusIcon[analysis.status] ?? 'help-circle';

    return (
        <View style={[cardStyles.container, { borderColor: colour + '40' }]}>
            <View style={cardStyles.header}>
                <Ionicons name={icon as any} size={22} color={colour} />
                <Text style={[cardStyles.title, { color: colour }]}>
                    {analysis.on_track ? 'On Track 🎯' : 'Needs Attention'}
                </Text>
            </View>
            <Text style={cardStyles.message}>{analysis.status_message}</Text>

            {analysis.recommended_adjustment_kcal !== 0 && (
                <View style={[cardStyles.adjustment, { backgroundColor: colour + '15' }]}>
                    <Ionicons
                        name={analysis.recommended_adjustment_kcal > 0 ? 'add-circle' : 'remove-circle'}
                        size={16}
                        color={colour}
                    />
                    <Text style={[cardStyles.adjustmentText, { color: colour }]}>
                        Next plan: {analysis.recommended_adjustment_kcal > 0 ? '+' : ''}
                        {analysis.recommended_adjustment_kcal} kcal/day
                        ({analysis.new_target_calories} kcal total)
                    </Text>
                </View>
            )}
        </View>
    );
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <View style={statStyles.row}>
            <Text style={statStyles.label}>{label}</Text>
            <View style={statStyles.right}>
                <Text style={statStyles.value}>{value}</Text>
                {sub && <Text style={statStyles.sub}>{sub}</Text>}
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LogScreen() {
    const [logs, setLogs] = useState<WeightLog[]>([]);
    const [analysis, setAnalysis] = useState<ProgressAnalysis | null>(null);
    const [goalRealism, setGoalRealism] = useState<{ is_realistic: boolean; message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);

    // Log weight modal state
    const [weightInput, setWeightInput] = useState('');
    const [bodyFatInput, setBodyFatInput] = useState('');
    const [notesInput, setNotesInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const load = useCallback(async () => {
        try {
            const [historyData, analysisData] = await Promise.all([
                progressApi.getWeightHistory(12),
                progressApi.getAnalysis(),
            ]);
            setLogs(historyData);
            setAnalysis(analysisData.analysis);
            setGoalRealism(analysisData.goal_realism);
        } catch (err: any) {
            // Silently fail if no data yet
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        load();
    }, [load]);

    const handleLogWeight = async () => {
        const weight = parseFloat(weightInput);
        if (isNaN(weight) || weight < 20 || weight > 500) {
            Alert.alert('Invalid weight', 'Please enter a weight between 20kg and 500kg');
            return;
        }

        setIsSubmitting(true);
        try {
            const bodyFat = bodyFatInput ? parseFloat(bodyFatInput) : undefined;
            await progressApi.logWeight(weight, bodyFat, notesInput || undefined);
            setShowLogModal(false);
            setWeightInput('');
            setBodyFatInput('');
            setNotesInput('');
            await load();
            Alert.alert('✅ Weight logged!', `${weight}kg recorded.`);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Could not log weight');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator color="#22C55E" size="large" style={{ marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    const noLogs = logs.length === 0;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Progress</Text>
                        <Text style={styles.subtitle}>
                            {noLogs ? 'Start tracking your weight' : `${logs.length} check-in${logs.length !== 1 ? 's' : ''}`}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.logBtn} onPress={() => setShowLogModal(true)}>
                        <Ionicons name="add" size={20} color="#000" />
                        <Text style={styles.logBtnText}>Log Weight</Text>
                    </TouchableOpacity>
                </View>

                {/* Goal realism warning */}
                {goalRealism && !goalRealism.is_realistic && (
                    <View style={styles.warningCard}>
                        <Ionicons name="warning" size={18} color="#F59E0B" />
                        <Text style={styles.warningText}>{goalRealism.message}</Text>
                    </View>
                )}

                {/* No logs state */}
                {noLogs ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="scale-outline" size={64} color="#2A2A2A" />
                        <Text style={styles.emptyTitle}>Log your first weight</Text>
                        <Text style={styles.emptyText}>
                            Weigh yourself weekly — ideally Monday morning before eating.
                            We'll adapt your meal plan based on your progress.
                        </Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowLogModal(true)}>
                            <Text style={styles.emptyBtnText}>Log Weight Now</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Status Card */}
                        {analysis && <StatusCard analysis={analysis} />}

                        {/* Weight Chart */}
                        <WeightChart logs={logs} />

                        {/* Stats */}
                        {analysis && analysis.weeks_tracked > 0 && (
                            <View style={styles.statsSection}>
                                <Text style={styles.sectionTitle}>Stats</Text>
                                <View style={styles.statsCard}>
                                    <StatRow
                                        label="Current weight"
                                        value={`${analysis.current_weight_kg}kg`}
                                    />
                                    <StatRow
                                        label="Change so far"
                                        value={`${analysis.total_change_kg > 0 ? '+' : ''}${analysis.total_change_kg.toFixed(1)}kg`}
                                        sub={`${analysis.weeks_tracked} week${analysis.weeks_tracked !== 1 ? 's' : ''}`}
                                    />
                                    <StatRow
                                        label="Weekly rate"
                                        value={`${analysis.weekly_rate_kg > 0 ? '+' : ''}${analysis.weekly_rate_kg.toFixed(2)}kg/wk`}
                                        sub={`Target: ${analysis.expected_rate_kg > 0 ? '+' : ''}${analysis.expected_rate_kg}kg/wk`}
                                    />
                                    <StatRow
                                        label="Daily calorie target"
                                        value={`${analysis.current_target_calories} kcal`}
                                        sub={analysis.recommended_adjustment_kcal !== 0
                                            ? `→ ${analysis.new_target_calories} kcal next week`
                                            : 'Staying the same'}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Recent logs */}
                        <View style={styles.logsSection}>
                            <Text style={styles.sectionTitle}>Recent Check-ins</Text>
                            {logs.slice(-8).reverse().map((log) => (
                                <View key={log.id} style={styles.logRow}>
                                    <View>
                                        <Text style={styles.logWeight}>{log.weight_kg} kg</Text>
                                        {log.body_fat_pct && (
                                            <Text style={styles.logBf}>{log.body_fat_pct}% body fat</Text>
                                        )}
                                        {log.notes && <Text style={styles.logNotes}>{log.notes}</Text>}
                                    </View>
                                    <Text style={styles.logDate}>
                                        {new Date(log.logged_at).toLocaleDateString('en', {
                                            weekday: 'short', day: 'numeric', month: 'short',
                                        })}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Log Weight Modal */}
            <Modal visible={showLogModal} transparent animationType="slide">
                <View style={modalStyles.overlay}>
                    <View style={modalStyles.sheet}>
                        <View style={modalStyles.handle} />
                        <Text style={modalStyles.title}>Log Your Weight</Text>
                        <Text style={modalStyles.hint}>
                            Best time: Monday morning, before eating, after using the bathroom.
                        </Text>

                        <Text style={modalStyles.label}>Weight (kg) *</Text>
                        <TextInput
                            style={modalStyles.input}
                            value={weightInput}
                            onChangeText={setWeightInput}
                            keyboardType="decimal-pad"
                            placeholder="e.g. 78.5"
                            placeholderTextColor="#555"
                            autoFocus
                        />

                        <Text style={modalStyles.label}>Body Fat % (optional)</Text>
                        <TextInput
                            style={modalStyles.input}
                            value={bodyFatInput}
                            onChangeText={setBodyFatInput}
                            keyboardType="decimal-pad"
                            placeholder="e.g. 18.5"
                            placeholderTextColor="#555"
                        />

                        <Text style={modalStyles.label}>Notes (optional)</Text>
                        <TextInput
                            style={[modalStyles.input, modalStyles.notesInput]}
                            value={notesInput}
                            onChangeText={setNotesInput}
                            placeholder="e.g. post-workout, felt bloated..."
                            placeholderTextColor="#555"
                            multiline
                        />

                        <TouchableOpacity
                            style={[modalStyles.submitBtn, isSubmitting && modalStyles.btnDisabled]}
                            onPress={handleLogWeight}
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? <ActivityIndicator color="#000" />
                                : <Text style={modalStyles.submitText}>Save Entry</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={modalStyles.cancelBtn}
                            onPress={() => setShowLogModal(false)}
                        >
                            <Text style={modalStyles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    scroll: { padding: 20, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '800', color: '#FFF' },
    subtitle: { fontSize: 14, color: '#555', marginTop: 2 },
    logBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#22C55E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    },
    logBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
    warningCard: {
        flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        backgroundColor: '#F59E0B15', borderColor: '#F59E0B40', borderWidth: 1,
        borderRadius: 12, padding: 14, marginBottom: 16,
    },
    warningText: { color: '#F59E0B', fontSize: 13, flex: 1, lineHeight: 18 },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
    emptyText: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
    emptyBtn: {
        backgroundColor: '#22C55E', paddingHorizontal: 28, paddingVertical: 12,
        borderRadius: 24, marginTop: 8,
    },
    emptyBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
    statsSection: { marginTop: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 12 },
    statsCard: { backgroundColor: '#141414', borderRadius: 16, overflow: 'hidden' },
    logsSection: { marginTop: 20 },
    logRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
    },
    logWeight: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    logBf: { fontSize: 12, color: '#22C55E', marginTop: 2 },
    logNotes: { fontSize: 12, color: '#555', marginTop: 2 },
    logDate: { fontSize: 12, color: '#555' },
});

const chartStyles = StyleSheet.create({
    container: { backgroundColor: '#141414', borderRadius: 16, padding: 16, marginTop: 16 },
    title: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 16 },
    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 110 },
    barCol: { flex: 1, alignItems: 'center', gap: 4 },
    bar: { width: '100%', borderRadius: 4, minHeight: 10 },
    barValue: { fontSize: 9, color: '#22C55E', fontWeight: '700', height: 14 },
    barLabel: { fontSize: 9, color: '#555' },
    legend: { marginTop: 12, alignItems: 'center' },
    legendText: { fontSize: 12, color: '#555' },
});

const cardStyles = StyleSheet.create({
    container: {
        backgroundColor: '#141414', borderRadius: 16, padding: 16,
        borderWidth: 1, marginBottom: 4,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    title: { fontSize: 15, fontWeight: '700' },
    message: { color: '#AAA', fontSize: 13, lineHeight: 18 },
    adjustment: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 12, padding: 10, borderRadius: 8,
    },
    adjustmentText: { fontSize: 13, fontWeight: '600', flex: 1 },
});

const statStyles = StyleSheet.create({
    row: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
    },
    label: { color: '#888', fontSize: 14 },
    right: { alignItems: 'flex-end' },
    value: { color: '#FFF', fontSize: 15, fontWeight: '600' },
    sub: { color: '#555', fontSize: 11, marginTop: 2 },
});

const modalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    handle: { width: 36, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 6 },
    hint: { fontSize: 13, color: '#555', marginBottom: 20, lineHeight: 18 },
    label: { fontSize: 13, color: '#888', marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14,
        color: '#FFF', fontSize: 16, borderWidth: 1, borderColor: '#2A2A2A',
    },
    notesInput: { height: 72, textAlignVertical: 'top' },
    submitBtn: {
        backgroundColor: '#22C55E', borderRadius: 14, padding: 16,
        alignItems: 'center', marginTop: 24,
    },
    btnDisabled: { opacity: 0.6 },
    submitText: { color: '#000', fontWeight: '800', fontSize: 16 },
    cancelBtn: { alignItems: 'center', marginTop: 14 },
    cancelText: { color: '#555', fontSize: 15 },
});
