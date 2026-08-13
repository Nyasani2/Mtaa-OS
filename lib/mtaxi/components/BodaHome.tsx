import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

interface RideOption {
  id: string;
  type: string;
  price: number;
  eta: string;
}

export default function BodaHome() {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [searching, setSearching] = useState(false);

  const options: RideOption[] = [
    { id: '1', type: 'Boda Boda', price: 150, eta: '3 min' },
    { id: '2', type: 'Tuk Tuk', price: 250, eta: '5 min' },
    { id: '3', type: 'Car', price: 500, eta: '8 min' },
  ];

  const handleBook = (option: RideOption) => {
    router.push(`/mtaxi/book?type=${encodeURIComponent(option.type)}&price=${option.price}` as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MTaxi</Text>

      <View style={styles.locationCard}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.locationText}>{pickup || 'Current Location'}</Text>
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.label}>Dropoff</Text>
        <Text style={styles.locationText}>{dropoff || 'Where to?'}</Text>
      </View>

      <Pressable
        style={styles.searchBtn}
        onPress={() => setSearching(!searching)}
      >
        <Text style={styles.searchText}>{searching ? 'Stop Search' : 'Find Ride'}</Text>
      </Pressable>

      {searching && (
        <FlatList
          data={options}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.optionCard} onPress={() => handleBook(item)}>
              <View>
                <Text style={styles.optionType}>{item.type}</Text>
                <Text style={styles.optionEta}>ETA: {item.eta}</Text>
              </View>
              <Text style={styles.optionPrice}>KES {item.price}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  locationCard: { backgroundColor: '#1a1a1a', padding: 14, borderRadius: 8, marginBottom: 8 },
  label: { fontSize: 12, color: '#888', marginBottom: 4 },
  locationText: { fontSize: 16, color: '#fff' },
  searchBtn: { backgroundColor: '#0f0', padding: 14, borderRadius: 8, alignItems: 'center', marginVertical: 12 },
  searchText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  optionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 14, borderRadius: 8, marginBottom: 8 },
  optionType: { fontSize: 16, color: '#fff', fontWeight: '600' },
  optionEta: { fontSize: 12, color: '#888', marginTop: 2 },
  optionPrice: { fontSize: 18, color: '#0f0', fontWeight: 'bold' },
});

