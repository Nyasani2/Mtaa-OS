// @ts-nocheck
// app/(os)/tribes/index.tsx
// Tribes Discovery Screen — browse, search, filter by category

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tribesService, Tribe } from '@/lib/tribes/services/tribes.service';

export default function TribesDiscoveryScreen() {
  const router = useRouter();
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterPaid, setFilterPaid] = useState<'all' | 'free' | 'paid'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [tribesData, catsData] = await Promise.all([
      tribesService.discoverTribes({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        paid_only: filterPaid === 'paid' || undefined,
        free_only: filterPaid === 'free' || undefined,
        limit: 30,
      }),
      tribesService.getCategories(),
    ]);
    setTribes(tribesData);
    setCategories(catsData);
    setLoading(false);
  }, [selectedCategory, searchQuery, filterPaid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderTribeCard = (tribe: Tribe) => (
    <TouchableOpacity
      key={tribe.id}
      style={styles.tribeCard}
      onPress={() => router.push(`/(os)/tribes/${tribe.id}` as any)}
    >
      <Image
        source={{ uri: tribe.cover_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
        style={styles.tribeCover}
      />
      <View style={styles.tribeContent}>
        <View style={styles.tribeHeader}>
          <Image
            source={{ uri: tribe.avatar_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
            style={styles.tribeAvatar}
          />
          <View style={styles.tribeInfo}>
            <Text style={styles.tribeName} numberOfLines={1}>{tribe.name}</Text>
            <Text style={styles.tribeCategory}>{tribe.category?.icon} {tribe.category?.name}</Text>
          </View>
        </View>
        <Text style={styles.tribeDesc} numberOfLines={2}>{tribe.description}</Text>
        <View style={styles.tribeFooter}>
          <Text style={styles.tribeStats}>👥 {tribe.member_count.toLocaleString()}</Text>
          <Text style={styles.tribeStats}>📝 {tribe.post_count}</Text>
          {tribe.is_paid && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>
                {tribe.membership_currency} {tribe.membership_fee}
              </Text>
            </View>
          )}
          {tribe.is_member && (
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>Joined</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tribes</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(os)/tribes/create' as any)}>
          <Text style={styles.createBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tribes..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        <TouchableOpacity
          style={[styles.catChip, !selectedCategory && styles.catChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[!selectedCategory ? styles.catChipTextActive : styles.catChipText]}>All</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.catChipIcon}>{cat.icon}</Text>
            <Text style={[selectedCategory === cat.id ? styles.catChipTextActive : styles.catChipText]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(['all', 'free', 'paid'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filterPaid === f && styles.filterChipActive]}
            onPress={() => setFilterPaid(f)}
          >
            <Text style={filterPaid === f ? styles.filterChipTextActive : styles.filterChipText}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tribes List */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : tribes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏕️</Text>
            <Text style={styles.emptyTitle}>No tribes found</Text>
            <Text style={styles.emptyText}>Try different search terms or create your own tribe</Text>
          </View>
        ) : (
          tribes.map(renderTribeCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  createBtn: { backgroundColor: '#007AFF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  searchRow: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, fontSize: 15, color: '#fff' },

  catScroll: { paddingHorizontal: 16, marginBottom: 12 },
  catChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  catChipActive: { backgroundColor: '#007AFF' },
  catChipIcon: { fontSize: 16, marginRight: 6 },
  catChipText: { fontSize: 13, color: '#ccc' },
  catChipTextActive: { fontSize: 13, color: '#fff', fontWeight: '600' },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8 },
  filterChipActive: { backgroundColor: '#2a2a3e' },
  filterChipText: { fontSize: 12, color: '#888' },
  filterChipTextActive: { fontSize: 12, color: '#fff', fontWeight: '600' },

  scrollContent: { padding: 16, paddingBottom: 40 },
  loader: { marginTop: 60 },

  tribeCard: { backgroundColor: '#1a1a2e', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  tribeCover: { width: '100%', height: 120, resizeMode: 'cover' },
  tribeContent: { padding: 14 },
  tribeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tribeAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  tribeInfo: { flex: 1 },
  tribeName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  tribeCategory: { fontSize: 12, color: '#888', marginTop: 2 },
  tribeDesc: { fontSize: 13, color: '#aaa', lineHeight: 18, marginBottom: 10 },
  tribeFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tribeStats: { fontSize: 12, color: '#888' },
  paidBadge: { backgroundColor: '#f5a62320', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  paidBadgeText: { fontSize: 11, color: '#f5a623', fontWeight: '600' },
  memberBadge: { backgroundColor: '#00d26a20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  memberBadgeText: { fontSize: 11, color: '#00d26a', fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 40 },
});
