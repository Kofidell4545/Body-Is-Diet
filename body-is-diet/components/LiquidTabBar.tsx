import {
    View, Text, TouchableOpacity, StyleSheet, Platform, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useRef, useEffect } from 'react';

type Tab = {
    name: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconFocused: keyof typeof Ionicons.glyphMap;
    isCenter?: boolean;
};

const TABS: Tab[] = [
    { name: 'index',    label: 'Home',    icon: 'home-outline',       iconFocused: 'home'        },
    { name: 'meals',    label: 'Meals',   icon: 'restaurant-outline',  iconFocused: 'restaurant'  },
    { name: 'log',      label: 'Log',     icon: 'add',                 iconFocused: 'add',   isCenter: true },
    { name: 'shopping', label: 'Shop',    icon: 'bag-outline',         iconFocused: 'bag'         },
    { name: 'profile',  label: 'Profile', icon: 'person-outline',      iconFocused: 'person'      },
];

// ─── Regular pill tab ─────────────────────────────────────────────────────────
function RegularTab({ tab, isActive, onPress }: { tab: Tab; isActive: boolean; onPress: () => void }) {
    const expand   = useRef(new Animated.Value(isActive ? 1 : 0)).current;
    const glowAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(expand, {
                toValue: isActive ? 1 : 0,
                useNativeDriver: false,
                tension: 90,
                friction: 11,
            }),
            Animated.timing(glowAnim, {
                toValue: isActive ? 1 : 0,
                duration: 250,
                useNativeDriver: false,
            }),
        ]).start();
    }, [isActive]);

    const pillWidth    = expand.interpolate({ inputRange: [0, 1], outputRange: [50, 110] });
    const labelOpacity = expand.interpolate({ inputRange: [0.65, 1], outputRange: [0, 1] });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
            <Animated.View style={{ width: pillWidth, overflow: 'hidden', borderRadius: 26 }}>
                <BlurView intensity={isActive ? 80 : 18} tint="dark" style={[styles.pill, isActive && styles.pillActive]}>
                    {/* Inner glass sheen */}
                    {isActive && <View style={styles.pillShine} />}
                    {/* Active green tint wash */}
                    {isActive && <View style={styles.pillGreenWash} />}

                    <View style={styles.pillContent}>
                        <Ionicons
                            name={isActive ? tab.iconFocused : tab.icon}
                            size={19}
                            color={isActive ? '#00E676' : 'rgba(255,255,255,0.40)'}
                        />
                        {isActive && (
                            <Animated.Text style={[styles.pillLabel, { opacity: labelOpacity }]}>
                                {tab.label}
                            </Animated.Text>
                        )}
                    </View>
                </BlurView>
            </Animated.View>
        </TouchableOpacity>
    );
}

// ─── Center floating log button ───────────────────────────────────────────────
function CenterLogBtn({ isActive, onPress }: { isActive: boolean; onPress: () => void }) {
    const scale  = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    const pressIn  = () => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, tension: 220 }).start();
    const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 180 }).start();

    useEffect(() => {
        Animated.timing(rotate, { toValue: isActive ? 1 : 0, duration: 280, useNativeDriver: true }).start();
    }, [isActive]);

    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

    return (
        <TouchableOpacity
            onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}
            activeOpacity={1} style={styles.centerWrapper}
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                {/* Outer glow halo */}
                <View style={[styles.haloOuter, isActive && styles.haloOuterActive]} />
                {/* Inner pulse halo */}
                <View style={[styles.haloInner, isActive && styles.haloInnerActive]} />

                <BlurView intensity={72} tint="dark" style={styles.centerBlur}>
                    <View style={[styles.centerInner, isActive && styles.centerInnerActive]}>
                        {/* Specular shine ellipse */}
                        <View style={styles.centerShine} />
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <Ionicons name="add" size={26} color={isActive ? '#000' : '#00E676'} />
                        </Animated.View>
                        {/* Inner border ring */}
                        <View style={[styles.centerRing, isActive && styles.centerRingActive]} />
                    </View>
                </BlurView>
            </Animated.View>
            <Text style={[styles.centerLabel, isActive && styles.centerLabelActive]}>Log</Text>
        </TouchableOpacity>
    );
}

// ─── Tab bar shell ────────────────────────────────────────────────────────────
export default function LiquidTabBar() {
    const router   = useRouter();
    const segments = useSegments();

    const lastSeg  = segments[segments.length - 1] ?? 'index';
    const isActive = (name: string) =>
        lastSeg === name ||
        (name === 'index' && (lastSeg === '(tabs)' || lastSeg === '' || segments.length === 1));

    const navigate = (name: string) =>
        router.navigate(`/(tabs)/${name === 'index' ? '' : name}` as never);

    const regularTabs = TABS.filter(t => !t.isCenter);

    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            <CenterLogBtn isActive={isActive('log')} onPress={() => navigate('log')} />

            {/* Bar outer shadow layer */}
            <View style={styles.shadow} />

            {/* Bar */}
            <BlurView intensity={55} tint="dark" style={styles.bar}>
                {/* Multi-layer glass surface lines */}
                <View style={styles.barTopShine} />
                <View style={styles.barInnerHighlight} />
                <View style={styles.barBottomGlow} />

                <View style={styles.innerRow}>
                    {regularTabs.map((tab, i) => (
                        <View key={tab.name} style={i === 2 ? { marginLeft: 52 } : undefined}>
                            <RegularTab
                                tab={tab}
                                isActive={isActive(tab.name)}
                                onPress={() => navigate(tab.name)}
                            />
                        </View>
                    ))}
                </View>
            </BlurView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 28 : 16,
        left: 12,
        right: 12,
        zIndex: 999,
        alignItems: 'center',
    },

    // ── Bar ──────────────────────────────────────────────────────────────────
    shadow: {
        position: 'absolute',
        bottom: 0, left: 10, right: 10, height: 60,
        borderRadius: 44,
        backgroundColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.65,
        shadowRadius: 28,
    },
    bar: {
        width: '100%',
        borderRadius: 44,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.11)',
        backgroundColor: 'rgba(10,10,10,0.70)',
    },

    // Three thin lines create layered glass depth
    barTopShine: {
        position: 'absolute', top: 0, left: 24, right: 24,
        height: 1, backgroundColor: 'rgba(255,255,255,0.30)', zIndex: 3,
    },
    barInnerHighlight: {
        position: 'absolute', top: 1, left: 32, right: 32,
        height: 1, backgroundColor: 'rgba(255,255,255,0.08)', zIndex: 3,
    },
    barBottomGlow: {
        position: 'absolute', bottom: 0, left: 40, right: 40,
        height: 1, backgroundColor: 'rgba(0,230,118,0.08)', zIndex: 3,
    },

    innerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        paddingVertical: 12,
    },

    // ── Pill ─────────────────────────────────────────────────────────────────
    pill: {
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    pillActive: {
        borderColor: 'rgba(0,230,118,0.28)',
    },
    pillShine: {
        position: 'absolute', top: 0, left: 12, right: 12,
        height: 1, backgroundColor: 'rgba(255,255,255,0.35)', zIndex: 2,
    },
    pillGreenWash: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,230,118,0.06)',
    },
    pillContent: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, zIndex: 2,
    },
    pillLabel: {
        fontSize: 13, fontWeight: '700', color: '#00E676', letterSpacing: 0.1,
    },

    // ── Center button ─────────────────────────────────────────────────────────
    centerWrapper: {
        alignItems: 'center',
        marginBottom: -26,
        zIndex: 10,
    },
    haloOuter: {
        position: 'absolute',
        width: 84, height: 84, borderRadius: 42,
        top: -12, left: -12,
        backgroundColor: 'transparent',
    },
    haloOuterActive: {
        backgroundColor: 'rgba(0,230,118,0.07)',
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.60,
        shadowRadius: 24,
    },
    haloInner: {
        position: 'absolute',
        width: 70, height: 70, borderRadius: 35,
        top: -5, left: -5,
        backgroundColor: 'transparent',
    },
    haloInnerActive: {
        backgroundColor: 'rgba(0,230,118,0.04)',
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.40,
        shadowRadius: 14,
    },
    centerBlur: {
        width: 60, height: 60, borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(0,230,118,0.50)',
    },
    centerInner: {
        flex: 1,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(8,8,8,0.60)',
        overflow: 'hidden',
    },
    centerInnerActive: { backgroundColor: '#00E676' },
    centerShine: {
        position: 'absolute',
        top: 8, left: 10,
        width: 20, height: 7,
        borderRadius: 7,
        backgroundColor: 'rgba(255,255,255,0.28)',
        transform: [{ rotate: '-15deg' }],
    },
    centerRing: {
        position: 'absolute', inset: 0, borderRadius: 30,
        borderWidth: 1.5, borderColor: 'rgba(0,230,118,0.40)',
    },
    centerRingActive: { borderColor: 'rgba(255,255,255,0.22)' },

    centerLabel: {
        fontSize: 10, fontWeight: '600',
        color: 'rgba(255,255,255,0.30)', marginTop: 5,
    },
    centerLabelActive: { color: '#00E676' },
});
