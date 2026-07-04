import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getEmergencyData, EmergencyData } from '@/lib/health/security/emergency-card';

export default function EmergencyAccessScreen() {
  const router = useRouter();
  const [data, setData] = useState<EmergencyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const d = await getEmergencyData();
    setData(d);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading emergency info...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.warning}>⚠️ No emergency data configured</Text>
        <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/(os)/health/emergency-card')}>
          <Text style={styles.setupText}>Set Up Emergency Info</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>⚠️</Text>
        <Text style={styles.bannerTitle}>EMERGENCY HEALTH INFO</Text>
        <Text style={styles.bannerSub}>No unlock required — visible to first responders</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>👤 NAME</Text>
        <Text style={styles.cardValue}>{data.fullName}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>🩸 BLOOD GROUP</Text>
        <Text style={styles.cardValue}>{data.bloodGroup}</Text>
      </View>

      {data.allergies.length > 0 && (
        <View style={[styles.card, styles.warningCard]}>
          <Text style={styles.cardLabel}>⚠️ ALLERGIES</Text>
          {data.allergies.map((a, i) => (
            <Text key={i} style={styles.warningValue}>• {a}</Text>
          ))}
        </View>
      )}

      {data.chronicConditions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>🏥 CONDITIONS</Text>
          {data.chronicConditions.map((c, i) => (
            <Text key={i} style={styles.cardValue}>• {c}</Text>
          ))}
        </View>
      )}

      {data.currentCriticalMedications.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>💊 CURRENT MEDS</Text>
          {data.currentCriticalMedications.map((m, i) => (
            <Text key={i} style={styles.cardValue}>• {m}</Text>
          ))}
        </View>
      )}

      {data.emergencyContacts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>📞 EMERGENCY CONTACTS</Text>
          {data.emergencyContacts.map((c, i) => (
            <View key={i} style={styles.contactRow}>
              <Text style={styles.cardValue}>{c.name} ({c.relationship})</Text>
              <TouchableOpacity>
                <Text style={styles.callText}>{c.phone}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>🫀 ORGAN DONOR</Text>
        <Text style={styles.cardValue}>{data.organDonor ? 'Yes' : 'No'}</Text>
      </View>

      <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/(os)/health/emergency-card')}>
        <Text style={styles.editText}>✏️ Edit Emergency Info</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Full records require biometric or PIN authentication</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16 },
  loading: { color: '#fff', textAlign: 'center', marginTop: 100 },
  warning: { color: '#FF9500', textAlign: 'center', marginTop: 100, fontSize: 16 },
  setupBtn: { backgroundColor: '#007AFF', margin: 20, padding: 16, borderRadius: 12, alignItems: 'center' },
  setupText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  banner: { backgroundColor: '#FF3B30', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  bannerIcon: { fontSize: 32, marginBottom: 8 },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 10 },
  warningCard: { borderLeftWidth: 4, borderLeftColor: '#FF3B30' },
  cardLabel: { color: '#888', fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 1 },
  cardValue: { color: '#fff', fontSize: 16, fontWeight: '500' },
  warningValue: { color: '#FF9500', fontSize: 15, fontWeight: '500' },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  callText: { color: '#34C759', fontSize: 14, fontWeight: '600' },
  editBtn: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  editText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: '#666', fontSize: 12 },
});
