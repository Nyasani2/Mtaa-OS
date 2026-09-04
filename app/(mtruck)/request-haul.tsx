// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import UnifiedMap from '@/lib/components/maps/UnifiedMap';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, requestFreight, estimateFreight, getHaulTypes, checkTruckAvailability } from '@/lib/services/mtruck-service';
import { Alert, useLocation } from '@/lib/transport/hooks/useLocation';

const URGENCY_LEVELS = [
  { id: 'normal', name: 'Normal', desc: 'Standard delivery', multiplier: 1.0 },
  { id: 'express', name: 'Express', desc: 'Priority handling', multiplier: 1.3 },
  { id: 'critical', name: 'Critical', desc: 'Emergency haul', multiplier: 1.8 },
];

export default function MTruckRequestScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { location, loading: locLoading, error: locError } = useLocation();

  const [cargoType, setCargoType] = useState('');
  const [tonnage, setTonnage] = useState('Medium — 3.5-12 t');
  const [weightKg, setWeightKg] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [hazardous, setHazardous] = useState(false);
  const [fragile, setFragile] = useState(false);
  const [temperatureControlled, setTemperatureControlled] = useState(false);

  const [selectedHaulType, setSelectedHaulType] = useState('local_haul');
  const [fareEstimate, setFareEstimate] = useState<any>(null);
  const [estimating, setEstimating] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [truckStatus, setTruckStatus] = useState<{ available: boolean; count: number; message: string } | null>(null);
  const [haulTypes, setHaulTypes] = useState<any[]>([]);

  useEffect(() => {
    setHaulTypes(getHaulTypes());
  }, []);

  const handleGetEstimate = async () => {
    if (!location || !pickupAddress.trim() || !deliveryAddress.trim() || !weightKg) {
      Alert.alert('Missing Info', 'Please fill in pickup, delivery, and weight');
      return;
    }

    setEstimating(true);
    try {
      const destLat = location.latitude + (Math.random() - 0.5) * 0.05;
      const destLng = location.longitude + (Math.random() - 0.5) * 0.05;

      const estimate = estimateFreight(
        { lat: location.latitude, lng: location.longitude, address: pickupAddress },
        { lat: destLat, lng: destLng, address: deliveryAddress },
        parseInt(weightKg) || 1000,
        cargoType || 'general',
        selectedHaulType as any
      );

      const urgencyMult = URGENCY_LEVELS.find((u: any) => u.id === urgency)?.multiplier || 1.0;
      estimate.estimatedFare.amount = Math.round(estimate.estimatedFare.amount * urgencyMult);
       
      const { formatCurrency } = require('@/lib/services/fare-engine');
      estimate.estimatedFare.formatted = formatCurrency(estimate.estimatedFare.amount, estimate.estimatedFare.currency);

      setFareEstimate(estimate);

      const status = await checkTruckAvailability(location.latitude, location.longitude);
      setTruckStatus(status);
    } catch (err: any) {
      Alert.alert('Estimate Error', err.message);
    } finally {
      setEstimating(false);
    }
  };

  const handleRequest = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to request a haul');
      return;
    }
    if (!fareEstimate) {
      Alert.alert('Get Estimate First', 'Please get a fare estimate before submitting');
      return;
    }
    if (!truckStatus?.available) {
      Alert.alert('No Trucks', 'No trucks available for this route. Please try again later.');
      return;
    }

    setRequesting(true);
    try {
      await requestFreight({
        requester_id: user.id,
        origin: pickupAddress,
        destination: deliveryAddress,
        origin_lat: location!.latitude,
        origin_lng: location!.longitude,
        dest_lat: location!.latitude + (Math.random() - 0.5) * 0.05,
        dest_lng: location!.longitude + (Math.random() - 0.5) * 0.05,
        cargo_type: cargoType || 'general',
        weight_kg: parseInt(weightKg) || 1000,
        truck_type_preference: selectedHaulType,
        budget: fareEstimate.estimatedFare.amount,
        estimated_fare: fareEstimate.estimatedFare.amount,
        currency: fareEstimate.estimatedFare.currency,
      });

      Alert.alert(
        'Haul Requested!',
        `Your ${selectedHaulType.replace('_', ' ')} request for ${fareEstimate.estimatedFare.formatted} has been submitted. A truck operator will review and respond shortly.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Request Failed', err.message || 'Unable to submit haul request. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚛 Request a Haul</Text>
        <Text style={styles.headerSubtitle}>Tell us what you need moved</Text>
      </View>

      <View style={styles.mapContainer}>
        {locLoading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator color="#3b82f6" />
            <Text style={styles.mapLoadingText}>Loading map...</Text>
          </View>
        ) : location ? (
          <UnifiedMap
            latitude={location.latitude}
            longitude={location.longitude}
            zoom={13}
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
        <Text style={styles.label}>Cargo Type</Text>
        <TextInput
          style={styles.input}
          value={cargoType}
          onChangeText={setCargoType}
          placeholder="e.g. Construction steel, Maize, Electronics"
          placeholderTextColor="#64748b"
        />

        <Text style={styles.label}>Tonnage Category</Text>
        <View style={styles.tonnageRow}>
          {['Light — <3.5 t', 'Medium — 3.5-12 t', 'Heavy — 12t+'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tonnageChip, tonnage === t && styles.tonnageChipActive]}
              onPress={() => setTonnage(t)}
            >
              <Text style={[styles.tonnageText, tonnage === t && styles.tonnageTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Exact Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={weightKg}
          onChangeText={setWeightKg}
          placeholder="e.g. 5000"
          keyboardType="numeric"
          placeholderTextColor="#64748b"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Pickup Location</Text>
        <TextInput
          style={styles.input}
          value={pickupAddress}
          onChangeText={setPickupAddress}
          placeholder="Full address"
          placeholderTextColor="#64748b"
        />

        <Text style={styles.label}>Delivery Location</Text>
        <TextInput
          style={styles.input}
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          placeholder="Full address"
          placeholderTextColor="#64748b"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Pickup Date & Time</Text>
        <TextInput
          style={styles.input}
          value={pickupDate}
          onChangeText={setPickupDate}
          placeholder="YYYY-MM-DD HH:00"
          placeholderTextColor="#64748b"
        />

        <Text style={styles.label}>Delivery Deadline</Text>
        <TextInput
          style={styles.input}
          value={deliveryDeadline}
          onChangeText={setDeliveryDeadline}
          placeholder="YYYY-MM-DD HH:00"
          placeholderTextColor="#64748b"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Urgency</Text>
        <View style={styles.urgencyRow}>
          {URGENCY_LEVELS.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={[styles.urgencyChip, urgency === u.id && styles.urgencyChipActive]}
              onPress={() => setUrgency(u.id)}
            >
              <Text style={[styles.urgencyName, urgency === u.id && styles.urgencyNameActive]}>{u.name}</Text>
              <Text style={[styles.urgencyDesc, urgency === u.id && styles.urgencyDescActive]}>{u.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Haul Type</Text>
        {haulTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.haulCard, selectedHaulType === type.id && styles.haulCardActive]}
            onPress={() => setSelectedHaulType(type.id)}
          >
            <View style={styles.haulInfo}>
              <Text style={styles.haulName}>{type.name}</Text>
              <Text style={styles.haulDesc}>{type.description}</Text>
              <Text style={styles.haulBase}>From {type.currencySymbol} {type.basePrice}</Text>
            </View>
            {selectedHaulType === type.id && (
              <View style={styles.checkCircle}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Special Requirements</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={specialRequirements}
          onChangeText={setSpecialRequirements}
          placeholder="e.g. Crane needed, Side-loader, Fragile"
          multiline
          placeholderTextColor="#64748b"
        />

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Hazardous Material</Text>
          <Switch value={hazardous} onValueChange={setHazardous} trackColor={{ false: '#334155', true: '#3b82f6' }} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Fragile Cargo</Text>
          <Switch value={fragile} onValueChange={setFragile} trackColor={{ false: '#334155', true: '#3b82f6' }} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Temperature Controlled</Text>
          <Switch value={temperatureControlled} onValueChange={setTemperatureControlled} trackColor={{ false: '#334155', true: '#3b82f6' }} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.estimateButton}
        onPress={handleGetEstimate}
        disabled={estimating}
      >
        {estimating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.estimateButtonText}>Get Fare Estimate</Text>
        )}
      </TouchableOpacity>

      {fareEstimate && (
        <View style={styles.estimateCard}>
          <Text style={styles.estimateLabel}>Estimated Fare</Text>
          <Text style={styles.estimateAmount}>{fareEstimate.estimatedFare.formatted}</Text>
          <Text style={styles.estimateDetail}>
            {fareEstimate.distanceKm} km · ~{fareEstimate.durationHours}h · {selectedHaulType.replace('_', ' ')}
          </Text>
          {truckStatus && (
            <View style={[styles.truckBadge, truckStatus.available ? styles.truckAvailable : styles.truckUnavailable]}>
              <Text style={styles.truckBadgeText}>{truckStatus.message}</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, (!fareEstimate || requesting) && styles.submitButtonDisabled]}
        onPress={handleRequest}
        disabled={!fareEstimate || requesting}
      >
        {requesting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {fareEstimate
              ? `Request ${selectedHaulType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} — ${fareEstimate.estimatedFare.formatted}`
              : 'Get Fare Estimate First'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.asisButton} onPress={() => router.push('/asis' as any)}>
        <Text style={styles.asisText}>💬 Need help? Ask ASIS</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, paddingBottom: 40 },

  header: { marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },

  mapContainer: { height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  map: { flex: 1 },
  mapLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  mapLoadingText: { color: '#94a3b8', marginTop: 8 },
  mapError: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  mapErrorText: { color: '#ef4444' },

  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },

  tonnageRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tonnageChip: { backgroundColor: '#1e293b', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#334155' },
  tonnageChipActive: { borderColor: '#3b82f6', backgroundColor: '#1e3a5f' },
  tonnageText: { color: '#94a3b8', fontSize: 12 },
  tonnageTextActive: { color: '#3b82f6', fontWeight: '600' },

  urgencyRow: { flexDirection: 'row', gap: 8 },
  urgencyChip: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  urgencyChipActive: { borderColor: '#3b82f6', backgroundColor: '#1e3a5f' },
  urgencyName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  urgencyNameActive: { color: '#3b82f6' },
  urgencyDesc: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  urgencyDescActive: { color: '#93c5fd' },

  haulCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  haulCardActive: { borderColor: '#22c55e', backgroundColor: '#064e3b' },
  haulInfo: { flex: 1 },
  haulName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  haulDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  haulBase: { fontSize: 12, color: '#22c55e', marginTop: 4, fontWeight: '600' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  checkText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  toggleLabel: { fontSize: 14, color: '#e2e8f0' },

  estimateButton: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  estimateButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  estimateCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 2, borderColor: '#22c55e' },
  estimateLabel: { fontSize: 14, color: '#94a3b8', marginBottom: 4 },
  estimateAmount: { fontSize: 36, fontWeight: '800', color: '#fff' },
  estimateDetail: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  truckBadge: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  truckAvailable: { backgroundColor: '#064e3b' },
  truckUnavailable: { backgroundColor: '#7f1d1d' },
  truckBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  submitButton: { backgroundColor: '#22c55e', borderRadius: 12, padding: 18, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#334155', opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  asisButton: { alignItems: 'center', marginTop: 16, padding: 10 },
  asisText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
});
