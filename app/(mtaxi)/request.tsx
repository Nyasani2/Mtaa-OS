import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useLocation } from '@/lib/transport/hooks/useLocation';
import { useTransport } from '@/lib/transport/hooks/useTransport';
import VehicleSelector from '@/lib/transport/components/VehicleSelector';
import PaymentSelector from '@/lib/transport/components/PaymentSelector';
import FareBreakdownView from '@/lib/transport/components/FareBreakdown';
import AddressSearchModal from '@/lib/transport/components/AddressSearchModal';
import { GeocodeResult } from '@/lib/transport/services/geocode.service';

export default function RequestScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { position, address, loading: locLoading, error: locError } = useLocation();
  const { createNewRide, loadWalletBalance, calculateFare, estimateMinutes, haversine, loading } = useTransport();

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);
  const [rideType, setRideType] = useState('economy');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletBalance, setWalletBalance] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1);
  const [fareBreakdown, setFareBreakdown] = useState<any>(null);
  const [stops, setStops] = useState<{ address: string; lat: number; lng: number }[]>([]);
  const { initialType } = useLocalSearchParams<{ initialType?: string }>();

  const [showPickupSearch, setShowPickupSearch] = useState(false);
  const [showDropoffSearch, setShowDropoffSearch] = useState(false);

  useEffect(() => { if (address) setPickupAddress(address); }, [address]);

  useEffect(() => {
    if (initialType && ['economy','comfort','xl','boda','delivery'].includes(initialType)) {
      setRideType(initialType);
      if (distanceKm > 0) {
        const mins = estimateMinutes(distanceKm, initialType);
        setEstimatedMinutes(mins);
        const fare = calculateFare(initialType, distanceKm, mins, surgeMultiplier);
        setFareBreakdown(fare);
      }
    }
  }, [initialType]);

  useEffect(() => {
    if (user?.id) {
      loadWalletBalance(user.id).then((b: any) => setWalletBalance(Number(b.available_balance || 0)));
    }
  }, [user?.id, loadWalletBalance]);

  useEffect(() => {
    if (position && dropoffLat !== null && dropoffLng !== null) {
      const d = haversine(position.latitude, position.longitude, dropoffLat, dropoffLng);
      setDistanceKm(Number(d.toFixed(2)));
      const mins = estimateMinutes(d, rideType);
      setEstimatedMinutes(mins);
      const fare = calculateFare(rideType, d, mins, surgeMultiplier);
      setFareBreakdown(fare);
    }
  }, [position, dropoffLat, dropoffLng, rideType, surgeMultiplier, haversine, estimateMinutes, calculateFare]);

  const handleSelectVehicle = useCallback((type: string) => {
    setRideType(type);
    if (distanceKm > 0) {
      const mins = estimateMinutes(distanceKm, type);
      setEstimatedMinutes(mins);
      const fare = calculateFare(type, distanceKm, mins, surgeMultiplier);
      setFareBreakdown(fare);
    }
  }, [distanceKm, surgeMultiplier, calculateFare, estimateMinutes]);

  const handleSelectDropoff = (result: GeocodeResult) => {
    setDropoffAddress(result.address);
    setDropoffLat(result.lat);
    setDropoffLng(result.lng);
  };

  const handleSelectPickup = (result: GeocodeResult) => {
    setPickupAddress(result.address);
  };

  const addStop = () => {
    if (!dropoffAddress || dropoffLat === null || dropoffLng === null) {
      Alert.alert('Set destination first'); return;
    }
    setStops([...stops, { address: dropoffAddress, lat: dropoffLat, lng: dropoffLng }]);
    setDropoffAddress(''); setDropoffLat(null); setDropoffLng(null); setFareBreakdown(null);
  };

  const handleBookRide = async () => {
    if (!user?.id) { Alert.alert('Not logged in'); return; }
    if (!position) { Alert.alert('Location unavailable'); return; }
    if (dropoffLat === null || dropoffLng === null) { Alert.alert('Set destination'); return; }
    if (!fareBreakdown) { Alert.alert('Calculating fare...'); return; }
    if (paymentMethod === 'wallet' && walletBalance < fareBreakdown.total) {
      Alert.alert('Insufficient balance', 'Top up your wallet or choose Cash/M-Pesa.'); return;
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
        distance_km: distanceKm,
        base_fare: fareBreakdown.base,
        time_fare: fareBreakdown.timeFare,
        surge_multiplier: fareBreakdown.surge,
      });
      Alert.alert('Ride Booked!', `Fare: KES ${fareBreakdown.total.toLocaleString()}\nFinding drivers...`);
      router.push(`/(mtaxi)/tracking?id=${ride.id}`);
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Try again');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Request a Ride</Text>

      <TouchableOpacity style={styles.card} onPress={() => setShowPickupSearch(true)}>
        <Text style={styles.label}>📍 Pickup</Text>
        <Text style={pickupAddress ? styles.inputText : styles.placeholder}>
          {pickupAddress || 'Tap to set pickup location'}
        </Text>
        {locLoading && <ActivityIndicator color="#e94560" style={{ marginTop: 8 }} />}
        {locError && <Text style={styles.err}>GPS: {locError}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => setShowDropoffSearch(true)}>
        <Text style={styles.label}>📍 Destination</Text>
        <Text style={dropoffAddress ? styles.inputText : styles.placeholder}>
          {dropoffAddress || 'Tap to enter destination'}
        </Text>
        {distanceKm > 0 && (
          <Text style={styles.meta}>{distanceKm} km • ~{estimatedMinutes} min</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.addStop} onPress={addStop}>
        <Text style={styles.addStopText}>+ Add Stop ({stops.length})</Text>
      </TouchableOpacity>

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

      <VehicleSelector selected={rideType} onSelect={handleSelectVehicle} distanceKm={distanceKm || 0} estimatedMinutes={estimatedMinutes || 0} surge={surgeMultiplier} />
      {fareBreakdown && <FareBreakdownView fare={fareBreakdown} />}
      <PaymentSelector selected={paymentMethod} onSelect={setPaymentMethod} balance={walletBalance} fare={fareBreakdown?.total || 0} />

      <TouchableOpacity style={[styles.bookBtn, loading && styles.disabled]} onPress={handleBookRide} disabled={loading}>
        <Text style={styles.bookText}>
          {loading ? 'Booking...' : `Book ${rideType.toUpperCase()} — KES ${fareBreakdown?.total?.toLocaleString() || '—'}`}
        </Text>
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
  err: { color: '#ff6b6b', fontSize: 12, marginTop: 4 },
  addStop: { paddingVertical: 10 },
  addStopText: { color: '#e94560', fontSize: 14, fontWeight: '600' },
  surgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  surgeBtn: { backgroundColor: '#16213e', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  surgeActive: { backgroundColor: '#0f3460', borderWidth: 1, borderColor: '#f39c12' },
  surgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  bookBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  disabled: { opacity: 0.5 },
  bookText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
