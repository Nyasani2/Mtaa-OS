import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAmbulanceDispatch } from '@/lib/health/hooks/useAmbulanceDispatch';

export default function AmbulanceDispatchScreen() {
  const router = useRouter();
  const { units, loadingUnits, error: unitsError, fetchUnits, createDispatch } = useAmbulanceDispatch();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  const handleDispatch = async () => {
    if (!patientName.trim() || !patientPhone.trim() || !pickupAddress.trim() || !destinationAddress.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const result = await createDispatch({
      patient_name: patientName.trim(),
      patient_phone: patientPhone.trim(),
      pickup_address: pickupAddress.trim(),
      destination_address: destinationAddress.trim(),
      notes: notes.trim(),
      unit_id: selectedUnit || undefined,
    });
    setSubmitting(false);

    if (result.success) {
      Alert.alert('Dispatch Sent', 'Ambulance dispatch request submitted successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Dispatch Failed', result.error || 'Could not submit dispatch. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: '#0f172a', padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 }}>
          Ambulance Dispatch
        </Text>

        {unitsError && (
          <View style={{ backgroundColor: '#ef444422', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <Text style={{ color: '#ef4444' }}>{unitsError}</Text>
          </View>
        )}

        <Text style={{ color: '#94a3b8', marginBottom: 4 }}>Patient Name *</Text>
        <TextInput
          value={patientName}
          onChangeText={setPatientName}
          placeholder="Full name"
          placeholderTextColor="#64748b"
          style={{ backgroundColor: '#1e293b', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 }}
        />

        <Text style={{ color: '#94a3b8', marginBottom: 4 }}>Patient Phone *</Text>
        <TextInput
          value={patientPhone}
          onChangeText={setPatientPhone}
          placeholder="Phone number"
          placeholderTextColor="#64748b"
          keyboardType="phone-pad"
          style={{ backgroundColor: '#1e293b', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 }}
        />

        <Text style={{ color: '#94a3b8', marginBottom: 4 }}>Pickup Address *</Text>
        <TextInput
          value={pickupAddress}
          onChangeText={setPickupAddress}
          placeholder="Current location"
          placeholderTextColor="#64748b"
          multiline
          style={{ backgroundColor: '#1e293b', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, minHeight: 60 }}
        />

        <Text style={{ color: '#94a3b8', marginBottom: 4 }}>Destination Address *</Text>
        <TextInput
          value={destinationAddress}
          onChangeText={setDestinationAddress}
          placeholder="Hospital or destination"
          placeholderTextColor="#64748b"
          multiline
          style={{ backgroundColor: '#1e293b', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, minHeight: 60 }}
        />

        <Text style={{ color: '#94a3b8', marginBottom: 4 }}>Additional Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Any special instructions..."
          placeholderTextColor="#64748b"
          multiline
          style={{ backgroundColor: '#1e293b', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, minHeight: 80 }}
        />

        <Text style={{ color: '#94a3b8', marginBottom: 4 }}>Select Unit (Optional)</Text>
        {loadingUnits ? (
          <ActivityIndicator color="#3b82f6" style={{ marginVertical: 12 }} />
        ) : units.length === 0 ? (
          <Text style={{ color: '#64748b', marginBottom: 12 }}>No available units. Dispatch will auto-assign.</Text>
        ) : (
          <ScrollView horizontal style={{ marginBottom: 12 }} showsHorizontalScrollIndicator={false}>
            {units.map((unit) => (
              <TouchableOpacity
                key={unit.id}
                onPress={() => setSelectedUnit(selectedUnit === unit.id ? '' : unit.id)}
                style={{
                  backgroundColor: selectedUnit === unit.id ? '#3b82f6' : '#1e293b',
                  paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
                  marginRight: 8, borderWidth: 1, borderColor: selectedUnit === unit.id ? '#3b82f6' : '#334155'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>{unit.unit_number}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>{unit.unit_type}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          onPress={handleDispatch}
          disabled={submitting}
          style={{
            backgroundColor: submitting ? '#1e40af' : '#3b82f6',
            padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 32
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Send Dispatch</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
