import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/api';
import { UserPreferences } from '../../types';
import { router } from 'expo-router';

// ── Label maps ────────────────────────────────────────────────────────────────
const GOAL_LABEL: Record<string, string> = {
    lose_weight: 'Lose Weight',
    gain_muscle: 'Gain Muscle',
    gain_weight: 'Gain Weight',
    maintain: 'Maintain',
};

const GOAL_COLOR: Record<string, string> = {
    lose_weight: '#FF6B6B',
    gain_muscle: '#00E676',
    gain_weight: '#FFB347',
    maintain: '#64B5F6',
};

const ACTIVITY_LABEL: Record<string, string> = {
    sedentary: 'Sedentary',
    light: 'Lightly Active',
    moderate: 'Moderately Active',
    very_active: 'Very Active',
    athlete: 'Athlete',
};

const ACTIVITY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    sedentary: 'bed-outline',
    light: 'walk-outline',
    moderate: 'bicycle-outline',
    very_active: 'fitness-outline',
    athlete: 'barbell-outline',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name: string | null): string {
    if (!name) return '?';
    return name
        .trim()
        .split(' ')
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');
}

function getBMI(weight_kg: number, height_cm: number): string {
    const h = height_cm / 100;
    const bmi = weight_kg / (h * h);
    return bmi.toFixed(1);
}

function getBMILabel(bmiStr: string): string {
    const bmi = parseFloat(bmiStr);
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Healthy';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statValue}>
                {value}
                {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
            </Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function InfoRow({
    icon, label, value,
}: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
                <Ionicons name={icon} size={18} color="#00E676" />
            </View>
            <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

function Chip({ label }: { label: string }) {
    return (
        <View style={styles.chip}>
            <Text style={styles.chipText}>{label}</Text>
        </View>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function Profile() {
    const { userName, signOut } = useAuth();
    const [prefs, setPrefs] = useState<UserPreferences | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        userApi.getPreferences()
            .then(data => setPrefs(data))
            .catch(() => setError('Could not load preferences'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleLogout = async () => {
        await signOut();
        router.replace('/splash');
    };

    const goalColor = prefs ? (GOAL_COLOR[prefs.goal] ?? '#00E676') : '#00E676';
    const bmi = prefs ? getBMI(prefs.weight_kg, prefs.height_cm) : null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>Profile</Text>
                </View>

                {/* Avatar + Name */}
                <View style={styles.avatarSection}>
                    <View style={[styles.avatar, { borderColor: goalColor }]}>
                        <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                    </View>
                    <Text style={styles.name}>{userName ?? 'You'}</Text>
                    {prefs && (
                        <View style={[styles.goalBadge, { backgroundColor: goalColor + '22', borderColor: goalColor + '55' }]}>
                            <View style={[styles.goalDot, { backgroundColor: goalColor }]} />
                            <Text style={[styles.goalText, { color: goalColor }]}>
                                {GOAL_LABEL[prefs.goal] ?? prefs.goal}
                            </Text>
                        </View>
                    )}
                </View>

                {isLoading && (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator color="#00E676" />
                    </View>
                )}

                {error && (
                    <View style={styles.errorCard}>
                        <Ionicons name="alert-circle-outline" size={16} color="#FF5252" style={{ marginRight: 8 }} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {prefs && (
                    <>
                        {/* Stats row */}
                        <View style={styles.statsRow}>
                            <StatCard label="Weight" value={prefs.weight_kg.toString()} unit="kg" />
                            {prefs.target_weight_kg ? (
                                <StatCard label="Target" value={prefs.target_weight_kg.toString()} unit="kg" />
                            ) : (
                                <StatCard label="Height" value={prefs.height_cm.toString()} unit="cm" />
                            )}
                            {bmi && <StatCard label={getBMILabel(bmi)} value={bmi} />}
                        </View>

                        {/* Body info */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Body Info</Text>
                            <View style={styles.infoCard}>
                                <InfoRow
                                    icon={ACTIVITY_ICON[prefs.activity_level] ?? 'body-outline'}
                                    label="Activity Level"
                                    value={ACTIVITY_LABEL[prefs.activity_level] ?? prefs.activity_level}
                                />
                                <View style={styles.divider} />
                                <InfoRow
                                    icon="restaurant-outline"
                                    label="Meals Per Day"
                                    value={prefs.meals_per_day === 5 ? '3 (2 mains + snack)' : `${prefs.meals_per_day} meals`}
                                />
                                <View style={styles.divider} />
                                <InfoRow
                                    icon="person-outline"
                                    label="Age"
                                    value={`${prefs.age} years`}
                                />
                                <View style={styles.divider} />
                                <InfoRow
                                    icon="male-female-outline"
                                    label="Gender"
                                    value={prefs.gender.charAt(0).toUpperCase() + prefs.gender.slice(1)}
                                />
                                {prefs.height_cm && prefs.target_weight_kg && (
                                    <>
                                        <View style={styles.divider} />
                                        <InfoRow
                                            icon="resize-outline"
                                            label="Height"
                                            value={`${prefs.height_cm} cm`}
                                        />
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Food preferences */}
                        {(prefs.proteins?.length > 0 || prefs.carbs?.length > 0) && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Food Preferences</Text>
                                <View style={styles.infoCard}>
                                    {prefs.proteins?.length > 0 && (
                                        <>
                                            <Text style={styles.prefLabel}>Preferred Proteins</Text>
                                            <View style={styles.chipsRow}>
                                                {prefs.proteins.map(p => <Chip key={p} label={p} />)}
                                            </View>
                                        </>
                                    )}
                                    {prefs.carbs?.length > 0 && (
                                        <>
                                            {prefs.proteins?.length > 0 && <View style={styles.divider} />}
                                            <Text style={styles.prefLabel}>Preferred Carbs</Text>
                                            <View style={styles.chipsRow}>
                                                {prefs.carbs.map(c => <Chip key={c} label={c} />)}
                                            </View>
                                        </>
                                    )}
                                    {prefs.avoid_foods && prefs.avoid_foods.length > 0 && (
                                        <>
                                            <View style={styles.divider} />
                                            <Text style={styles.prefLabel}>Avoiding</Text>
                                            <View style={styles.chipsRow}>
                                                {prefs.avoid_foods.map(f => (
                                                    <View key={f} style={[styles.chip, styles.chipAvoid]}>
                                                        <Text style={[styles.chipText, styles.chipTextAvoid]}>{f}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </>
                                    )}
                                </View>
                            </View>
                        )}
                    </>
                )}

                {/* Logout */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                        <Ionicons name="log-out-outline" size={18} color="#FF5252" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    scroll: { padding: 24, paddingBottom: 120 },

    header: {
        marginBottom: 28,
    },
    pageTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },

    // Avatar
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        backgroundColor: 'rgba(0,230,118,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    name: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
        marginBottom: 10,
    },
    goalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    goalDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    goalText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.2,
    },

    // Loading / error
    loadingWrap: { alignItems: 'center', paddingVertical: 40 },
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,82,82,0.08)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,82,82,0.18)',
    },
    errorText: { color: '#FF5252', fontSize: 14, flex: 1 },

    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    statUnit: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.4)',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.35)',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Sections
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    infoCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
        paddingHorizontal: 16,
    },

    // Info rows
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
    },
    infoIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: 'rgba(0,230,118,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoText: { flex: 1 },
    infoLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },

    // Food preferences
    prefLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 14,
        marginBottom: 10,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    chip: {
        backgroundColor: 'rgba(0,230,118,0.10)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,230,118,0.20)',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#00E676',
    },
    chipAvoid: {
        backgroundColor: 'rgba(255,82,82,0.08)',
        borderColor: 'rgba(255,82,82,0.20)',
    },
    chipTextAvoid: {
        color: '#FF5252',
    },

    // Logout
    logoutSection: {
        marginTop: 12,
        marginBottom: 8,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,82,82,0.25)',
        backgroundColor: 'rgba(255,82,82,0.06)',
    },
    logoutText: {
        color: '#FF5252',
        fontWeight: '700',
        fontSize: 15,
    },
});
