import { View, Text, StyleSheet } from 'react-native';
import { ImmigrationNav } from "@/lib/domains/civic/immigration/components/ImmigrationNav";
import { useImmigrationStats } from "@/lib/domains/civic/immigration/hooks/useImmigrationStats";

export default function CivicScreen() {
  const { stats } = useImmigrationStats();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Civic Services</Text>
      <ImmigrationNav alertCount={stats?.alerts || 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
});
