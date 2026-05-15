import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, Alert, Image 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface BlockedUser {
  id: string;
  blocked_user_id: string;
  blocked_name: string;
  blocked_avatar: string;
  blocked_at: string;
}

export default function BlockListScreen() {
  const { user } = useAuthStore();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlocked();
  }, []);

  const fetchBlocked = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('block_list')
      .select('*, blocked:blocked_user_id(full_name, avatar_url)')
      .eq('user_id', user.id)
      .order('blocked_at', { ascending: false });

    setLoading(false);

    if (error) {
      setBlocked([]);
      return;
    }

    if (data) {
      setBlocked(data.map((b: any) => ({
        id: b.id,
        blocked_user_id: b.blocked_user_id,
        blocked_name: b.blocked?.full_name || 'Unknown User',
        blocked_avatar: b.blocked?.avatar_url || '',
        blocked_at: b.blocked_at,
      })));
    }
  };

  const handleUnblock = async (id: string) => {
    Alert.alert(
      'Unblock User',
      'They will be able to interact with you again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            const { error } = await supabase
              .from('block_list')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setBlocked(blocked.filter(b => b.id !== id));
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userRow}>
      {item.blocked_avatar ? (
        <Image source={{ uri: item.blocked_avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.blocked_name}</Text>
        <Text style={styles.blockedDate}>
          Blocked: {new Date(item.blocked_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity style={styles.unblockBtn} onPress={() => handleUnblock(item.id)}>
        <Text style={styles.unblockText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blocked Users</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={blocked}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No blocked users</Text>
              <Text style={styles.emptySub}>Block users from their profile</Text>
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 20 },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  blockedDate: { color: '#888', fontSize: 12, marginTop: 2 },
  unblockBtn: {
    backgroundColor: '#6366f120',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  unblockText: { color: '#6366f1', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  emptySub: { color: '#444', fontSize: 12, marginTop: 8 },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
