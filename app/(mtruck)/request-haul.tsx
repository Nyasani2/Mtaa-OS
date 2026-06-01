import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useShipperStore } from '@/lib/mtruck/stores/useShipperStore';
import { useIdentity } from '@/lib/auth/identity';
import type { TonnageCategory } from '@/lib/mtruck/types';
import { Truck, MapPin, Calendar, Weight, AlertCircle, ChevronDown, Check } from 'lucide-react-native';

const TONNAGE_OPTIONS: { value: TonnageCategory; label: string; range: string }[] = [
  { value: 'light', label: 'Light', range: '0–3.5 t' },
  { value: 'medium', label: 'Medium', range: '3.5–12 t' },
  { value: 'heavy', label: 'Heavy', range: '12–30 t' },
  { value: 'extra_heavy', label: 'Extra Heavy', range: '30+ t' },
  { value: 'abnormal', label: 'Abnormal Load', range: 'Oversized' },
];

const URGENCY_OPTIONS = [
  { value: 'normal' as const, label: 'Normal', desc: 'Standard delivery' },
  { value: 'express' as const, label: 'Express', desc: 'Priority handling' },
  { value: 'critical' as const, label: 'Critical', desc: 'Emergency haul' },
];

export default function RequestHaul() {
  const router = useRouter();
  const { user } = useIdentity();
  const { createRequest, isLoading, error, clearError } = useShipperStore();

  const [cargoType, setCargoType] = useState('');
  const [tonnage, setTonnage] = useState<TonnageCategory>('medium');
  const [weightKg, setWeightKg] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [originLat, setOriginLat] = useState('');
  const [originLng, setOriginLng] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLng, setDestLng] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'express' | 'critical'>('normal');
  const [hazardous, setHazardous] = useState(false);
  const [fragile, setFragile] = useState(false);
  const [tempControlled, setTempControlled] = useState(false);
  const [specialReqs, setSpecialReqs] = useState('');
  const [showTonnagePicker, setShowTonnagePicker] = useState(false);

  const handleSubmit = async () => {
    clearError();
    if (!user?.id) return;
    if (!cargoType || !weightKg || !originAddress || !destAddress || !pickupDate || !deliveryDeadline) return;

    try {
      await createRequest({
        shipperId: user.id,
        cargoType,
        tonnageCategory: tonnage,
        weightKg: parseFloat(weightKg),
        originAddress,
        originLat: parseFloat(originLat) || 0,
        originLng: parseFloat(originLng) || 0,
        destAddress,
        destLat: parseFloat(destLat) || 0,
        destLng: parseFloat(destLng) || 0,
        pickupDate,
        deliveryDeadline,
        urgency,
        specialRequirements: specialReqs.split(',').map((s) => s.trim()).filter(Boolean),
      });
      router.back();
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.title}>Request a Haul</Text>
        <Text style={styles.subtitle}>Tell us what you need moved</Text>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Cargo Type</Text>
          <TextInput style={styles.input} placeholder="e.g. Construction steel, Maize, Electronics"
            placeholderTextColor="#6b7280" value={cargoType} onChangeText={setCargoType} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tonnage Category</Text>
          <Pressable style={styles.pickerButton} onPress={() => setShowTonnagePicker(!showTonnagePicker)}>
            <Truck size={16} color="#4f46e5" />
            <Text style={styles.pickerText}>
              {TONNAGE_OPTIONS.find((t) => t.value === tonnage)?.label} — {TONNAGE_OPTIONS.find((t) => t.value === tonnage)?.range}
            </Text>
            <ChevronDown size={16} color="#9ca3af" />
          </Pressable>
          {showTonnagePicker && (
            <View style={styles.pickerDropdown}>
              {TONNAGE_OPTIONS.map((opt) => (
                <Pressable key={opt.value}
                  style={[styles.pickerOption, tonnage === opt.value && styles.pickerOptionActive]}
                  onPress={() => { setTonnage(opt.value); setShowTonnagePicker(false); }}>
                  <Text style={[styles.pickerOptionText, tonnage === opt.value && styles.pickerOptionTextActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.pickerOptionRange}>{opt.range}</Text>
                  {tonnage === opt.value && <Check size={16} color="#4f46e5" />}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Exact Weight (kg)</Text>
          <View style={styles.inputRow}>
            <Weight size={16} color="#6b7280" />
            <TextInput style={[styles.input, styles.inputFlex]} placeholder="5000"
              placeholderTextColor="#6b7280" keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Pickup Location</Text>
          <View style={styles.inputRow}>
            <MapPin size={16} color="#4f46e5" />
            <TextInput style={[styles.input, styles.inputFlex]} placeholder="Full address"
              placeholderTextColor="#6b7280" value={originAddress} onChangeText={setOriginAddress} />
          </View>
          <View style={styles.coordRow}>
            <TextInput style={[styles.input, styles.coordInput]} placeholder="Lat"
              placeholderTextColor="#6b7280" keyboardType="numeric" value={originLat} onChangeText={setOriginLat} />
            <TextInput style={[styles.input, styles.coordInput]} placeholder="Lng"
              placeholderTextColor="#6b7280" keyboardType="numeric" value={originLng} onChangeText={setOriginLng} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Delivery Location</Text>
          <View style={styles.inputRow}>
            <MapPin size={16} color="#ef4444" />
            <TextInput style={[styles.input, styles.inputFlex]} placeholder="Full address"
              placeholderTextColor="#6b7280" value={destAddress} onChangeText={setDestAddress} />
          </View>
          <View style={styles.coordRow}>
            <TextInput style={[styles.input, styles.coordInput]} placeholder="Lat"
              placeholderTextColor="#6b7280" keyboardType="numeric" value={destLat} onChangeText={setDestLat} />
            <TextInput style={[styles.input, styles.coordInput]} placeholder="Lng"
              placeholderTextColor="#6b7280" keyboardType="numeric" value={destLng} onChangeText={setDestLng} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Pickup Date & Time</Text>
          <View style={styles.inputRow}>
            <Calendar size={16} color="#6b7280" />
            <TextInput style={[styles.input, styles.inputFlex]} placeholder="YYYY-MM-DD HH:00"
              placeholderTextColor="#6b7280" value={pickupDate} onChangeText={setPickupDate} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Delivery Deadline</Text>
          <View style={styles.inputRow}>
            <Calendar size={16} color="#6b7280" />
            <TextInput style={[styles.input, styles.inputFlex]} placeholder="YYYY-MM-DD HH:00"
              placeholderTextColor="#6b7280" value={deliveryDeadline} onChangeText={setDeliveryDeadline} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Urgency</Text>
          <View style={styles.urgencyRow}>
            {URGENCY_OPTIONS.map((opt) => (
              <Pressable key={opt.value}
                style={[styles.urgencyOption, urgency === opt.value && styles.urgencyOptionActive]}
                onPress={() => setUrgency(opt.value)}>
                <Text style={[styles.urgencyLabel, urgency === opt.value && styles.urgencyLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.urgencyDesc}>{opt.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Special Requirements</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="e.g. Crane needed, Side-loader, Fragile"
            placeholderTextColor="#6b7280" multiline numberOfLines={3} value={specialReqs} onChangeText={setSpecialReqs} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Hazardous Material</Text>
          <Switch value={hazardous} onValueChange={setHazardous} trackColor={{ false: '#374151', true: '#4f46e5' }} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Fragile Cargo</Text>
          <Switch value={fragile} onValueChange={setFragile} trackColor={{ false: '#374151', true: '#4f46e5' }} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Temperature Controlled</Text>
          <Switch value={tempControlled} onValueChange={setTempControlled} trackColor={{ false: '#374151', true: '#4f46e5' }} />
        </View>

        <Pressable style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isLoading}>
          <Text style={styles.submitButtonText}>{isLoading ? 'Submitting...' : 'Request Haul'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  form: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9ca3af', marginBottom: 20 },
  errorBox: { backgroundColor: '#450a0a', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#d1d5db', marginBottom: 6 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#2d2d44' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputFlex: { flex: 1 },
  coordRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  coordInput: { flex: 1 },
  textArea: { height: 80, textAlignVertical: 'top' },
  pickerButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#2d2d44' },
  pickerText: { flex: 1, color: '#fff', fontSize: 14 },
  pickerDropdown: { backgroundColor: '#1a1a2e', borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#2d2d44', overflow: 'hidden' },
  pickerOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#2d2d44' },
  pickerOptionActive: { backgroundColor: '#312e81' },
  pickerOptionText: { flex: 1, color: '#e5e7eb', fontSize: 14, fontWeight: '600' },
  pickerOptionTextActive: { color: '#fff' },
  pickerOptionRange: { color: '#9ca3af', fontSize: 12, marginRight: 8 },
  urgencyRow: { flexDirection: 'row', gap: 10 },
  urgencyOption: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2d2d44' },
  urgencyOptionActive: { borderColor: '#4f46e5', backgroundColor: '#312e81' },
  urgencyLabel: { color: '#e5e7eb', fontSize: 13, fontWeight: '700' },
  urgencyLabelActive: { color: '#fff' },
  urgencyDesc: { color: '#9ca3af', fontSize: 11, marginTop: 4 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2d2d44' },
  toggleLabel: { color: '#d1d5db', fontSize: 14 },
  submitButton: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
