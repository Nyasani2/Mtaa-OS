import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Dimensions, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useAppStore } from '@/lib/appstore/useAppStore';
import {
  ALL_APPS, getFeaturedApps, getTrendingApps, searchApps,
  CATEGORY_LABELS, CATEGORY_COLORS,
} from '@/lib/appstore/data';
import { AppManifest } from '@/lib/appstore/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 48) / 2;

export default function AppStoreScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const {
    isReady, getInstallStatus, installApp, isInstallingApp,
    installedCount, getAppsWithUpdates,
  } = useAppStore();

  const isDeveloper = profile?.is_developer || user?.user_metadata?.is_developer || false;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const featured = getFeaturedApps();
  const trending = getTrendingApps();
  const updates = getAppsWithUpdates();

  const filteredApps = searchQuery.trim()
    ? searchApps(searchQuery)
    : activeCategory === 'all'
      ? ALL_APPS.filter(a => !a.devOnly || isDeveloper)
      : ALL_APPS.filter(a => a.category === activeCategory && (!a.devOnly || isDeveloper));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(os)')} style={styles.homeBtn}>
          <Ionicons name="home-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>AppStore</Text>
          <Text style={styles.headerSub}>Discover MTAA apps</Text>
        </View>
        <View style={styles.headerActions}>
          {updates.length > 0 && (
            <TouchableOpacity style={styles.updateBadge} onPress={() => router.push('/(os)/appstore/updates' as any)}>
              <Ionicons name="arrow-up-circle" size={20} color="#F59E0B" />
              <Text style={styles.updateBadgeText}>{updates.length}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.myAppsBtn} onPress={() => router.push('/(os)/appstore/my-apps' as any)}>
            <Ionicons name="apps-outline" size={20} color="#fff" />
            {installedCount > 0 && (
              <View style={styles.installedDot}><Text style={styles.installedDotText}>{installedCount}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      >
        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search apps, games, developers..."
            placeholderTextColor="#64748b"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Tabs */}
        {!searchQuery && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>
                  {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Featured Banner */}
        {!searchQuery && activeCategory === 'all' && featured.length > 0 && (
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>Featured</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled>
              {featured.map(app => (
                <TouchableOpacity
                  key={app.id}
                  style={styles.featuredCard}
                  onPress={() => router.push({ pathname: '/(os)/appstore/[id]', params: { id: app.id } })}
                >
                  <View style={[styles.featuredIcon, { backgroundColor: app.color + '20' }]}>
                    <Ionicons name={app.icon as any} size={40} color={app.color} />
                  </View>
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredName}>{app.name}</Text>
                    <Text style={styles.featuredDesc} numberOfLines={2}>{app.shortDescription || app.description}</Text>
                    <View style={styles.featuredMeta}>
                      <Text style={styles.featuredRating}>★ {app.rating}</Text>
                      <Text style={styles.featuredDev}>{app.developer}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Trending */}
        {!searchQuery && activeCategory === 'all' && trending.length > 0 && (
          <View style={styles.trendingSection}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {trending.map((app, i) => (
                <TouchableOpacity
                  key={app.id}
                  style={styles.trendingCard}
                  onPress={() => router.push({ pathname: '/(os)/appstore/[id]', params: { id: app.id } })}
                >
                  <View style={[styles.trendingRank, { backgroundColor: i < 3 ? '#F59E0B' : '#334155' }]}>
                    <Text style={styles.trendingRankText}>{i + 1}</Text>
                  </View>
                  <View style={[styles.trendingIcon, { backgroundColor: app.color + '20' }]}>
                    <Ionicons name={app.icon as any} size={28} color={app.color} />
                  </View>
                  <Text style={styles.trendingName} numberOfLines={1}>{app.name}</Text>
                  <Text style={styles.trendingCat}>{CATEGORY_LABELS[app.category]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* App Grid */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Results for "${searchQuery}"` : activeCategory === 'all' ? 'All Apps' : CATEGORY_LABELS[activeCategory]}
          </Text>
          <View style={styles.grid}>
            {filteredApps.map(app => (
              <AppCard
                key={app.id}
                app={app}
                status={getInstallStatus(app.id)}
                onInstall={() => installApp(app.id)}
                onPress={() => router.push({ pathname: '/(os)/appstore/[id]', params: { id: app.id } })}
              />
            ))}
          </View>
        </View>

        {/* Developer CTA */}
        {!searchQuery && (
          <TouchableOpacity style={styles.devCard} onPress={() => router.push('/(os)/developer' as any)}>
            <Ionicons name="code-slash" size={28} color="#6366F1" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.devTitle}>Are you a developer?</Text>
              <Text style={styles.devDesc}>Submit your app to the MTAA AppStore and reach millions of users.</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#6366F1" />
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AppCard({ app, status, onInstall, onPress }: {
  app: AppManifest;
  status: string;
  onInstall: () => void;
  onPress: () => void;
}) {
  const isInstalling = status === 'installing';
  const isInstalled = status === 'installed';

  return (
    <TouchableOpacity style={styles.appCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.appIcon, { backgroundColor: app.color + '20' }]}>
        <Ionicons name={app.icon as any} size={32} color={app.color} />
      </View>
      <Text style={styles.appName} numberOfLines={1}>{app.name}</Text>
      <Text style={styles.appCat}>{CATEGORY_LABELS[app.category]}</Text>
      <View style={styles.appMeta}>
        <Text style={styles.appRating}>★ {app.rating}</Text>
        <Text style={styles.appSize}>{app.sizeMB} MB</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.installBtn,
          isInstalled && styles.installedBtn,
          isInstalling && styles.installingBtn,
        ]}
        onPress={(e) => { e.stopPropagation(); if (!isInstalled && !isInstalling) onInstall(); }}
        disabled={isInstalled || isInstalling}
      >
        <Text style={[
          styles.installText,
          isInstalled && styles.installedText,
        ]}>
          {isInstalling ? '...' : isInstalled ? 'Open' : 'Get'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  homeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  updateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#451a03', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  updateBadgeText: { color: '#F59E0B', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  myAppsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  installedDot: { position: 'absolute', top: -4, right: -4, backgroundColor: '#10B981', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  installedDotText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, marginLeft: 8 },
  categoryScroll: { paddingHorizontal: 20, marginBottom: 16 },
  categoryTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', marginRight: 8 },
  categoryTabActive: { backgroundColor: '#3B82F6' },
  categoryTabText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  categoryTabTextActive: { color: '#fff' },
  featuredSection: { marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginHorizontal: 20, marginBottom: 12 },
  featuredCard: { width: SCREEN_W - 40, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginHorizontal: 20, marginRight: 12, borderWidth: 1, borderColor: '#334155' },
  featuredIcon: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  featuredInfo: { flex: 1, marginLeft: 14 },
  featuredName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  featuredDesc: { color: '#94a3b8', fontSize: 13, marginTop: 4, lineHeight: 18 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
  featuredRating: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  featuredDev: { color: '#64748b', fontSize: 12 },
  trendingSection: { marginBottom: 20 },
  trendingCard: { width: 100, alignItems: 'center', marginRight: 12, marginLeft: 4 },
  trendingRank: { position: 'absolute', top: -4, left: -4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  trendingRankText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  trendingIcon: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  trendingName: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  trendingCat: { color: '#64748b', fontSize: 10, marginTop: 2 },
  gridSection: { paddingHorizontal: 20, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  appCard: { width: CARD_W, backgroundColor: '#1e293b', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  appIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  appName: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center', width: '100%' },
  appCat: { color: '#64748b', fontSize: 11, marginTop: 2 },
  appMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  appRating: { color: '#F59E0B', fontSize: 11, fontWeight: '600' },
  appSize: { color: '#64748b', fontSize: 10 },
  installBtn: { marginTop: 8, backgroundColor: '#3B82F6', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 6, minWidth: 70, alignItems: 'center' },
  installedBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  installingBtn: { backgroundColor: '#1e3a5f' },
  installText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  installedText: { color: '#3B82F6' },
  devCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  devTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  devDesc: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
});
