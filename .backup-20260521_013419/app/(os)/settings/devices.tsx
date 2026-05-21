import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, Alert 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface Device {
  id: string;
  device_name: string;
  device_type: string;
  last_active: string;
  ip_address: string;
  is_current: boolean;
}

export default function DevicesScreen() {
  const { user } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_active', { ascending: false });

    setLoading(false);

    if (error) {
      // Fallback: show empty state with instruction
      setDevices([]);
      return;
    }

    if (data) {
      setDevices(data.map((d: any) => ({
        id: d.id,
        device_name: d.device_name || 'Unknown Device',
        device_type: d.device_type || 'mobile',
        last_active: d.last_active,
        ip_address: d.ip_address || 'Unknown',
        is_current: d.is_current || false,
      })));
    }
  };

  const handleRevoke = async (deviceId: string) => {
    Alert.alert(
      'Revoke Access',
      'This device will be signed out immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('user_devices')
              .delete()
              .eq('id', deviceId);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setDevices(devices.filter(d => d.id !== deviceId));
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Device }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceIcon}>
          {item.device_type === 'mobile' ? '📱' : item.device_type === 'web' ? '💻' : '🖥️'}
        </Text>
        <View style={styles.deviceDetails}>
          <Text style={styles.deviceName}>
            {item.device_name} {item.is_current && <Text style={styles.currentTag}>(Current)</Text>}
          </Text>
          <Text style={styles.deviceMeta}>
            {item.ip_address} • {new Date(item.last_active).toLocaleDateString()}
          </Text>
        </View>
      </View>
      {!item.is_current && (
        <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevoke(item.id)}>
          <Text style={styles.revokeText}>Revoke</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Devices</Text>
      <Text style={styles.subtitle}>Manage devices signed into your account</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={devices}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No devices found</Text>
              <Text style={styles.emptySub}>Device tracking will appear here once active</Text>
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
  subtitle: { fontSize: 14, color: '#888', paddingHorizontal: 16, marginBottom: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  deviceIcon: { fontSize: 24, marginRight: 12 },
  deviceDetails: { flex: 1 },
  deviceName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  currentTag: { color: '#22c55e', fontSize: 12 },
  deviceMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  revokeBtn: {
    backgroundColor: '#ef444420',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  revokeText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  emptySub: { color: '#444', fontSize: 12, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
