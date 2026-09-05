// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function BlockedContactsScreen() {
  const { user } = useAuthStore();
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadBlocked = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('blocked_contacts')
        .select('*, blocked:user_profiles!inner(first_name, last_name, email)')
        .eq('blocker_id', user?.id)
        .order('created_at', { ascending: false });
      setBlocked(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBlocked(); }, []);

  const searchUsers = async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .neq('user_id', user?.id)
        .limit(10);
      setSearchResults(data || []);
    } finally {
      setSearching(false);
    }
  };

  const blockUser = async (userId, name) => {
    try {
      const { error } = await supabase.from('blocked_contacts').insert({
        blocker_id: user?.id,
        blocked_user_id: userId,
        reason: 'User requested',
      });
      if (error) throw error;
      Alert.alert('Success', `${name} has been blocked`);
      setShowAdd(false);
      setSearchQuery('');
      setSearchResults([]);
      loadBlocked();
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to block user');
    }
  };

  const unblockUser = async (blockId, name) => {
    Alert.alert('Unblock', `Unblock ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('blocked_contacts').delete().eq('id', blockId);
            if (error) throw error;
            loadBlocked();
          } catch (err) {
            Alert.alert('Error', err?.message || 'Failed to unblock');
          }
        }
      }
    ]);
  };

  if (loading) return <View style={[s.container, s.center]}><ActivityIndicator size="large" color="#ef4444" /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Text style={s.title}>Blocked Contacts</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Ionicons name={showAdd ? 'close' : 'add'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={s.addSection}>
          <TextInput
            style={s.searchInput}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchUsers}
          />
          {searching && <ActivityIndicator size="small" color="#ef4444" style={{ marginTop: 8 }} />}
          {searchResults.map((u) => (
            <TouchableOpacity key={u.user_id} style={s.searchResult} onPress={() => blockUser(u.user_id, `${u.first_name} ${u.last_name}`)}>
              <View style={s.userAvatar}>
                <Ionicons name="person" size={20} color="#64748b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.userName}>{u.first_name} {u.last_name}</Text>
                <Text style={s.userEmail}>{u.email}</Text>
              </View>
              <Ionicons name="add-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {blocked.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="shield-checkmark" size={64} color="#cbd5e1" />
          <Text style={s.emptyText}>No blocked contacts</Text>
        </View>
      ) : (
        blocked.map((b) => (
          <View key={b.id} style={s.blockedItem}>
            <View style={s.userAvatar}>
              <Ionicons name="person" size={20} color="#64748b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName}>{b.blocked?.first_name} {b.blocked?.last_name}</Text>
              <Text style={s.userEmail}>{b.blocked?.email}</Text>
              <Text style={s.blockedDate}>Blocked {new Date(b.created_at).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => unblockUser(b.id, `${b.blocked?.first_name} ${b.blocked?.last_name}`)}>
              <Ionicons name="unlock" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  addSection: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 16 },
  searchInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  searchResult: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  userEmail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  blockedDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
  blockedItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
});
