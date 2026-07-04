import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useHealthEmergency } from '@/lib/health/hooks/useHealthEmergency';
import * as Location from 'expo-location';

export default function EmergencyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { request, loading } = useHealthEmergency(user?.id || '');
  const [requesting, setRequesting] = useState(false);

  async function handleSOS() {
    Alert.alert(
      'Emergency SOS',
      'This will dispatch an ambulance to your current location. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm SOS',
          style: 'destructive',
          onPress: async () => {
            setRequesting(true);
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Location Required', 'Please enable location for emergency dispatch');
                return;
              }
              const loc = await Location.getCurrentPositionAsync({});
              const address = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
              const dispatch = await request(
                { lat: loc.coords.latitude, lng: loc.coords.longitude, address },
                'Emergency SOS - patient initiated',
                'critical'
              );
              if (dispatch) {
                Alert.alert('Ambulance Dispatched', `Dispatch ID: ${dispatch.id.slice(0, 8)}`);
              }
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setRequesting(false);
            }
          },
        },
      ]
    );
  }

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        return `${r.street || ''} ${r.city || ''} ${r.region || ''}`.trim() || 'Unknown location';
      }
    } catch { /* ignore */ }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Emergency</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.sosSection}>
        <TouchableOpacity
          style={[styles.sosButton, (loading || requesting) && styles.sosButtonDisabled]}
          onPress={handleSOS}
          disabled={loading || requesting}
        >
          <Text style={styles.sosButtonText}>
            {requesting ? 'Requesting...' : '🚨 SOS EMERGENCY'}
          </Text>
          <Text style={styles.sosSub}>Tap to dispatch ambulance</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/health/emergency-access')}>
          <Text style={styles.actionIcon}>🩸</Text>
          <Text style={styles.actionTitle}>Emergency Card</Text>
          <Text style={styles.actionSub}>Show health info without unlock</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionIcon}>🏥</Text>
          <Text style={styles.actionTitle}>Nearby Hospitals</Text>
          <Text style={styles.actionSub}>Find closest emergency room</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionIcon}>📞</Text>
          <Text style={styles.actionTitle}>Emergency Contacts</Text>
          <Text style={styles.actionSub}>Call family or friends</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitle}>First Aid Guide</Text>
          <Text style={styles.actionSub}>Quick reference for common emergencies</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  back: { color: '#fff', fontSize: 22 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  sosSection: { alignItems: 'center', paddingVertical: 30 },
  sosButton: { backgroundColor: '#FF3B30', width: 200, height: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
  sosButtonDisabled: { opacity: 0.6 },
  sosButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  sosSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4 },
  actions: { padding: 16, gap: 10 },
  actionBtn: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { fontSize: 24 },
  actionTitle: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  actionSub: { color: '#888', fontSize: 12 },
});
