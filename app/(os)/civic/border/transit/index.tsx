import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { Card } from '@/components/ui/Card';
import { Text } from 'react-native';

const transitModules = [
  { route: '/(os)/civic/border/transit/corridors', label: 'Corridors', icon: '🛤️', desc: 'Trade corridor monitoring' },
  { route: '/(os)/civic/border/transit/checkpoints', label: 'Checkpoints', icon: '🚧', desc: 'Border checkpoint status' },
];

export default function TransitHub() {
  const router = useRouter();
  return (
    <SafeAreaWrapper>
      <ScreenHeader title="Transit & Corridors" subtitle="Cross-border movement tracking" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {transitModules.map(mod => (
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
