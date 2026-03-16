import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Log() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Log Meal</Text>
            <Text style={styles.text}>Track what you eat here.</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24, justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: '800', color: '#FFF', marginBottom: 10 },
    text: { color: '#555', fontSize: 16 },
});
