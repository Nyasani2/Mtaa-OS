import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { Card } from '@/components/ui/Card';
import { Text } from 'react-native';

const inspectionModules = [
  { route: '/(os)/civic/border/inspection/inspections', label: 'Inspections', icon: '🔍', desc: 'Physical inspections & reports' },
  { route: '/(os)/civic/border/inspection/risk', label: 'Risk Scoring', icon: '⚠️', desc: 'AI-powered risk assessment' },
];

export default function InspectionHub() {
  const router = useRouter();
  return (
    <SafeAreaWrapper>
      <ScreenHeader title="Inspection & Risk" subtitle="Border inspection management" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {inspectionModules.map(mod => (
          <TouchableOpacity key={mod.route} onPress={() => router.push(mod.route)}>
            <Card style={styles.moduleCard}>
              <Text style={styles.icon}>{mod.icon}</Text>
              <View style={styles.textContainer}>
                <Text style={styles.label}>{mod.label}</Text>
                <Text style={styles.desc}>{mod.desc}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  moduleCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12, gap: 12 },
  icon: { fontSize: 28 },
  textContainer: { flex: 1 },
  label: { color: '#e2e8f0', fontSize: 16, fontWeight: '700' },
  desc: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
});
