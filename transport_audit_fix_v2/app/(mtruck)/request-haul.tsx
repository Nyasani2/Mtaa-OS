import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useLocation } from '@/lib/transport/hooks/useLocation';
import { createHaul, getWalletBalance } from '@/lib/transport/services/ride.service';

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RequestHaulScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { position, address } = useLocation();

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState('');
  const [dropoffLng, setDropoffLng] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [weight, setWeight] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (address) setPickupAddress(address); }, [address]);
  useEffect(() => {
    if (user?.id) getWalletBalance(user.id).then((b: any) => setWalletBalance(Number(b.available_balance || 0)));
  }, [user?.id]);

  const distanceKm = position && dropoffLat && dropoffLng
    ? haversine(position.latitude, position.longitude, parseFloat(dropoffLat), parseFloat(dropoffLng))
    : 0;
  const rate = 80; // KES per km for haul
  const fareEstimate = Math.round(rate * distanceKm);

  const handleSubmit = async () => {
    if (!user?.id) { Alert.alert('Not logged in'); return; }
    if (!position) { Alert.alert('Location unavailable'); return; }
    if (!dropoffLat || !dropoffLng) { Alert.alert('Enter dropoff coordinates'); return; }
    if (paymentMethod === 'wallet' && walletBalance < fareEstimate) {
      Alert.alert('Insufficient balance'); return;
    }

    setLoading(true);
    try {
      const haul = await createHaul({
        shipper_id: user.id,
        pickup_lat: position.latitude,
        pickup_lng: position.longitude,
        dropoff_lat: parseFloat(dropoffLat),
        dropoff_lng: parseFloat(dropoffLng),
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        cargo_type: cargoType,
        weight_kg: weight ? parseFloat(weight) : undefined,
        payment_method: paymentMethod,
        fare_estimate: fareEstimate,
      });
      Alert.alert('Haul Requested!', `ID: ${haul.id}\nFare: KES ${fareEstimate}`);
      router.push('/(mtruck)');
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Request Haul</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Pickup</Text>
        <TextInput style={styles.input} value={pickupAddress} onChangeText={setPickupAddress} placeholder="Pickup location" placeholderTextColor="#555" />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Dropoff Address</Text>
        <TextInput style={styles.input} value={dropoffAddress} onChangeText={setDropoffAddress} placeholder="Dropoff location" placeholderTextColor="#555" />
        <Text style={styles.label}>Dropoff Latitude</Text>
        <TextInput style={styles.input} value={dropoffLat} onChangeText={setDropoffLat} placeholder="Latitude" placeholderTextColor="#555" keyboardType="numeric" />
        <Text style={styles.label}>Dropoff Longitude</Text>
        <TextInput style={styles.input} value={dropoffLng} onChangeText={setDropoffLng} placeholder="Longitude" placeholderTextColor="#555" keyboardType="numeric" />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Cargo Type</Text>
        <TextInput style={styles.input} value={cargoType} onChangeText={setCargoType} placeholder="e.g. Cement, Furniture" placeholderTextColor="#555" />
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="Weight in kg" placeholderTextColor="#555" keyboardType="numeric" />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Payment</Text>
        {['wallet', 'cash', 'mpesa'].map((m) => (
          <TouchableOpacity key={m} style={[styles.payRow, paymentMethod === m && styles.payActive]} onPress={() => setPaymentMethod(m)}>
            <Text style={styles.payText}>{m.toUpperCase()}</Text>
            {m === 'wallet' && <Text style={styles.paySub}>Balance: KES {walletBalance.toLocaleString()}</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {distanceKm > 0 && (
        <Text style={styles.estimate}>Distance: {distanceKm.toFixed(1)} km • Estimate: KES {fareEstimate}</Text>
      )}

      <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Submitting...' : `Request Haul — KES ${fareEstimate}`}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10 },
  label: { color: '#8892b0', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  input: { color: '#fff', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 6, marginBottom: 8 },
  payRow: { padding: 10, borderRadius: 8, marginBottom: 6, backgroundColor: '#16213e' },
  payActive: { backgroundColor: '#0f3460', borderWidth: 1, borderColor: '#e94560' },
  payText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  paySub: { color: '#8892b0', fontSize: 11, marginTop: 2 },
  estimate: { color: '#e94560', fontSize: 16, fontWeight: '700', textAlign: 'center', marginVertical: 12 },
  btn: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  disabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
