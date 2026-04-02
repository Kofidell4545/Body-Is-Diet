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
};

const LEFT_TABS: Tab[] = [
    { name: 'index', label: 'Home',  icon: 'home-outline', iconFocused: 'home' },
    { name: 'meals', label: 'Meals', icon: 'leaf-outline',  iconFocused: 'leaf' },
];
const RIGHT_TABS: Tab[] = [
    { name: 'shopping', label: 'Shop',    icon: 'cart-outline',          iconFocused: 'cart'          },
    { name: 'profile',  label: 'Profile', icon: 'person-circle-outline', iconFocused: 'person-circle' },
];

// ── Regular tab — fixed width, label beneath icon ─────────────────────────────
function RegularTab({ tab, isActive, onPress }: { tab: Tab; isActive: boolean; onPress: () => void }) {
    const glow = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(glow, {
            toValue: isActive ? 1 : 0,
            duration: 220,
            useNativeDriver: false,
        }).start();
    }, [isActive]);

    const bgColor = glow.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(0,230,118,0)', 'rgba(0,230,118,0.12)'],
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.tabItem}>
            <Animated.View style={[styles.iconWrap, { backgroundColor: bgColor },
                isActive && styles.iconWrapActive]}>
                {/* Specular line on active */}
                {isActive && <View style={styles.iconShine} />}
                <Ionicons
                    name={isActive ? tab.iconFocused : tab.icon}
                    size={22}
                    color={isActive ? '#00E676' : 'rgba(255,255,255,0.30)'}
                />
            </Animated.View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
            </Text>
        </TouchableOpacity>
    );
}

// ── Center floating track button ──────────────────────────────────────────────
function CenterTrackBtn({ isActive, onPress }: { isActive: boolean; onPress: () => void }) {
    const scale  = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(isActive ? 1 : 0)).current;
    const glow   = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    const pressIn  = () => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, tension: 220 }).start();
    const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 180 }).start();

    useEffect(() => {
        Animated.parallel([
            Animated.timing(rotate, { toValue: isActive ? 1 : 0, duration: 300, useNativeDriver: true }),
            Animated.timing(glow,   { toValue: isActive ? 1 : 0, duration: 300, useNativeDriver: false }),
        ]).start();
    }, [isActive]);

    const spin        = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
    const haloOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    return (
        <TouchableOpacity
            onPressIn={pressIn}
            onPressOut={pressOut}
            onPress={onPress}
            activeOpacity={1}
            style={styles.centerWrapper}
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                <Animated.View style={[styles.halo, { opacity: haloOpacity }]} />

                <BlurView intensity={80} tint="dark" style={styles.centerBlur}>
                    <View style={[styles.centerInner, isActive && styles.centerInnerActive]}>
                        <View style={styles.centerShine} />
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <Ionicons name="add" size={26} color={isActive ? '#000' : '#00E676'} />
                        </Animated.View>
                        <View style={[styles.centerRing, isActive && styles.centerRingActive]} />
                    </View>
                </BlurView>
            </Animated.View>
            <Text style={[styles.centerLabel, isActive && styles.centerLabelActive]}>Track</Text>
        </TouchableOpacity>
    );
}

// ── Tab bar shell ─────────────────────────────────────────────────────────────
export default function LiquidTabBar() {
    const router   = useRouter();
    const segments = useSegments();

    const lastSeg  = segments[segments.length - 1] ?? 'index';
    const isActive = (name: string) =>
        lastSeg === name ||
        (name === 'index' && (lastSeg === '(tabs)' || lastSeg === '' || segments.length === 1));

    const navigate = (name: string) =>
        router.navigate(`/(tabs)/${name === 'index' ? '' : name}` as never);

    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            <CenterTrackBtn isActive={isActive('log')} onPress={() => navigate('log')} />

            <View style={styles.barShadow} />

            <BlurView intensity={72} tint="dark" style={styles.bar}>
                <View style={styles.barTopShine} />
                <View style={styles.barTopShineSoft} />
                <View style={styles.barBottomAccent} />

                <View style={styles.innerRow}>
                    {/* Left pair */}
                    <View style={styles.tabGroup}>
                        {LEFT_TABS.map(tab => (
                            <RegularTab
                                key={tab.name}
                                tab={tab}
                                isActive={isActive(tab.name)}
                                onPress={() => navigate(tab.name)}
                            />
                        ))}
                    </View>

                    {/* Center gap — matches the 60px button footprint */}
                    <View style={styles.centerGap} />

                    {/* Right pair */}
                    <View style={styles.tabGroup}>
                        {RIGHT_TABS.map(tab => (
                            <RegularTab
                                key={tab.name}
                                tab={tab}
                                isActive={isActive(tab.name)}
                                onPress={() => navigate(tab.name)}
                            />
                        ))}
                    </View>
                </View>
            </BlurView>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 24 : 14,
        left: 16,
        right: 16,
        zIndex: 999,
        alignItems: 'center',
    },

    // Bar shell
    barShadow: {
        position: 'absolute',
        bottom: 0, left: 8, right: 8, height: 72,
        borderRadius: 44,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.7,
        shadowRadius: 28,
    },
    bar: {
        width: '100%',
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
        backgroundColor: 'rgba(8,8,8,0.80)',
    },

    // Glass surface lines
    barTopShine: {
        position: 'absolute', top: 0, left: 24, right: 24,
        height: 1, backgroundColor: 'rgba(255,255,255,0.28)', zIndex: 4,
    },
    barTopShineSoft: {
        position: 'absolute', top: 1, left: 40, right: 40,
        height: 1, backgroundColor: 'rgba(255,255,255,0.07)', zIndex: 4,
    },
    barBottomAccent: {
        position: 'absolute', bottom: 0, left: 60, right: 60,
        height: 1, backgroundColor: 'rgba(0,230,118,0.08)', zIndex: 4,
    },

    // Row layout
    innerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingVertical: 8,
    },
    tabGroup: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    centerGap: {
        width: 68,
    },

    // Tab item — icon + label stacked, fixed footprint
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingHorizontal: 4,
    },
    iconWrap: {
        width: 44,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    iconWrapActive: {
        borderWidth: 1,
        borderColor: 'rgba(0,230,118,0.20)',
    },
    iconShine: {
        position: 'absolute',
        top: 4, left: 8,
        width: 14, height: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.25)',
        transform: [{ rotate: '-10deg' }],
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: 0.1,
    },
    tabLabelActive: {
        color: '#00E676',
    },

    // Center button
    centerWrapper: {
        alignItems: 'center',
        marginBottom: -20,
        zIndex: 10,
    },
    halo: {
        position: 'absolute',
        width: 84, height: 84,
        borderRadius: 42,
        top: -12, left: -12,
        backgroundColor: 'rgba(0,230,118,0.08)',
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
    },
    centerBlur: {
        width: 60, height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(0,230,118,0.45)',
    },
    centerInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(6,6,6,0.65)',
        overflow: 'hidden',
    },
    centerInnerActive: { backgroundColor: '#00E676' },
    centerShine: {
        position: 'absolute',
        top: 9, left: 11,
        width: 18, height: 6,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.28)',
        transform: [{ rotate: '-14deg' }],
    },
    centerRing: {
        position: 'absolute', inset: 0,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: 'rgba(0,230,118,0.30)',
    },
    centerRingActive: { borderColor: 'rgba(255,255,255,0.15)' },
    centerLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.28)',
        marginTop: 4,
    },
    centerLabelActive: { color: '#00E676' },
});
