import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import UnifiedMap from '@/lib/components/maps/UnifiedMap';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { requestBoda, getBodaFareEstimate, getAvailableBodas, getBodaTypes } from '@/lib/services/boda-service';
import { useLocation } from '@/lib/hooks/useLocation';

const PAYMENT_METHODS = [
  { id: 'wallet', name: 'MTAA Wallet', icon: '💳' },
  { id: 'mpesa', name: 'M-Pesa', icon: '📱' },
  { id: 'cash', name: 'Cash', icon: '💵' },
];

export default function BodaRequestScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { location, loading: locLoading, error: locError } = useLocation();

  const [destination, setDestination] = useState('');
  const [selectedType, setSelectedType] = useState('boda');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [fareEstimate, setFareEstimate] = useState<any>(null);
  const [estimating, setEstimating] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [driverStatus, setDriverStatus] = useState<{ available: boolean; count: number; message: string } | null>(null);
  const [bodaTypes, setBodaTypes] = useState<any[]>([]);

  useEffect(() => {
    setBodaTypes(getBodaTypes());
  }, []);

  const handleGetEstimate = async () => {
    if (!location || !destination.trim()) {
      Alert.alert('Missing Info', 'Please enter your destination');
      return;
    }

    setEstimating(true);
    try {
      const destLat = location.latitude + (Math.random() - 0.5) * 0.02;
      const destLng = location.longitude + (Math.random() - 0.5) * 0.02;

      const estimate = getBodaFareEstimate(
        { lat: location.latitude, lng: location.longitude },
        { lat: destLat, lng: destLng },
        selectedType as any
      );

      setFareEstimate(estimate);

      const status = await getAvailableBodas(location.latitude, location.longitude, 5);
      setDriverStatus({
        available: status.length > 0,
        count: status.length,
        message: status.length > 0
          ? `${status.length} boda${status.length > 1 ? 's' : ''} nearby`
          : 'No bodas available nearby. Try again in a few minutes.',
      });
    } catch (err: any) {
      Alert.alert('Estimate Error', err.message);
    } finally {
      setEstimating(false);
    }
  };

  const handleRequest = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to request a boda');
      return;
    }
    if (!fareEstimate) {
      Alert.alert('Get Estimate First', 'Please get a fare estimate before booking');
      return;
    }
    if (!driverStatus?.available) {
      Alert.alert('No Drivers', 'No bodas available in your area right now. Please try again later.');
      return;
    }

    setRequesting(true);
    try {
      await requestBoda({
        riderId: user.id,
        pickup: {
          lat: location!.latitude,
          lng: location!.longitude,
          address: 'Current Location',
        },
        destination: {
          lat: location!.latitude + (Math.random() - 0.5) * 0.02,
          lng: location!.longitude + (Math.random() - 0.5) * 0.02,
          address: destination,
        },
        bodaType: selectedType as any,
        paymentMethod: paymentMethod as any,
        estimatedFare: fareEstimate.amount,
        currency: fareEstimate.currency,
      });

      Alert.alert(
        'Boda Requested!',
        `Your ${selectedType} request for ${fareEstimate.formatted} has been sent. A driver will accept shortly.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Request Failed', err.message || 'Unable to request boda. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛵 Request Boda</Text>
      </View>

      <View style={styles.mapContainer}>
        {locLoading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator color="#3b82f6" />
            <Text style={styles.mapLoadingText}>Getting your location...</Text>
          </View>
        ) : location ? (
          <UnifiedMap
            latitude={location.latitude}
            longitude={location.longitude}
            zoom={15}
            showUserLocation
            style={styles.map}
          />
        ) : (
          <View style={styles.mapError}>
            <Text style={styles.mapErrorText}>{locError || 'Location unavailable'}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Where to?</Text>
        <TextInput
          style={styles.input}
          value={destination}
          onChangeText={setDestination}
          placeholder="Enter destination"
          placeholderTextColor="#64748b"
        />
        <TouchableOpacity
          style={styles.estimateButton}
          onPress={handleGetEstimate}
          disabled={estimating || !destination.trim()}
        >
          {estimating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.estimateButtonText}>Get Fare Estimate</Text>
          )}
        </TouchableOpacity>
      </View>

      {fareEstimate && (
        <View style={styles.estimateCard}>
          <Text style={styles.estimateLabel}>Estimated Fare</Text>
          <Text style={styles.estimateAmount}>{fareEstimate.formatted}</Text>
          <Text style={styles.estimateDetail}>
            {fareEstimate.distanceKm} km · {fareEstimate.durationMinutes} min · {selectedType}
          </Text>
          {driverStatus && (
            <View style={[styles.driverBadge, driverStatus.available ? styles.driverAvailable : styles.driverUnavailable]}>
              <Text style={styles.driverBadgeText}>{driverStatus.message}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Boda Type</Text>
        {bodaTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.typeCard, selectedType === type.id && styles.typeCardActive]}
            onPress={() => setSelectedType(type.id)}
          >
            <View style={styles.typeInfo}>
              <Text style={styles.typeName}>{type.name}</Text>
              <Text style={styles.typeDesc}>{type.description}</Text>
              <Text style={styles.typeBase}>Base: {type.currencySymbol} {type.basePrice}</Text>
            </View>
            {selectedType === type.id && (
              <View style={styles.checkCircle}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[styles.paymentCard, paymentMethod === method.id && styles.paymentCardActive]}
            onPress={() => setPaymentMethod(method.id)}
          >
            <Text style={styles.paymentIcon}>{method.icon}</Text>
            <Text style={styles.paymentName}>{method.name}</Text>
            {paymentMethod === method.id && <Text style={styles.checkText}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.requestButton, (!fareEstimate || requesting) && styles.requestButtonDisabled]}
        onPress={handleRequest}
        disabled={!fareEstimate || requesting}
      >
        {requesting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.requestButtonText}>
            {fareEstimate
              ? `Request ${selectedType.replace('_', ' ')} — ${fareEstimate.formatted}`
              : 'Get Fare Estimate First'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.asisButton} onPress={() => router.push('/asis')}>
        <Text style={styles.asisText}>💬 Need help? Ask ASIS</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },

  mapContainer: { height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  map: { flex: 1 },
  mapLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  mapLoadingText: { color: '#94a3b8', marginTop: 8 },
  mapError: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  mapErrorText: { color: '#ef4444' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 10 },

  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },

  estimateButton: { backgroundColor: '#f97316', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  estimateButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  estimateCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 2, borderColor: '#3b82f6' },
  estimateLabel: { fontSize: 14, color: '#94a3b8', marginBottom: 4 },
  estimateAmount: { fontSize: 36, fontWeight: '800', color: '#fff' },
  estimateDetail: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  driverBadge: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  driverAvailable: { backgroundColor: '#064e3b' },
  driverUnavailable: { backgroundColor: '#7f1d1d' },
  driverBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  typeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  typeCardActive: { borderColor: '#f97316', backgroundColor: '#431407' },
  typeInfo: { flex: 1 },
  typeName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  typeDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  typeBase: { fontSize: 12, color: '#f97316', marginTop: 4, fontWeight: '600' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center' },
  checkText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  paymentCardActive: { borderColor: '#3b82f6' },
  paymentIcon: { fontSize: 20, marginRight: 12 },
  paymentName: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '600' },

  requestButton: { backgroundColor: '#10b981', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 10 },
  requestButtonDisabled: { backgroundColor: '#334155', opacity: 0.5 },
  requestButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  asisButton: { alignItems: 'center', marginTop: 16, padding: 10 },
  asisText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
});
