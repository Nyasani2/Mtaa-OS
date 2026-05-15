import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, Alert, Image 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface InstalledApp {
  id: string;
  name: string;
  icon: string;
  version: string;
  installed_at: string;
  size_mb: number;
  is_active: boolean;
}

export default function InstalledAppsScreen() {
  const { user } = useAuthStore();
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('installed_apps')
      .select('*, app:app_id(*)')
      .eq('user_id', user.id)
      .order('installed_at', { ascending: false });

    setLoading(false);

    if (error) {
      setApps([]);
      return;
    }

    if (data) {
      setApps(data.map((item: any) => ({
        id: item.id,
        name: item.app?.name || 'Unknown',
        icon: item.app?.icon || '📱',
        version: item.app?.version || '1.0.0',
        installed_at: item.installed_at,
        size_mb: item.app?.size_mb || 0,
        is_active: item.is_active !== false,
      })));
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('installed_apps')
      .update({ is_active: !current })
      .eq('id', id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setApps(apps.map(a => a.id === id ? { ...a, is_active: !current } : a));
    }
  };

  const handleUninstall = async (id: string) => {
    Alert.alert(
      'Uninstall App',
      'This will remove the app and its data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('installed_apps')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setApps(apps.filter(a => a.id !== id));
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: InstalledApp }) => (
    <View style={styles.appCard}>
      <View style={styles.appHeader}>
        <Text style={styles.appIcon}>{item.icon}</Text>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>{item.name}</Text>
          <Text style={styles.appMeta}>
            v{item.version} • {item.size_mb} MB • {new Date(item.installed_at).toLocaleDateString()}
          </Text>
        </View>
        <Switch
          value={item.is_active}
          onValueChange={() => handleToggle(item.id, item.is_active)}
          trackColor={{ false: '#333', true: '#6366f1' }}
          thumbColor={item.is_active ? '#fff' : '#888'}
        />
      </View>
      <TouchableOpacity style={styles.uninstallBtn} onPress={() => handleUninstall(item.id)}>
        <Text style={styles.uninstallText}>Uninstall</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Installed Apps</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={apps}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No apps installed</Text>
              <Text style={styles.emptySub}>Visit the AppStore to discover apps</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.storeBtn} onPress={() => router.push('/(os)/app-store')}>
        <Text style={styles.storeBtnText}>🛒 Browse AppStore</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  list: { paddingHorizontal: 16, paddingBottom: 160 },
  appCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  appHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  appIcon: { fontSize: 32, marginRight: 12 },
  appInfo: { flex: 1 },
  appName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  appMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  uninstallBtn: { alignSelf: 'flex-start' },
  uninstallText: { color: '#ef4444', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  emptySub: { color: '#444', fontSize: 12, marginTop: 8 },
  storeBtn: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  storeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { position: 'absolute', bottom: 16, left: 16, right: 16, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
