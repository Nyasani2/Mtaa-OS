import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator, Alert 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface RailConfig {
  id: string;
  name: string;
  type: string;
  is_enabled: boolean;
  is_default: boolean;
  fee_percent: number;
  min_amount: number;
  max_amount: number;
  avg_speed: string;
}

export default function RailsScreen() {
  const { user } = useAuthStore();
  const [rails, setRails] = useState<RailConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRails();
  }, []);

  const fetchRails = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('rail_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    setLoading(false);

    if (error) {
      // Fallback to defaults
      setRails([
        { id: 'mpesa', name: 'M-Pesa', type: 'mobile_money', is_enabled: true, is_default: true, fee_percent: 1.5, min_amount: 10, max_amount: 150000, avg_speed: '< 30s' },
        { id: 'bank', name: 'Bank Transfer', type: 'bank', is_enabled: true, is_default: false, fee_percent: 2.0, min_amount: 100, max_amount: 1000000, avg_speed: '1-2 hrs' },
        { id: 'crypto', name: 'Crypto (USDC)', type: 'crypto', is_enabled: false, is_default: false, fee_percent: 0.5, min_amount: 5, max_amount: 50000, avg_speed: '< 5 min' },
        { id: 'card', name: 'Card Payment', type: 'card', is_enabled: true, is_default: false, fee_percent: 2.5, min_amount: 50, max_amount: 500000, avg_speed: '< 1 min' },
        { id: 'airtel', name: 'Airtel Money', type: 'mobile_money', is_enabled: true, is_default: false, fee_percent: 1.5, min_amount: 10, max_amount: 150000, avg_speed: '< 30s' },
      ]);
      return;
    }

    if (data) {
      setRails(data.map((r: any) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        is_enabled: r.is_enabled !== false,
        is_default: r.is_default || false,
        fee_percent: r.fee_percent || 0,
        min_amount: r.min_amount || 0,
        max_amount: r.max_amount || 0,
        avg_speed: r.avg_speed || 'unknown',
      })));
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('rail_configs')
      .update({ is_enabled: !current })
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setRails(rails.map(r => r.id === id ? { ...r, is_enabled: !current } : r));
    }
  };

  const handleSetDefault = async (id: string) => {
    // Clear all defaults first
    await supabase
      .from('rail_configs')
      .update({ is_default: false })
      .eq('user_id', user?.id);

    const { error } = await supabase
      .from('rail_configs')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setRails(rails.map(r => ({ ...r, is_default: r.id === id })));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'mobile_money': return '📱';
      case 'bank': return '🏦';
      case 'crypto': return '₿';
      case 'card': return '💳';
      default: return '💰';
    }
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
      <Text style={styles.title}>Payment Rails</Text>
      <Text style={styles.subtitle}>Configure how money moves</Text>

      {rails.map((rail) => (
        <View key={rail.id} style={styles.railCard}>
          <View style={styles.railHeader}>
            <Text style={styles.railIcon}>{getIcon(rail.type)}</Text>
            <View style={styles.railInfo}>
              <Text style={styles.railName}>{rail.name}</Text>
              <Text style={styles.railMeta}>
                Fee: {rail.fee_percent}% • {rail.avg_speed}
              </Text>
            </View>
            <Switch
              value={rail.is_enabled}
              onValueChange={() => handleToggle(rail.id, rail.is_enabled)}
              trackColor={{ false: '#333', true: '#6366f1' }}
              thumbColor={rail.is_enabled ? '#fff' : '#888'}
            />
          </View>

          <View style={styles.railLimits}>
            <Text style={styles.limitText}>Min: KES {rail.min_amount}</Text>
            <Text style={styles.limitText}>Max: KES {rail.max_amount.toLocaleString()}</Text>
          </View>

          {rail.is_enabled && (
            <TouchableOpacity
              style={[
                styles.defaultBtn,
                rail.is_default && styles.defaultBtnActive
              ]}
              onPress={() => handleSetDefault(rail.id)}
            >
              <Text style={[
                styles.defaultBtnText,
                rail.is_default && styles.defaultBtnTextActive
              ]}>
                {rail.is_default ? '✓ Default Rail' : 'Set as Default'}
              </Text>
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
  subtitle: { fontSize: 14, color: '#888', paddingHorizontal: 16, marginBottom: 24 },
  railCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  railHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  railIcon: { fontSize: 24, marginRight: 12 },
  railInfo: { flex: 1 },
  railName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  railMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  railLimits: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  limitText: { color: '#666', fontSize: 12 },
  defaultBtn: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  defaultBtnActive: { backgroundColor: '#6366f120', borderWidth: 1, borderColor: '#6366f1' },
  defaultBtnText: { color: '#888', fontSize: 13 },
  defaultBtnTextActive: { color: '#6366f1', fontWeight: '600' },
  backButton: { marginTop: 16, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
