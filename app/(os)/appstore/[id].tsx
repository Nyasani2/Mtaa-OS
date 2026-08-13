// @ts-nocheck
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/lib/appstore/useAppStore';
import { getAppById, CATEGORY_LABELS } from '@/lib/appstore/data';

const { width: SCREEN_W } = Dimensions.get('window');

export default function AppDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getInstallStatus, installApp, isInstallingApp, uninstallApp } = useAppStore();
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'permissions'>('about');

  const app = getAppById(id as string);
  if (!app) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.push('/(os)' as any)} style={styles.iconBtn}>
            <Ionicons name="home-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.emptyText}>App not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = getInstallStatus(app.id);
  const installing = isInstallingApp(app.id);
  const installed = status === 'installed';

  const handleInstall = async () => {
    if (installed) {
      router.push(app.route as any);
    } else if (!installing) {
      await installApp(app.id);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${app.name} on MTAA AppStore!`,
        title: app.name,
      });
    } catch { /* ignore */ }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Home + Back + Share */}
        <View style={styles.topBar}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => router.push('/(os)' as any)} style={styles.iconBtn}>
              <Ionicons name="home-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* App Header */}
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: app.color || '#2563EB' }]}>
            <Ionicons name={app.icon as any} size={48} color="#fff" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{app.name}</Text>
            <Text style={styles.developer}>{app.developer}</Text>
            <View style={styles.headerMeta}>
              <Text style={styles.rating}>★ {app.rating || 0}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.metaText}>{app.reviewCount || 0} reviews</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.metaText}>{app.sizeMB || 0} MB</Text>
            </View>
          </View>
        </View>

        {/* Install Button */}
        <TouchableOpacity
          style={[styles.installBtn, installed && styles.installedBtn, installing && styles.installingBtn]}
          onPress={handleInstall}
          disabled={installing}
        >
          <Ionicons
            name={installed ? 'open-outline' : installing ? 'hourglass-outline' : 'download-outline'}
            size={18}
            color={installed ? '#3B82F6' : '#fff'}
          />
          <Text style={[styles.installText, installed && styles.installedText]}>
            {installing ? 'Installing...' : installed ? 'Open' : 'Get'}
          </Text>
        </TouchableOpacity>

        {installed && (
          <TouchableOpacity style={styles.uninstallBtn} onPress={() => uninstallApp(app.id)}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.uninstallText}>Remove App</Text>
          </TouchableOpacity>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{app.rating || 0}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(app.downloadCount || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Downloads</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{app.sizeMB || 0} MB</Text>
            <Text style={styles.statLabel}>Size</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{app.version}</Text>
            <Text style={styles.statLabel}>Version</Text>
          </View>
        </View>

        {/* Screenshots */}
        {app.screenshots && app.screenshots.length > 0 && (
          <View style={styles.screenshotsSection}>
            <Text style={styles.sectionTitle}>Screenshots</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.screenshotsScroll}>
              {app.screenshots.map((url, i) => (
                <View key={i} style={styles.screenshot}>
                  <Ionicons name="image" size={40} color="#64748B" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['about', 'reviews', 'permissions'] as const).map((tab: any) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            <Text style={styles.description}>{app.description}</Text>
            {app.tags && app.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {app.tags.map((tag: any) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{CATEGORY_LABELS[app.category]}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Developer</Text>
              <Text style={styles.infoValue}>{app.developer}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>{app.version}</Text>
            </View>
            {app.price !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Price</Text>
                <Text style={styles.infoValue}>{app.price === 0 ? 'Free' : `${app.currency || 'KES'} ${app.price}`}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            <View style={styles.reviewSummary}>
              <Text style={styles.reviewBig}>{app.rating || 0}</Text>
              <View>
                <Text style={styles.reviewStars}>{'★'.repeat(Math.round(app.rating || 0))}{'☆'.repeat(5 - Math.round(app.rating || 0))}</Text>
                <Text style={styles.reviewCount}>{app.reviewCount || 0} reviews</Text>
              </View>
            </View>
            <Text style={styles.noReviews}>Reviews coming soon...</Text>
          </View>
        )}

        {activeTab === 'permissions' && (
          <View style={styles.tabContent}>
            {app.permissions.length === 0 ? (
              <Text style={styles.noPerms}>This app does not require any permissions.</Text>
            ) : (
              app.permissions.map((perm: any) => (
                <View key={perm} style={styles.permRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
                  <Text style={styles.permText}>{perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  iconBox: { width: 88, height: 88, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { marginLeft: 16, flex: 1 },
  name: { color: '#fff', fontSize: 24, fontWeight: '700' },
  developer: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  rating: { color: '#FBBF24', fontSize: 14, fontWeight: '600' },
  dot: { color: '#475569', fontSize: 14 },
  metaText: { color: '#64748b', fontSize: 13 },
  installBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2563EB', borderRadius: 12, padding: 16,
    marginHorizontal: 20, marginTop: 8,
  },
  installedBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  installingBtn: { backgroundColor: '#1E3A5F' },
  installText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  installedText: { color: '#3B82F6' },
  uninstallBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: 20, marginTop: 8, padding: 10,
  },
  uninstallText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
    marginHorizontal: 20, marginTop: 16,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statLabel: { color: '#64748b', fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: '#334155' },
  screenshotsSection: { marginTop: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginHorizontal: 20, marginBottom: 10 },
  screenshotsScroll: { paddingHorizontal: 20 },
  screenshot: {
    width: 200, height: 120, backgroundColor: '#1E293B',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  tabContent: { paddingHorizontal: 20, paddingTop: 16 },
  description: { color: '#CBD5E1', fontSize: 14, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tag: { backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#334155' },
  tagText: { color: '#94a3b8', fontSize: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  infoLabel: { color: '#94A3B8', fontSize: 14 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  reviewBig: { color: '#fff', fontSize: 48, fontWeight: '800' },
  reviewStars: { color: '#FBBF24', fontSize: 18 },
  reviewCount: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  noReviews: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 20 },
  noPerms: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 20 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  permText: { color: '#CBD5E1', fontSize: 14 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#EF4444', fontSize: 18, marginTop: 12 },
});
