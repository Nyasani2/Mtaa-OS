import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useLocation } from '@/lib/transport/hooks/useLocation';
import { useTransport } from '@/lib/transport/hooks/useTransport';
import VehicleSelector from '@/lib/transport/components/VehicleSelector';
import PaymentSelector from '@/lib/transport/components/PaymentSelector';

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { position } = useLocation();
  const { createNewRide, loadWalletBalance, loading } = useTransport();

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState('');
  const [dropoffLng, setDropoffLng] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [rideType, setRideType] = useState('economy');
  const [ratePerKm, setRatePerKm] = useState(40);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletBalance, setWalletBalance] = useState(0);

  React.useEffect(() => {
    if (user?.id) {
      loadWalletBalance(user.id).then((b: any) => setWalletBalance(Number(b.available_balance || 0)));
    }
  }, [user?.id, loadWalletBalance]);

  const distanceKm = position && dropoffLat && dropoffLng
    ? haversine(position.latitude, position.longitude, parseFloat(dropoffLat), parseFloat(dropoffLng))
    : 0;
  const fareEstimate = Math.round(ratePerKm * distanceKm);

  const handleSchedule = async () => {
    if (!user?.id) { Alert.alert('Not logged in'); return; }
    if (!position) { Alert.alert('Location unavailable'); return; }
    if (!dropoffLat || !dropoffLng) { Alert.alert('Enter destination coordinates'); return; }

    try {
      const ride = await createNewRide({
        passenger_id: user.id,
        pickup_lat: position.latitude,
        pickup_lng: position.longitude,
        dropoff_lat: parseFloat(dropoffLat),
        dropoff_lng: parseFloat(dropoffLng),
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        ride_type: rideType,
        payment_method: paymentMethod,
        fare_estimate: fareEstimate,
        distance_km: Number(distanceKm.toFixed(2)),
      });
      Alert.alert('Scheduled!', `Ride ID: ${ride.id}\nAt: ${scheduledDate.toLocaleString()}`);
      router.push('/(mtaxi)/history' as any);
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Try again');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Schedule a Ride</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Pickup Address</Text>
        <TextInput style={styles.input} value={pickupAddress} onChangeText={setPickupAddress} placeholder="Where from?" placeholderTextColor="#555" />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Dropoff Address</Text>
        <TextInput style={styles.input} value={dropoffAddress} onChangeText={setDropoffAddress} placeholder="Where to?" placeholderTextColor="#555" />
        <TextInput style={styles.input} value={dropoffLat} onChangeText={setDropoffLat} placeholder="Dropoff Latitude" placeholderTextColor="#555" keyboardType="numeric" />
        <TextInput style={styles.input} value={dropoffLng} onChangeText={setDropoffLng} placeholder="Dropoff Longitude" placeholderTextColor="#555" keyboardType="numeric" />
      </View>

      <TouchableOpacity style={styles.card} onPress={() => setShowPicker(true)}>
        <Text style={styles.label}>Date & Time</Text>
        <Text style={styles.inputText}>{scheduledDate.toLocaleString()}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={scheduledDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => { setShowPicker(false); if (d) setScheduledDate(d); }}
        />
      )}

      <VehicleSelector selected={rideType} onSelect={(t, r) => { setRideType(t); setRatePerKm(r); }} distanceKm={distanceKm || 1} />
      <PaymentSelector selected={paymentMethod} onSelect={setPaymentMethod} balance={walletBalance} fare={fareEstimate} />

      <TouchableOpacity style={[styles.bookBtn, loading && styles.disabled]} onPress={handleSchedule} disabled={loading}>
        <Text style={styles.bookText}>{loading ? 'Scheduling...' : `Schedule ${rideType.toUpperCase()} — KES ${fareEstimate}`}</Text>
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
  inputText: { color: '#fff', fontSize: 15 },
  bookBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  disabled: { opacity: 0.5 },
  bookText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
