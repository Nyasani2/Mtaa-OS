// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useLocation } from '@/lib/transport/hooks/useLocation';
import { useTransport } from '@/lib/transport/hooks/useTransport';
import VehicleSelector from '@/lib/transport/components/VehicleSelector';
import PaymentSelector from '@/lib/transport/components/PaymentSelector';
import FareBreakdownView from '@/lib/transport/components/FareBreakdown';
import AddressSearchModal from '@/lib/transport/components/AddressSearchModal';
import { GeocodeResult } from '@/lib/transport/services/geocode.service';

export default function ScheduleScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { position, address } = useLocation();
  const { createNewRide, loadWalletBalance, calculateFare, estimateMinutes, haversine, loading } = useTransport();

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [rideType, setRideType] = useState('economy');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletBalance, setWalletBalance] = useState(0);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1);
  const [fareBreakdown, setFareBreakdown] = useState<any>(null);

  const [showPickupSearch, setShowPickupSearch] = useState(false);
  const [showDropoffSearch, setShowDropoffSearch] = useState(false);

  useEffect(() => { if (address) setPickupAddress(address); }, [address]);

  useEffect(() => {
    if (user?.id) {
      loadWalletBalance(user.id).then((b: any) => setWalletBalance(Number(b.available_balance || 0)));
    }
  }, [user?.id, loadWalletBalance]);

  const distanceKm = position && dropoffLat !== null && dropoffLng !== null
    ? haversine(position.latitude, position.longitude, dropoffLat, dropoffLng)
    : 0;
  const estimatedMinutes = distanceKm > 0 ? estimateMinutes(distanceKm, rideType) : 0;

  useEffect(() => {
    if (distanceKm > 0) {
      const fare = calculateFare(rideType, distanceKm, estimatedMinutes, surgeMultiplier);
      setFareBreakdown(fare);
    }
  }, [distanceKm, rideType, surgeMultiplier, estimatedMinutes, calculateFare]);

  const handleSelectDropoff = (result: GeocodeResult) => {
    // @ts-ignore
    setDropoffAddress(result.address);
    setDropoffLat(result.lat);
    setDropoffLng(result.lng);
  };

  const handleSelectPickup = (result: GeocodeResult) => {
    // @ts-ignore
    setPickupAddress(result.address);
  };

  const handleSchedule = async () => {
    if (!user?.id) { Alert.alert('Not logged in'); return; }
    if (!position) { Alert.alert('Location unavailable'); return; }
    if (dropoffLat === null || dropoffLng === null) { Alert.alert('Set destination'); return; }
    if (!fareBreakdown) { Alert.alert('Calculating fare...'); return; }
    if (paymentMethod === 'wallet' && walletBalance < fareBreakdown.total) {
      Alert.alert('Insufficient balance'); return;
    }
    try {
      const ride = await createNewRide({
        passenger_id: user.id,
        pickup_lat: position.latitude,
        pickup_lng: position.longitude,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        ride_type: rideType,
        payment_method: paymentMethod,
        fare_estimate: fareBreakdown.total,
        distance_km: Number(distanceKm.toFixed(2)),
        base_fare: fareBreakdown.base,
        time_fare: fareBreakdown.timeFare,
        surge_multiplier: fareBreakdown.surge,
      });
      Alert.alert('Scheduled!', `Ride ID: ${ride.id}\nAt: ${scheduledDate.toLocaleString()}\nFare: KES ${fareBreakdown.total.toLocaleString()}`);
      router.push('/(mtaxi)/history' as any);
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Try again');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Schedule a Ride</Text>

      <TouchableOpacity style={styles.card} onPress={() => setShowPickupSearch(true)}>
        <Text style={styles.label}>Pickup Address</Text>
        <Text style={pickupAddress ? styles.inputText : styles.placeholder}>
          {pickupAddress || 'Tap to set pickup location'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => setShowDropoffSearch(true)}>
        <Text style={styles.label}>Dropoff Address</Text>
        <Text style={dropoffAddress ? styles.inputText : styles.placeholder}>
          {dropoffAddress || 'Tap to enter destination'}
        </Text>
        {distanceKm > 0 && <Text style={styles.meta}>{distanceKm.toFixed(1)} km • ~{estimatedMinutes} min</Text>}
      </TouchableOpacity>

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

      <View style={styles.card}>
        <Text style={styles.label}>Surge Multiplier (demo)</Text>
        <View style={styles.surgeRow}>
          {[1, 1.5, 2, 2.5, 3].map((s) => (
            <TouchableOpacity key={s} style={[styles.surgeBtn, surgeMultiplier === s && styles.surgeActive]} onPress={() => setSurgeMultiplier(s)}>
              <Text style={styles.surgeText}>{s}x</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <VehicleSelector selected={rideType} onSelect={setRideType} distanceKm={distanceKm || 0} estimatedMinutes={estimatedMinutes || 0} surge={surgeMultiplier} />
      {fareBreakdown && <FareBreakdownView fare={fareBreakdown} />}
      <PaymentSelector selected={paymentMethod} onSelect={setPaymentMethod} balance={walletBalance} fare={fareBreakdown?.total || 0} />

      <TouchableOpacity style={[styles.bookBtn, loading && styles.disabled]} onPress={handleSchedule} disabled={loading}>
        <Text style={styles.bookText}>{loading ? 'Scheduling...' : `Schedule ${rideType.toUpperCase()} — KES ${fareBreakdown?.total?.toLocaleString() || '—'}`}</Text>
      </TouchableOpacity>

      <AddressSearchModal visible={showPickupSearch} onClose={() => setShowPickupSearch(false)} onSelect={handleSelectPickup} title="Search Pickup Location" initialQuery={pickupAddress} />
      <AddressSearchModal visible={showDropoffSearch} onClose={() => setShowDropoffSearch(false)} onSelect={handleSelectDropoff} title="Search Destination" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10 },
  label: { color: '#8892b0', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  inputText: { color: '#fff', fontSize: 15 },
  placeholder: { color: '#555', fontSize: 15 },
  meta: { color: '#e94560', fontSize: 13, marginTop: 6, fontWeight: '700' },
  surgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  surgeBtn: { backgroundColor: '#16213e', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  surgeActive: { backgroundColor: '#0f3460', borderWidth: 1, borderColor: '#f39c12' },
  surgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  bookBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  disabled: { opacity: 0.5 },
  bookText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
