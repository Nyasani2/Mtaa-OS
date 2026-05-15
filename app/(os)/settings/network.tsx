import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';

interface NetworkStatus {
  connected: boolean;
  type: string;
  speed: string;
  latency: number | null;
  supabaseStatus: 'connected' | 'error' | 'checking';
}

export default function NetworkScreen() {
  const [status, setStatus] = useState<NetworkStatus>({
    connected: false,
    type: 'unknown',
    speed: 'unknown',
    latency: null,
    supabaseStatus: 'checking',
  });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkNetwork();
  }, []);

  const checkNetwork = async () => {
    const netInfo = await NetInfo.fetch();
    
    setStatus(s => ({
      ...s,
      connected: netInfo.isConnected || false,
      type: netInfo.type,
      speed: netInfo.isConnected ? (netInfo.details as any)?.linkSpeed || 'unknown' : 'offline',
    }));

    // Test Supabase latency
    const start = Date.now();
    try {
      const { error } = await supabase.from('health_check').select('count', { count: 'exact', head: true });
      const latency = Date.now() - start;
      setStatus(s => ({
        ...s,
        latency: error ? null : latency,
        supabaseStatus: error ? 'error' : 'connected',
      }));
    } catch {
      setStatus(s => ({ ...s, latency: null, supabaseStatus: 'error' }));
    }
  };

  const handleTest = async () => {
    setTesting(true);
    await checkNetwork();
    setTesting(false);
  };

  const getStatusColor = () => {
    if (!status.connected) return '#ef4444';
    if (status.supabaseStatus === 'error') return '#f59e0b';
    return '#22c55e';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Network</Text>

      <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
        <Text style={styles.statusLabel}>Overall Status</Text>
        <Text style={[styles.statusValue, { color: getStatusColor() }]}>
          {!status.connected ? 'OFFLINE' : status.supabaseStatus === 'error' ? 'DEGRADED' : 'HEALTHY'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{status.type.toUpperCase()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Speed</Text>
          <Text style={styles.detailValue}>{status.speed}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Supabase Latency</Text>
          <Text style={styles.detailValue}>
            {status.latency ? `${status.latency}ms` : 'N/A'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Backend</Text>
          <Text style={[
            styles.detailValue,
            { color: status.supabaseStatus === 'connected' ? '#22c55e' : '#ef4444' }
          ]}>
            {status.supabaseStatus === 'connected' ? '✓ Connected' : '✗ Unreachable'}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.testButton, testing && styles.testButtonDisabled]} 
        onPress={handleTest} 
        disabled={testing}
      >
        <Text style={styles.testButtonText}>
          {testing ? 'Testing...' : '🔄 Run Network Test'}
        </Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rails Status</Text>
        
        <View style={styles.railRow}>
          <Text style={styles.railName}>M-Pesa</Text>
          <Text style={styles.railStatus}>🟢 Active</Text>
        </View>
        <View style={styles.railRow}>
          <Text style={styles.railName}>Bank Transfer</Text>
          <Text style={styles.railStatus}>🟢 Active</Text>
        </View>
        <View style={styles.railRow}>
          <Text style={styles.railName}>Crypto</Text>
          <Text style={styles.railStatus}>🟡 Maintenance</Text>
        </View>
        <View style={styles.railRow}>
          <Text style={styles.railName}>Card</Text>
          <Text style={styles.railStatus}>🟢 Active</Text>
        </View>
      </View>

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
  statusValue: { fontSize: 20, fontWeight: 'bold' },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  detailLabel: { color: '#888', fontSize: 14 },
  detailValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  testButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  testButtonDisabled: { opacity: 0.6 },
  testButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  railRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  railName: { color: '#fff', fontSize: 15 },
  railStatus: { fontSize: 14 },
  backButton: { marginTop: 16, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
