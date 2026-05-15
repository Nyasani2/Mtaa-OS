import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, Alert 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface Subscription {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  next_billing: string;
  status: 'active' | 'paused' | 'cancelled';
}

export default function SubscriptionsScreen() {
  const { user } = useAuthStore();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubs();
  }, []);

  const fetchSubs = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('next_billing', { ascending: true });

    setLoading(false);

    if (error) {
      setSubs([]);
      return;
    }

    if (data) {
      setSubs(data.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        amount: s.amount,
        currency: s.currency || 'KES',
        interval: s.interval || 'monthly',
        next_billing: s.next_billing,
        status: s.status || 'active',
      })));
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSubs(subs.map(s => s.id === id ? { ...s, status: newStatus as any } : s));
    }
  };

  const handleCancel = async (id: string) => {
    Alert.alert(
      'Cancel Subscription',
      'This will stop all future billing. Are you sure?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('subscriptions')
              .update({ status: 'cancelled' })
              .eq('id', id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setSubs(subs.map(s => s.id === id ? { ...s, status: 'cancelled' as any } : s));
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'paused': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#666';
    }
  };

  const renderItem = ({ item }: { item: Subscription }) => (
    <View style={styles.subCard}>
      <View style={styles.subHeader}>
        <View>
          <Text style={styles.subName}>{item.name}</Text>
          <Text style={styles.subDesc}>{item.description}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.subDetails}>
        <Text style={styles.subAmount}>
          {item.currency} {item.amount.toFixed(2)} / {item.interval}
        </Text>
        <Text style={styles.subNext}>
          Next: {new Date(item.next_billing).toLocaleDateString()}
        </Text>
      </View>

      {item.status !== 'cancelled' && (
        <View style={styles.subActions}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleToggle(item.id, item.status)}
          >
            <Text style={styles.actionText}>
              {item.status === 'active' ? '⏸️ Pause' : '▶️ Resume'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={() => handleCancel(item.id)}
          >
            <Text style={[styles.actionText, styles.cancelText]}>🗑️ Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscriptions</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={subs}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No active subscriptions</Text>
              <Text style={styles.emptySub}>Browse the AppStore to find services</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  subCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  subName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  subDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  subDetails: { marginBottom: 12 },
  subAmount: { color: '#fff', fontSize: 14, fontWeight: '500' },
  subNext: { color: '#888', fontSize: 12, marginTop: 2 },
  subActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: '#ef444420' },
  actionText: { color: '#fff', fontSize: 13 },
  cancelText: { color: '#ef4444' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  emptySub: { color: '#444', fontSize: 12, marginTop: 8 },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
