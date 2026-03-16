import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.name}>David</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Today's Calories</Text>
          <Text style={styles.cardValue}>0 <Text style={styles.cardUnit}>/ 2,400 kcal</Text></Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.miniCard, { flex: 1 }]}>
            <Text style={styles.miniLabel}>Protein</Text>
            <Text style={styles.miniValue}>0g</Text>
          </View>
          <View style={[styles.miniCard, { flex: 1 }]}>
            <Text style={styles.miniLabel}>Carbs</Text>
            <Text style={styles.miniValue}>0g</Text>
          </View>
          <View style={[styles.miniCard, { flex: 1 }]}>
            <Text style={styles.miniLabel}>Fats</Text>
            <Text style={styles.miniValue}>0g</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today's Meal Plan</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🥗</Text>
          <Text style={styles.emptyText}>Complete your onboarding to get a personalized AI meal plan.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { padding: 24, paddingBottom: 120 },
  header: { marginBottom: 28 },
  greeting: { fontSize: 15, color: '#666', marginBottom: 4 },
  name: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  card: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1C1C1C',
  },
  cardLabel: { color: '#555', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  cardValue: { fontSize: 36, fontWeight: '800', color: '#00E676' },
  cardUnit: { fontSize: 16, color: '#444', fontWeight: '400' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  miniCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1C1C1C',
  },
  miniLabel: { color: '#555', fontSize: 11, fontWeight: '600', marginBottom: 6 },
  miniValue: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 16 },
  emptyState: {
    backgroundColor: '#0F0F0F',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderStyle: 'dashed',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#444', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});