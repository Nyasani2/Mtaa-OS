import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const { width } = Dimensions.get('window');

interface LiveRoom {
  id: string;
  title: string;
  host_name: string;
  host_id: string;
  viewers: number;
  is_private: boolean;
  is_scheduled: boolean;
  scheduled_at?: string;
  co_hosts: string[];
}

const MOCK_LIVES: LiveRoom[] = [
  { id: '1', title: 'Morning Vibes', host_name: 'DJ_Kevo', host_id: 'u1', viewers: 1240, is_private: false, is_scheduled: false, co_hosts: ['MC_Tina'] },
  { id: '2', title: 'Cooking Live', host_name: 'ChefMama', host_id: 'u2', viewers: 856, is_private: false, is_scheduled: false, co_hosts: [] },
  { id: '3', title: 'Private Q&A', host_name: 'TechGuru', host_id: 'u3', viewers: 45, is_private: true, is_scheduled: false, co_hosts: [] },
  { id: '4', title: 'Live Concert', host_name: 'BandX', host_id: 'u4', viewers: 0, is_private: false, is_scheduled: true, scheduled_at: '2026-06-26T20:00:00Z', co_hosts: ['BackupVocals'] },
];

export default function LiveScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'live' | 'scheduled'>('live');
  const [showCreate, setShowCreate] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  const liveRooms = MOCK_LIVES.filter((r: any) => !r.is_scheduled);
  const scheduledRooms = MOCK_LIVES.filter((r: any) => r.is_scheduled);

  const handleCreateLive = useCallback(async () => {
    if (!liveTitle.trim()) {
      Alert.alert('Enter a title');
      return;
    }
    setCreating(true);
    setTimeout(() => {
      setCreating(false);
      setShowCreate(false);
      setLiveTitle('');
      Alert.alert('Live Started', `Your ${isPrivate ? 'private' : 'public'} live stream is now active.`);
    }, 1000);
  }, [liveTitle, isPrivate]);

  const openLive = useCallback((room: LiveRoom) => {
    router.push(`/streets/live/${room.id}` as any);
  }, [router]);

  const openProfile = useCallback((hostId: string) => {
    router.push(`/(os)/profile/${hostId}` as any);
  }, [router]);

  const renderRoom = useCallback(({ item }: { item: LiveRoom }) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => openLive(item)}>
      <View style={styles.roomThumb}>
        <Ionicons name="videocam" size={32} color="#ff4444" />
        {item.is_private && (
          <View style={styles.privateBadge}>
            <Ionicons name="lock-closed" size={10} color="#fff" />
            <Text style={styles.privateText}>Private</Text>
          </View>
        )}
      </View>
      <View style={styles.roomBody}>
        <Text style={styles.roomTitle}>{item.title}</Text>
        <TouchableOpacity onPress={() => openProfile(item.host_id)}>
          <Text style={styles.roomHost}>@{item.host_name}</Text>
        </TouchableOpacity>
        <View style={styles.roomMeta}>
          <Ionicons name="eye" size={12} color="#888" />
          <Text style={styles.roomMetaText}>{item.viewers.toLocaleString()} watching</Text>
          {item.co_hosts.length > 0 && (
            <>
              <Ionicons name="people" size={12} color="#888" style={{ marginLeft: 8 }} />
              <Text style={styles.roomMetaText}>{item.co_hosts.length} co-hosts</Text>
            </>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  ), [openLive, openProfile]);

  const renderScheduled = useCallback(({ item }: { item: LiveRoom }) => (
    <View style={styles.roomCard}>
      <View style={[styles.roomThumb, { backgroundColor: '#0d1f33' }]}>
        <Ionicons name="calendar" size={28} color="#2196F3" />
      </View>
      <View style={styles.roomBody}>
        <Text style={styles.roomTitle}>{item.title}</Text>
        <TouchableOpacity onPress={() => openProfile(item.host_id)}>
          <Text style={styles.roomHost}>@{item.host_name}</Text>
        </TouchableOpacity>
        <Text style={styles.scheduledTime}>
          {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : 'Scheduled'}
        </Text>
      </View>
      <TouchableOpacity style={styles.remindBtn}>
        <Text style={styles.remindText}>Remind</Text>
      </TouchableOpacity>
    </View>
  ), [openProfile]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.backBtn}>
          <Ionicons name="add-circle" size={26} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'live' && styles.tabActive]}
          onPress={() => setActiveTab('live')}
        >
          <Text style={[styles.tabText, activeTab === 'live' && styles.tabTextActive]}>Live Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scheduled' && styles.tabActive]}
          onPress={() => setActiveTab('scheduled')}
        >
          <Text style={[styles.tabText, activeTab === 'scheduled' && styles.tabTextActive]}>Scheduled</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'live' ? liveRooms : scheduledRooms}
        renderItem={activeTab === 'live' ? renderRoom : renderScheduled}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {activeTab === 'live' ? 'No live streams right now' : 'No scheduled streams'}
            </Text>
          </View>
        }
      />

      {showCreate && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Go Live</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Live stream title..."
              placeholderTextColor="#666"
              value={liveTitle}
              onChangeText={setLiveTitle}
            />
            <TouchableOpacity
              style={[styles.toggleRow, isPrivate && styles.toggleRowActive]}
              onPress={() => setIsPrivate(!isPrivate)}
            >
              <Ionicons name={isPrivate ? 'lock-closed' : 'globe'} size={18} color={isPrivate ? '#ff4444' : '#2196F3'} />
              <Text style={styles.toggleText}>{isPrivate ? 'Private Stream' : 'Public Stream'}</Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.goLiveBtn} onPress={handleCreateLive} disabled={creating}>
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.goLiveText}>Start Live</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2196F3' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  roomThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#1a0505',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  privateBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  privateText: { color: '#fff', fontSize: 8, marginLeft: 1 },
  roomBody: { flex: 1 },
  roomTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  roomHost: { color: '#2196F3', fontSize: 13, marginTop: 2 },
  roomMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  roomMetaText: { color: '#888', fontSize: 12, marginLeft: 4 },
  scheduledTime: { color: '#888', fontSize: 12, marginTop: 4 },
  remindBtn: { backgroundColor: '#2196F3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  remindText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 15 },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    width: width - 48,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  toggleRowActive: { backgroundColor: '#2a1515' },
  toggleText: { color: '#fff', fontSize: 14, marginLeft: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: '#888', fontSize: 14 },
  goLiveBtn: { backgroundColor: '#ff4444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  goLiveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
