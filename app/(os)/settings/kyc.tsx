import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  ActivityIndicator, Alert 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface KycStatus {
  level: number;
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  documents: string[];
  verified_at?: string;
}

export default function KycScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState<KycStatus>({
    level: 0,
    status: 'unverified',
    documents: [],
  });

  useEffect(() => {
    fetchKyc();
  }, []);

  const fetchKyc = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('identity_verification')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setLoading(false);

    if (error && error.code !== 'PGRST116') {
      Alert.alert('Error', error.message);
      return;
    }

    if (data) {
      setKyc({
        level: data.kyc_level || 0,
        status: data.status || 'unverified',
        documents: data.documents || [],
        verified_at: data.verified_at,
      });
    }
  };

  const getStatusColor = () => {
    switch (kyc.status) {
      case 'verified': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#666';
    }
  };

  const getLevelName = (level: number) => {
    const levels = ['Unverified', 'Basic', 'Standard', 'Advanced', 'Enterprise'];
    return levels[level] || 'Unknown';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Identity Verification</Text>

      <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <Text style={[styles.statusValue, { color: getStatusColor() }]}>
          {kyc.status.toUpperCase()}
        </Text>
        <Text style={styles.levelText}>Level: {getLevelName(kyc.level)}</Text>
        {kyc.verified_at && (
          <Text style={styles.dateText}>Verified: {new Date(kyc.verified_at).toLocaleDateString()}</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Verification Levels</Text>

      {[1, 2, 3, 4].map((level) => (
        <View key={level} style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelName}>Level {level}: {getLevelName(level)}</Text>
            {kyc.level >= level ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : (
              <Text style={styles.lock}>🔒</Text>
            )}
          </View>
          <Text style={styles.levelDesc}>
            {level === 1 && 'Email and phone verification'}
            {level === 2 && 'Government ID upload and verification'}
            {level === 3 && 'Proof of address and biometric verification'}
            {level === 4 && 'Business registration and advanced compliance'}
          </Text>
          {kyc.level < level && (
            <TouchableOpacity 
              style={styles.verifyBtn}
              onPress={() => router.push({
                pathname: '/(os)/settings/kyc-upload',
                params: { level: level.toString() }
              })}
            >
              <Text style={styles.verifyBtnText}>Start Verification</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  statusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 2,
  },
  statusLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  statusValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  levelText: { color: '#fff', fontSize: 14 },
  dateText: { color: '#888', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 12 },
  levelCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  levelName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  checkmark: { color: '#22c55e', fontSize: 18 },
  lock: { fontSize: 16 },
  levelDesc: { color: '#888', fontSize: 13, marginBottom: 12 },
  verifyBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  verifyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
