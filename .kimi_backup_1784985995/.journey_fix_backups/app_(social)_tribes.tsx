// app/(social)/tribes.tsx
// MTAA Tribes Hub — Social communities, groups, networks
// Replaces stub with real integration

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTribes } from '@/lib/tribes/hooks/useTribes';
import type { Tribe } from '@/lib/tribes/types';

export default function TribesScreen() {
  const router = useRouter();
  const { tribes, loading, error, fetchTribes } = useTribes();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-tribes'>('discover');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTribes();
    setRefreshing(false);
  }, [fetchTribes]);

  const handleTribePress = (tribe: Tribe) => {
    router.push(`/(tribes)/detail?tribeId=${tribe.id}`);
  };

  const handleCreateTribe = () => {
    router.push('/(tribes)/create');
  };

  const handleDiscovery = () => {
    router.push('/(tribes)/discovery');
  };

  const handleMyTribes = () => {
    router.push('/(tribes)/my-tribes');
  };

  const renderTribeCard = (tribe: Tribe) => (
    <TouchableOpacity
      key={tribe.id}
      style={styles.tribeCard}
      onPress={() => handleTribePress(tribe)}
    >
      <View style={styles.tribeAvatar}>
        {tribe.avatar_url ? (
          <Image source={{ uri: tribe.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="people" size={24} color="#A78BFA" />
          </View>
        )}
      </View>
      <View style={styles.tribeInfo}>
        <Text style={styles.tribeName} numberOfLines={1}>{tribe.name}</Text>
        <Text style={styles.tribeDesc} numberOfLines={2}>{tribe.description || 'No description'}</Text>
        <View style={styles.tribeMeta}>
          <Ionicons name="people" size={12} color="#8E8E93" />
          <Text style={styles.tribeMembers}>{tribe.member_count || 0} members</Text>
          {tribe.is_private && (
            <View style={styles.privateBadge}>
              <Ionicons name="lock-closed" size={10} color="#FF9500" />
              <Text style={styles.privateText}>Private</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tribes</Text>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateTribe}>
          <Ionicons name="add-circle" size={28} color="#A78BFA" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
          onPress={() => { setActiveTab('discover'); handleDiscovery(); }}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-tribes' && styles.tabActive]}
          onPress={() => { setActiveTab('my-tribes'); handleMyTribes(); }}
        >
          <Text style={[styles.tabText, activeTab === 'my-tribes' && styles.tabTextActive]}>My Tribes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading */}
        {loading && tribes.length === 0 && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#A78BFA" />
            <Text style={styles.loadingText}>Loading tribes...</Text>
          </View>
        )}

        {/* Error */}
        {error && tribes.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="alert-circle" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchTribes}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && tribes.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No tribes yet</Text>
            <Text style={styles.emptySubtitle}>Create or discover communities</Text>
            <TouchableOpacity style={styles.emptyCta} onPress={handleCreateTribe}>
              <Text style={styles.emptyCtaText}>Create Tribe</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tribe List */}
        {tribes.length > 0 && (
          <View style={styles.listContainer}>
            {tribes.map(renderTribeCard)}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={handleDiscovery}>
            <Ionicons name="compass" size={28} color="#A78BFA" />
            <Text style={styles.actionTitle}>Discover</Text>
            <Text style={styles.actionDesc}>Find new communities</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleMyTribes}>
            <Ionicons name="heart" size={28} color="#F472B6" />
            <Text style={styles.actionTitle}>My Tribes</Text>
            <Text style={styles.actionDesc}>Communities you joined</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#000' },
  createBtn: { padding: 4 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#A78BFA' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  tabTextActive: { color: '#A78BFA' },

  center: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#8E8E93' },
  errorText: { marginTop: 12, fontSize: 15, color: '#FF3B30', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#A78BFA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 6 },
  emptyCta: {
    marginTop: 20,
    backgroundColor: '#A78BFA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  listContainer: { padding: 16 },
  tribeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tribeAvatar: { marginRight: 12 },
  avatarImage: { width: 52, height: 52, borderRadius: 14 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tribeInfo: { flex: 1 },
  tribeName: { fontSize: 16, fontWeight: '700', color: '#000' },
  tribeDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2, lineHeight: 18 },
  tribeMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  tribeMembers: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  privateText: { fontSize: 10, color: '#FF9500', marginLeft: 2, fontWeight: '600' },

  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#000', marginTop: 8 },
  actionDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2, textAlign: 'center' },
});
