import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = {
    name: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconFocused: keyof typeof Ionicons.glyphMap;
    isCenter?: boolean;
};

const TABS: Tab[] = [
    { name: 'index', label: 'Home', icon: 'home-outline', iconFocused: 'home' },
    { name: 'meals', label: 'Meals', icon: 'restaurant-outline', iconFocused: 'restaurant' },
    { name: 'log', label: 'Log', icon: 'add', iconFocused: 'add', isCenter: true },
    { name: 'shopping', label: 'Shop', icon: 'bag-outline', iconFocused: 'bag' },
    { name: 'profile', label: 'Profile', icon: 'person-outline', iconFocused: 'person' },
];

// ─── Pill Tab ─────────────────────────────────────────────────────────────────
function RegularTab({
    tab,
    isActive,
    onPress,
}: {
    tab: Tab;
    isActive: boolean;
    onPress: () => void;
}) {
    const expand = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(expand, {
            toValue: isActive ? 1 : 0,
            useNativeDriver: false,
            tension: 80,
            friction: 10,
        }).start();
    }, [isActive]);

    const pillWidth = expand.interpolate({
        inputRange: [0, 1],
        outputRange: [52, 112],
    });
    const labelOpacity = expand.interpolate({
        inputRange: [0.6, 1],
        outputRange: [0, 1],
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
            <Animated.View style={{ width: pillWidth, overflow: 'hidden', borderRadius: 26 }}>
                <BlurView
                    intensity={isActive ? 70 : 25}
                    tint="default"
                    style={[styles.pillFallback, isActive && styles.pillFallbackActive]}
                >
                    <View style={styles.pillContent}>
                        <Ionicons
                            name={isActive ? tab.iconFocused : tab.icon}
                            size={20}
                            color={isActive ? '#00E676' : 'rgba(255,255,255,0.6)'}
                        />
                        {isActive && (
                            <Animated.Text style={[styles.pillLabel, { opacity: labelOpacity }]}>
                                {tab.label}
                            </Animated.Text>
                        )}
                    </View>
                    {/* Active green border glow */}
                    {isActive && <View style={styles.pillActiveBorder} />}
                </BlurView>
            </Animated.View>
        </TouchableOpacity>
    );
}

// ─── Center Log Button ────────────────────────────────────────────────────────
function CenterLogBtn({ isActive, onPress }: { isActive: boolean; onPress: () => void }) {
    const scale = useRef(new Animated.Value(1)).current;
    const pressIn = () => Animated.spring(scale, { toValue: 0.90, useNativeDriver: true, tension: 200 }).start();
    const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 180 }).start();

    return (
        <TouchableOpacity
            onPressIn={pressIn}
            onPressOut={pressOut}
            onPress={onPress}
            activeOpacity={1}
            style={styles.centerWrapper}
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                {/* Halo glow ring */}
                <View style={[styles.halo, isActive && styles.haloActive]} />

                <BlurView intensity={60} tint="dark" style={styles.centerFallback}>
                    <View style={[styles.centerFallbackInner, isActive && styles.centerFallbackInnerActive]}>
                        <View style={styles.centerShine} />
                        <Ionicons name="add" size={28} color={isActive ? '#000' : '#00E676'} />
                        {/* Inset green border ring */}
                        <View style={[styles.centerRing, isActive && styles.centerRingActive]} />
                    </View>
                </BlurView>
            </Animated.View>

            <Text style={styles.centerLabel}>Log</Text>
        </TouchableOpacity>
    );
}

// ─── Tab Bar Shell ────────────────────────────────────────────────────────────
export default function LiquidTabBar() {
    const router = useRouter();
    const segments = useSegments();

    const lastSeg = segments[segments.length - 1] ?? 'index';
    const isActive = (name: string) =>
        lastSeg === name ||
        (name === 'index' && (lastSeg === '(tabs)' || lastSeg === '' || segments.length === 1));

    const navigate = (name: string) => {
        router.navigate(`/(tabs)/${name === 'index' ? '' : name}` as never);
    };

    const regularTabs = TABS.filter(t => !t.isCenter);

    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            {/* Floating Log button — overlaps down into the bar */}
            <CenterLogBtn isActive={isActive('log')} onPress={() => navigate('log')} />

            {/* ── Bar shell ── */}
            <BlurView intensity={40} tint="dark" style={styles.barFallback}>
                {/* Shared top-edge shine across the whole bar */}
                <View style={styles.topShine} />
                <View style={styles.innerRow}>
                    {regularTabs.map((tab, i) => {
                        const isRight = i >= 2;
                        return (
                            <View key={tab.name} style={isRight && i === 2 ? { marginLeft: 50 } : undefined}>
                                <RegularTab
                                    tab={tab}
                                    isActive={isActive(tab.name)}
                                    onPress={() => navigate(tab.name)}
                                />
                            </View>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 18,
        left: 14,
        right: 14,
        zIndex: 999,
        alignItems: 'center',
    },

    // ── Bar ──────────────────────────────────────────────────────────────────
    barFallback: {
        width: '100%',
        borderRadius: 48,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(12,12,12,0.65)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.55,
        shadowRadius: 24,
        elevation: 24,
    },

    topShine: {
        position: 'absolute',
        top: 0,
        left: 30,
        right: 30,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.22)',
        zIndex: 2,
    },
    innerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        paddingVertical: 14,
    },

    // ── Pill ─────────────────────────────────────────────────────────────────

    pillFallback: {
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    pillFallbackActive: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,0.22)',
    },
    pillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        zIndex: 2,
    },
    pillActiveBorder: {
        position: 'absolute',
        inset: 0,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.30)',
        // Inner specular ring — gives the liquid glass edge
    },
    pillLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#00E676',
        letterSpacing: 0.2,
    },

    // ── Center Log button ─────────────────────────────────────────────────────
    centerWrapper: {
        alignItems: 'center',
        marginBottom: -24,
        zIndex: 10,
    },
    halo: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'transparent',
        top: -10,
        left: -10,
    },
    haloActive: {
        backgroundColor: 'rgba(0,230,118,0.10)',
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 22,
    },

    // Blur circle
    centerFallback: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(0,230,118,0.45)',
    },
    centerFallbackInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(10,10,10,0.55)',
        overflow: 'hidden',
    },
    centerFallbackInnerActive: {
        backgroundColor: '#00E676',
    },
    centerShine: {
        position: 'absolute',
        top: 7,
        left: 9,
        width: 22,
        height: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.22)',
        transform: [{ rotate: '-12deg' }],
    },
    centerRing: {
        position: 'absolute',
        inset: 0,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: 'rgba(0,230,118,0.45)',
    },
    centerRingActive: {
        borderColor: 'rgba(255,255,255,0.30)',
    },

    centerLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.40)',
        marginTop: 4,
    },
});