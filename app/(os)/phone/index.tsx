// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

// ─── Defensive imports ──────────────────────────────────────
let contactService: any = null;
try {
  contactService = require('@/lib/phone/services/contact-service');
} catch {}

let callLogService: any = null;
try {
  callLogService = require('@/lib/phone/services/call-log-service');
} catch {}

// ─── Types ──────────────────────────────────────────────────
interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  is_favorite?: boolean;
}

interface CallLog {
  id: string;
  contact_name: string;
  phone_number: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: number;
  created_at: string;
}

// ─── Inline fallback fetchers (defensive) ───────────────────
async function fetchContactsFallback(userId: string): Promise<Contact[]> {
  try {
    const { data, error } = await supabase
      .from('phone_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name || c.phone || 'Unknown',
      phone: c.phone || '',
      avatar: c.avatar,
      is_favorite: c.is_favorite,
    }));
  } catch (e) {
    console.warn('[Phone] fallback fetchContacts error:', e);
    return [];
  }
}

async function fetchCallLogsFallback(userId: string): Promise<CallLog[]> {
  try {
    const { data, error } = await supabase
      .from('phone_call_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map((l: any) => ({
      id: l.id,
      contact_name: l.contact_name || l.phone_number || 'Unknown',
      phone_number: l.phone_number || '',
      type: l.type || 'missed',
      duration: l.duration || 0,
      created_at: l.created_at,
    }));
  } catch (e) {
    console.warn('[Phone] fallback fetchCallLogs error:', e);
    return [];
  }
}

// ─── Safe wrappers ──────────────────────────────────────────
async function safeFetchContacts(userId: string): Promise<Contact[]> {
  const fn = contactService?.fetchContacts || contactService?.default?.fetchContacts;
  if (typeof fn === 'function') {
    try { return await fn(userId); } catch (e) {
      console.warn('[Phone] service fetchContacts failed, using fallback:', e);
    }
  }
  return fetchContactsFallback(userId);
}

async function safeFetchCallLogs(userId: string): Promise<CallLog[]> {
  const fn = callLogService?.fetchCallLogs || callLogService?.default?.fetchCallLogs;
  if (typeof fn === 'function') {
    try { return await fn(userId); } catch (e) {
      console.warn('[Phone] service fetchCallLogs failed, using fallback:', e);
    }
  }
  return fetchCallLogsFallback(userId);
}

// ─── Main Screen ────────────────────────────────────────────
export default function PhoneScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'contacts' | 'recent' | 'favorites'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [c, l] = await Promise.all([
        safeFetchContacts(user.id),
        safeFetchCallLogs(user.id),
      ]);
      setContacts(c);
      setCallLogs(l);
    } catch (e) {
      console.error('[Phone] loadData error:', e);
      Alert.alert('Error', 'Failed to load phone data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const filteredContacts = contacts.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || '').includes(searchQuery)
  );

  const favoriteContacts = contacts.filter((c) => c.is_favorite);

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'incoming': return <Ionicons name="arrow-down" size={16} color="#4CAF50" />;
      case 'outgoing': return <Ionicons name="arrow-up" size={16} color="#2196F3" />;
      case 'missed': return <Ionicons name="close" size={16} color="#F44336" />;
      default: return <Ionicons name="call" size={16} color="#999" />;
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => router.push(`/phone/contact/${item.id}` as any)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name || 'Unknown'}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
      </View>
      <TouchableOpacity style={styles.callBtn} onPress={() => {}}>
        <Ionicons name="call" size={20} color="#4CAF50" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderCallLog = ({ item }: { item: CallLog }) => (
    <TouchableOpacity style={styles.callLogItem}>
      <View style={styles.callIconWrap}>{getCallIcon(item.type)}</View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.contact_name}</Text>
        <Text style={styles.callMeta}>{item.phone_number} · {item.type}</Text>
      </View>
      <Text style={styles.callTime}>
        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Phone</Text>
        <TouchableOpacity onPress={() => router.push('/phone/dialer' as any)}>
          <Ionicons name="keypad" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['favorites', 'recent', 'contacts'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab[0].toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'contacts' && (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No contacts found' : 'No contacts yet'}
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'recent' && (
        <FlatList
          data={callLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderCallLog}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No recent calls</Text>
            </View>
          }
        />
      )}

      {activeTab === 'favorites' && (
        <FlatList
          data={favoriteContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No favorites yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#161b22',
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262d',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#21262d',
  },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  contactInfo: { flex: 1, marginLeft: 14 },
  contactName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  contactPhone: { color: '#888', fontSize: 13, marginTop: 2 },
  callBtn: { padding: 8 },
  callLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  callIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#21262d', justifyContent: 'center', alignItems: 'center' },
  callMeta: { color: '#888', fontSize: 13, marginTop: 2 },
  callTime: { color: '#666', fontSize: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#666', fontSize: 16 },
});
