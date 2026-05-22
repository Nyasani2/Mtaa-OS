import { View, Text, StyleSheet } from 'react-native';
import { TruckCard } from "@/lib/mtruck/components/TruckCard";
import { useFleetStore } from "@/lib/mtruck/hooks/use-fleet-store";

export default function MTruckScreen() {
  const { trucks } = useFleetStore();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MTruck Fleet</Text>
      {trucks?.slice(0, 3).map((truck: any) => (
        <TruckCard key={truck.id} truck={truck} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
});
