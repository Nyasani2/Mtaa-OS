import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Modal,
} from 'react-native';
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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RequestScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { position, address, loading: locLoading, error: locError } = useLocation();
  const { createNewRide, loadWalletBalance, loading } = useTransport();

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);
  const [rideType, setRideType] = useState('economy');
  const [ratePerKm, setRatePerKm] = useState(40);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletBalance, setWalletBalance] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [fareEstimate, setFareEstimate] = useState(0);
  const [stops, setStops] = useState<{ address: string; lat: number; lng: number }[]>([]);
  const [showDestModal, setShowDestModal] = useState(false);
  const [tempAddress, setTempAddress] = useState('');
  const [tempLat, setTempLat] = useState('');
  const [tempLng, setTempLng] = useState('');

  useEffect(() => {
    if (address) setPickupAddress(address);
  }, [address]);

  useEffect(() => {
    if (user?.id) {
      loadWalletBalance(user.id).then((b: any) => setWalletBalance(Number(b.available_balance || 0)));
    }
  }, [user?.id, loadWalletBalance]);

  useEffect(() => {
    if (position && dropoffLat !== null && dropoffLng !== null) {
      const d = haversine(position.latitude, position.longitude, dropoffLat, dropoffLng);
      setDistanceKm(Number(d.toFixed(2)));
      setFareEstimate(Math.round(ratePerKm * d));
    }
  }, [position, dropoffLat, dropoffLng, ratePerKm]);

  const handleSelectVehicle = useCallback((type: string, rate: number) => {
    setRideType(type);
    setRatePerKm(rate);
    if (distanceKm > 0) setFareEstimate(Math.round(rate * distanceKm));
  }, [distanceKm]);

  const openDestModal = () => {
    setTempAddress(dropoffAddress);
    setTempLat(dropoffLat?.toString() || '');
    setTempLng(dropoffLng?.toString() || '');
    setShowDestModal(true);
  };

  const saveDestination = () => {
    const lat = parseFloat(tempLat);
    const lng = parseFloat(tempLng);
    if (!tempAddress.trim() || isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid', 'Enter a valid address, latitude and longitude.');
      return;
    }
    setDropoffAddress(tempAddress.trim());
    setDropoffLat(lat);
    setDropoffLng(lng);
    setShowDestModal(false);
  };

  const addStop = () => {
    if (!dropoffAddress || dropoffLat === null || dropoffLng === null) {
      Alert.alert('Set destination first');
      return;
    }
    setStops([...stops, { address: dropoffAddress, lat: dropoffLat, lng: dropoffLng }]);
    setDropoffAddress('');
    setDropoffLat(null);
    setDropoffLng(null);
  };

  const handleBookRide = async () => {
    if (!user?.id) { Alert.alert('Not logged in'); return; }
    if (!position) { Alert.alert('Location unavailable'); return; }
    if (dropoffLat === null || dropoffLng === null) { Alert.alert('Set destination'); return; }
    if (paymentMethod === 'wallet' && walletBalance < fareEstimate) {
      Alert.alert('Insufficient balance', 'Top up your wallet or choose Cash/M-Pesa.');
      return;
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
        fare_estimate: fareEstimate,
        distance_km: distanceKm,
      });
      Alert.alert('Ride Booked!', `Fare: KES ${fare_estimate}\nFinding drivers...`);
      router.push(`/(mtaxi)/tracking?id=${ride.id}`);
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Try again');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Request a Ride</Text>

      {/* Pickup */}
      <View style={styles.card}>
        <Text style={styles.label}>📍 Pickup</Text>
        <TextInput
          style={styles.input}
          value={pickupAddress}
          onChangeText={setPickupAddress}
          placeholder="Current location"
          placeholderTextColor="#555"
        />
        {locLoading && <ActivityIndicator color="#e94560" />}
        {locError && <Text style={styles.err}>GPS: {locError}</Text>}
      </View>

      {/* Destination */}
      <TouchableOpacity style={styles.card} onPress={openDestModal}>
        <Text style={styles.label}>📍 Destination</Text>
        <Text style={dropoffAddress ? styles.inputText : styles.placeholder}>
          {dropoffAddress || 'Tap to enter destination'}
        </Text>
        {distanceKm > 0 && (
          <Text style={styles.meta}>Distance: {distanceKm} km • KES {fareEstimate}</Text>
        )}
      </TouchableOpacity>

      {/* Add Stop */}
      <TouchableOpacity style={styles.addStop} onPress={addStop}>
        <Text style={styles.addStopText}>+ Add Stop ({stops.length})</Text>
      </TouchableOpacity>

      {/* Vehicle */}
      <VehicleSelector selected={rideType} onSelect={handleSelectVehicle} distanceKm={distanceKm || 1} />

      {/* Payment */}
      <PaymentSelector
        selected={paymentMethod}
        onSelect={setPaymentMethod}
        balance={walletBalance}
        fare={fareEstimate}
      />

      {/* Book Button */}
      <TouchableOpacity
        style={[styles.bookBtn, loading && styles.disabled]}
        onPress={handleBookRide}
        disabled={loading}
      >
        <Text style={styles.bookText}>
          {loading ? 'Booking...' : `Book ${rideType.toUpperCase()} — KES ${fareEstimate}`}
        </Text>
      </TouchableOpacity>

      {/* Destination Modal */}
      <Modal visible={showDestModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter Destination</Text>
            <TextInput
              style={styles.input}
              placeholder="Address"
              placeholderTextColor="#555"
              value={tempAddress}
              onChangeText={setTempAddress}
            />
            <TextInput
              style={styles.input}
              placeholder="Latitude"
              placeholderTextColor="#555"
              keyboardType="numeric"
              value={tempLat}
              onChangeText={setTempLat}
            />
            <TextInput
              style={styles.input}
              placeholder="Longitude"
              placeholderTextColor="#555"
              keyboardType="numeric"
              value={tempLng}
              onChangeText={setTempLng}
            />
            <TouchableOpacity style={styles.bookBtn} onPress={saveDestination}>
              <Text style={styles.bookText}>Save Destination</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bookBtn, { backgroundColor: '#333', marginTop: 8 }]} onPress={() => setShowDestModal(false)}>
              <Text style={styles.bookText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10 },
  label: { color: '#8892b0', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  input: { color: '#fff', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 6 },
  inputText: { color: '#fff', fontSize: 15 },
  placeholder: { color: '#555', fontSize: 15 },
  meta: { color: '#e94560', fontSize: 13, marginTop: 6, fontWeight: '700' },
  err: { color: '#ff6b6b', fontSize: 12, marginTop: 4 },
  addStop: { paddingVertical: 10 },
  addStopText: { color: '#e94560', fontSize: 14, fontWeight: '600' },
  bookBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  disabled: { opacity: 0.5 },
  bookText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 14 },
});
