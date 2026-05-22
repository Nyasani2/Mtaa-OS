import { View, Text, StyleSheet } from 'react-native';
import { RideCard } from "@/lib/mtaxi/components/RideCard";
import { useRides } from "@/lib/mtaxi/hooks/useRides";

export default function MTaxiScreen() {
  const { rides } = useRides();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MTaxi</Text>
      {rides?.slice(0, 3).map((ride: any) => (
        <RideCard key={ride.id} ride={ride} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
});
