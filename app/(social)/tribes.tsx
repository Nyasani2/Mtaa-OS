import { View, Text, StyleSheet } from 'react-native';
import { TribeCard } from "@/lib/tribes/components/TribeCard";
import { useTribes } from "@/lib/tribes/hooks/useTribes";

export default function TribesScreen() {
  const { tribes } = useTribes();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tribes</Text>
      {tribes?.slice(0, 3).map((tribe: any) => (
        <TribeCard key={tribe.id} tribe={tribe} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
});
