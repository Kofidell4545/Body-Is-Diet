import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface DayTabBarProps {
    selectedDay: number;
    onSelectDay: (day: number) => void;
}

function getTodayIndex(): number {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
}

export default function DayTabBar({ selectedDay, onSelectDay }: DayTabBarProps) {
    const today = getTodayIndex();

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {DAY_LABELS.map((label, index) => {
                const isActive = index === selectedDay;
                const isToday = index === today;

                return (
                    <TouchableOpacity
                        key={label}
                        style={[styles.pill, isActive && styles.pillActive]}
                        onPress={() => onSelectDay(index)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.label, isActive && styles.labelActive]}>
                            {label}
                        </Text>
                        {isToday && <View style={[styles.todayDot, isActive && styles.todayDotActive]} />}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 4,
        paddingVertical: 8,
    },
    pill: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#1C1C1C',
        alignItems: 'center',
        minWidth: 56,
    },
    pillActive: {
        backgroundColor: '#00E676',
        borderColor: '#00E676',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    labelActive: {
        color: '#000',
        fontWeight: '700',
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#00E676',
        marginTop: 4,
    },
    todayDotActive: {
        backgroundColor: '#000',
    },
});
