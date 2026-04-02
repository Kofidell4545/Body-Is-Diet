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
    { name: 'index',    label: 'Home',    icon: 'home-outline',        iconFocused: 'home'              },
    { name: 'meals',    label: 'Meals',   icon: 'nutrition-outline',   iconFocused: 'nutrition'         },
    { name: 'log',      label: 'Track',   icon: 'add',                 iconFocused: 'add', isCenter: true },
    { name: 'shopping', label: 'Shop',    icon: 'cart-outline',        iconFocused: 'cart'              },
    { name: 'profile',  label: 'Profile', icon: 'person-circle-outline', iconFocused: 'person-circle'  },
];

//  Regular pill tab 
function RegularTab({ tab, isActive, onPress }: { tab: Tab; isActive: boolean; onPress: () => void }) {
    const expand   = useRef(new Animated.Value(isActive ? 1 : 0)).current;
    const labelOpa = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(expand, {
                toValue: isActive ? 1 : 0,
                useNativeDriver: false,
                tension: 100,
                friction: 13,
            }),
            Animated.timing(labelOpa, {
                toValue: isActive ? 1 : 0,
                duration: isActive ? 180 : 80,
                useNativeDriver: false,
            }),
        ]).start();
    }, [isActive]);

    const pillWidth = expand.interpolate({ inputRange: [0, 1], outputRange: [48, 108] });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
            <Animated.View style={{ width: pillWidth, overflow: 'hidden', borderRadius: 28 }}>
                <BlurView
                    intensity={isActive ? 90 : 0}
                    tint="dark"
                    style={[styles.pill, isActive && styles.pillActive]}
                >
                    {/* Top specular line — only on active */}
                    {isActive && <View style={styles.pillTopShine} />}
                    {/* Green ambient wash */}
                    {isActive && <View style={styles.pillGreenWash} />}

                    <View style={styles.pillContent}>
                        <Ionicons
                            name={isActive ? tab.iconFocused : tab.icon}
                            size={20}
                            color={isActive ? '#00E676' : 'rgba(255,255,255,0.32)'}
                        />
                        {isActive && (
                            <Animated.Text style={[styles.pillLabel, { opacity: labelOpa }]}>
                                {tab.label}
                            </Animated.Text>
                        )}
                    </View>
                </BlurView>
            </Animated.View>
        </TouchableOpacity>
    );
}

//  Center floating track button 
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

    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
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
                {/* Outer ambient glow */}
                <Animated.View style={[styles.halo, { opacity: haloOpacity }]} />

                <BlurView intensity={80} tint="dark" style={styles.centerBlur}>
                    <View style={[styles.centerInner, isActive && styles.centerInnerActive]}>
                        {/* Specular ellipse highlight */}
                        <View style={styles.centerShine} />
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <Ionicons name="add" size={26} color={isActive ? '#000' : '#00E676'} />
                        </Animated.View>
                        {/* Inner border ring */}
                        <View style={[styles.centerRing, isActive && styles.centerRingActive]} />
                    </View>
                </BlurView>
            </Animated.View>
            <Text style={[styles.centerLabel, isActive && styles.centerLabelActive]}>Track</Text>
        </TouchableOpacity>
    );
}

//  Tab bar shell 
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
            <CenterTrackBtn isActive={isActive('log')} onPress={() => navigate('log')} />

            {/* Deep shadow beneath bar */}
            <View style={styles.barShadow} />

            {/* Bar */}
            <BlurView intensity={72} tint="dark" style={styles.bar}>
                {/* Layered glass surfaces */}
                <View style={styles.barTopShine} />
                <View style={styles.barTopShineSoft} />
                <View style={styles.barBottomAccent} />

                <View style={styles.innerRow}>
                    {regularTabs.map((tab, i) => (
                        <View key={tab.name} style={i === 2 ? { marginLeft: 56 } : undefined}>
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

//  Styles 
const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 28 : 16,
        left: 12,
        right: 12,
        zIndex: 999,
        alignItems: 'center',
    },

    //  Bar 
    barShadow: {
        position: 'absolute',
        bottom: 0, left: 8, right: 8, height: 64,
        borderRadius: 44,
        backgroundColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.72,
        shadowRadius: 32,
    },
    bar: {
        width: '100%',
        borderRadius: 44,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
        backgroundColor: 'rgba(8,8,8,0.78)',
    },

    // Three stacked lines give the surface convincing depth
    barTopShine: {
        position: 'absolute', top: 0, left: 20, right: 20,
        height: 1, backgroundColor: 'rgba(255,255,255,0.32)', zIndex: 4,
    },
    barTopShineSoft: {
        position: 'absolute', top: 1, left: 36, right: 36,
        height: 1, backgroundColor: 'rgba(255,255,255,0.07)', zIndex: 4,
    },
    barBottomAccent: {
        position: 'absolute', bottom: 0, left: 60, right: 60,
        height: 1, backgroundColor: 'rgba(0,230,118,0.10)', zIndex: 4,
    },

    innerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 6,
        paddingVertical: 11,
    },

    //  Pill 
    pill: {
        height: 48,
        borderRadius: 28,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'transparent',
    },
    pillActive: {
        borderColor: 'rgba(0,230,118,0.22)',
        backgroundColor: 'rgba(0,230,118,0.05)',
    },
    pillTopShine: {
        position: 'absolute', top: 0, left: 10, right: 10,
        height: 1, backgroundColor: 'rgba(255,255,255,0.30)', zIndex: 2,
    },
    pillGreenWash: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,230,118,0.06)',
    },
    pillContent: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, zIndex: 2,
    },
    pillLabel: {
        fontSize: 13, fontWeight: '700', color: '#00E676', letterSpacing: 0.1,
    },

    //  Center button 
    centerWrapper: {
        alignItems: 'center',
        marginBottom: -24,
        zIndex: 10,
    },
    halo: {
        position: 'absolute',
        width: 86, height: 86,
        borderRadius: 43,
        top: -13, left: -13,
        backgroundColor: 'rgba(0,230,118,0.09)',
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.65,
        shadowRadius: 22,
    },
    centerBlur: {
        width: 60, height: 60, borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(0,230,118,0.45)',
    },
    centerInner: {
        flex: 1,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(6,6,6,0.65)',
        overflow: 'hidden',
    },
    centerInnerActive: { backgroundColor: '#00E676' },
    centerShine: {
        position: 'absolute',
        top: 9, left: 11,
        width: 18, height: 6,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.30)',
        transform: [{ rotate: '-14deg' }],
    },
    centerRing: {
        position: 'absolute', inset: 0, borderRadius: 30,
        borderWidth: 1.5, borderColor: 'rgba(0,230,118,0.35)',
    },
    centerRingActive: { borderColor: 'rgba(255,255,255,0.18)' },

    centerLabel: {
        fontSize: 10, fontWeight: '600',
        color: 'rgba(255,255,255,0.28)', marginTop: 5,
    },
    centerLabelActive: { color: '#00E676' },
});
