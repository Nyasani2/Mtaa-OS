// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileService } from '@/lib/profile/services/profile-service';
import type { Profile } from '@/lib/profile/types';

export default function ProfileSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    try { const data = await ProfileService.searchProfiles(query); setResults(data); } finally { setLoading(false); }
  }, [query]);

  const renderItem = ({ item }: { item: Profile }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => router.push(`/profile/${item.user_id}` as any)}>
      {item.avatar_url ? <Image source={{ uri: item.avatar_url }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarPlaceholder]}><Ionicons name="person" size={20} color="#fff" /></View>}
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{item.display_name || item.username || 'User'}</Text>
          {item.is_verified && <Ionicons name="checkmark-circle" size={14} color="#00d4ff" style={{ marginLeft: 4 }} />}
        </View>
        <Text style={styles.username}>@{item.username || 'user'}</Text>
        {item.profession && <Text style={styles.profession}>{item.profession}</Text>}
        {[item.city, item.country].filter(Boolean).join(', ') ? <Text style={styles.location}>{[item.city, item.country].filter(Boolean).join(', ')}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#444" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#555" />
          <TextInput style={styles.searchInput} placeholder="Search by name, username, profession..." placeholderTextColor="#555" value={query} onChangeText={setQuery} onSubmitEditing={search} autoFocus />
          {query.length > 0 && <TouchableOpacity onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color="#555" /></TouchableOpacity>}
        </View>
      </View>
      {loading && <View style={styles.center}><ActivityIndicator size="large" color="#00d4ff" /></View>}
      <FlatList data={results} keyExtractor={item => item.user_id} renderItem={renderItem} ListEmptyComponent={!loading && query.length > 0 ? <View style={styles.empty}><Ionicons name="search-outline" size={48} color="#444" /><Text style={styles.emptyText}>No results for "{query}"</Text></View> : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', gap: 12 },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 10, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: '#222' },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, marginLeft: 8 },
  center: { paddingVertical: 40, alignItems: 'center' },
  resultCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  displayName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  username: { color: '#888', fontSize: 12, marginTop: 1 },
  profession: { color: '#aaa', fontSize: 11, marginTop: 2 },
  location: { color: '#666', fontSize: 10, marginTop: 1 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 14, marginTop: 12 },
});
