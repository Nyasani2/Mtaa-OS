import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/hooks/useAppStore';
import { getAppById } from '@/lib/mtaa/appstore/unified-registry';
import { ScreenshotCarousel } from '@/components/appstore/ScreenshotCarousel';
import { AsisChat } from '@/components/appstore/AsisChat';
import { AppReviews } from '@/components/appstore/AppReviews';
import { InstallProgress } from '@/components/appstore/InstallProgress';

export default function AppDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isInstalled, isInstalling, installApp } = useAppStore();
  const [showAsis, setShowAsis] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStatus, setInstallStatus] = useState<'downloading' | 'installing' | 'complete' | 'error'>('downloading');
  const [showInstallProgress, setShowInstallProgress] = useState(false);

  const app = getAppById(id);

  const handleInstall = useCallback(async () => {
    if (!app) return;
    setShowInstallProgress(true);
    setInstallStatus('downloading');
    setInstallProgress(0);

    try {
      await installApp(app.id);
      setInstallStatus('complete');
      setInstallProgress(100);
    } catch (error) {
      setInstallStatus('error');
    }
  }, [app, installApp]);

  const handleShare = useCallback(async () => {
    if (!app) return;
    try {
      await Share.share({
        message: `Check out ${app.name} on MTAA AppStore!`,
        title: app.name,
      });
    } catch (error) {
      // Share cancelled
    }
  }, [app]);

  if (!app) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>App Not Found</Text>
        </View>
        <View style={styles.notFound}>
          <Feather name="package" size={64} color="#9CA3AF" />
          <Text style={styles.notFoundText}>This app could not be found.</Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.push('/(os)/appstore')}>
            <Text style={styles.backHomeText}>Back to AppStore</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const installed = isInstalled(app.id);
  const installing = isInstalling(app.id);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{app.name}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Feather name="share-2" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* App Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconContainer, { backgroundColor: app.color + '20' }]}>
            <Feather name={app.icon as any} size={48} color={app.color} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.appName}>{app.name}</Text>
            <Text style={styles.appTagline}>{app.tagline || app.description}</Text>
            <Text style={styles.appDeveloper}>{app.developer || 'MTAA'}</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{app.rating}</Text>
              <Text style={styles.reviewCount}>({app.reviewCount || 0} reviews)</Text>
            </View>
          </View>
        </View>

        {/* Install / Open Button */}
        <View style={styles.actionRow}>
          {installed ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.openBtn]}
              onPress={() => router.push(app.route as any)}
            >
              <Text style={styles.openBtnText}>Open</Text>
            </TouchableOpacity>
          ) : installing ? (
            <View style={[styles.actionBtn, styles.installingBtn]}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.installingText}>Installing...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.installBtn]}
              onPress={handleInstall}
            >
              <Feather name="download" size={18} color="#fff" />
              <Text style={styles.installBtnText}>Get</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowAsis(true)}>
            <Feather name="message-circle" size={18} color="#3B82F6" />
            <Text style={styles.secondaryBtnText}>Ask ASIS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowReviews(true)}>
            <Feather name="message-square" size={18} color="#3B82F6" />
            <Text style={styles.secondaryBtnText}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{app.installCount || `${app.installs}+`}</Text>
            <Text style={styles.statLabel}>Installs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{app.size}</Text>
            <Text style={styles.statLabel}>Size</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{app.version}</Text>
            <Text style={styles.statLabel}>Version</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{app.category}</Text>
            <Text style={styles.statLabel}>Category</Text>
          </View>
        </View>

        {/* Screenshots */}
        {app.screenshots && app.screenshots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Screenshots</Text>
            <ScreenshotCarousel screenshots={app.screenshots} />
          </View>
        )}

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{app.about || app.description}</Text>
        </View>

        {/* Features */}
        {app.features && app.features.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            {app.features.map((feature, idx) => (
              <View key={idx} style={styles.featureItem}>
                <Feather name="check-circle" size={16} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Permissions */}
        {app.permissions && app.permissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permissions</Text>
            <View style={styles.tagsRow}>
              {app.permissions.map((perm, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{perm}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tags */}
        {app.tags && app.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {app.tags.map((tag, idx) => (
                <View key={idx} style={[styles.tag, { backgroundColor: app.color + '15' }]}>
                  <Text style={[styles.tagText, { color: app.color }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ranking */}
        {app.ranking && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ranking</Text>
            <View style={styles.rankingBox}>
              <Text style={styles.rankingRank}>#{app.ranking.rank}</Text>
              <Text style={styles.rankingCategory}>in {app.ranking.category}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ASIS Chat Modal */}
      <Modal visible={showAsis} animationType="slide" presentationStyle="pageSheet">
        <AsisChat appName={app.name} onClose={() => setShowAsis(false)} />
      </Modal>

      {/* Reviews Modal */}
      <Modal visible={showReviews} animationType="slide" presentationStyle="pageSheet">
        <AppReviews appId={app.id} appName={app.name} onClose={() => setShowReviews(false)} />
      </Modal>

      {/* Install Progress Overlay */}
      <Modal visible={showInstallProgress} transparent animationType="fade">
        <InstallProgress
          progress={installProgress}
          status={installStatus}
          appName={app.name}
          onClose={() => setShowInstallProgress(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1F2937' },
  shareBtn: { padding: 8 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  notFoundText: { fontSize: 16, color: '#6B7280', marginTop: 16, textAlign: 'center' },
  backHomeBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#3B82F6', borderRadius: 8 },
  backHomeText: { color: '#fff', fontWeight: '600' },

  hero: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', marginBottom: 8 },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroInfo: { flex: 1, justifyContent: 'center' },
  appName: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  appTagline: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  appDeveloper: { fontSize: 13, color: '#3B82F6', marginTop: 4, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginLeft: 4 },
  reviewCount: { fontSize: 13, color: '#9CA3AF', marginLeft: 4 },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  installBtn: { backgroundColor: '#3B82F6' },
  installBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  openBtn: { backgroundColor: '#10B981' },
  openBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  installingBtn: { backgroundColor: '#9CA3AF' },
  installingText: { color: '#fff', fontWeight: '600', fontSize: 15, marginLeft: 8 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    gap: 4,
  },
  secondaryBtnText: { color: '#3B82F6', fontWeight: '600', fontSize: 13 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },

  section: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  aboutText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },

  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  featureText: { fontSize: 14, color: '#374151', flex: 1 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  tagText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  rankingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  rankingRank: { fontSize: 20, fontWeight: '800', color: '#D97706' },
  rankingCategory: { fontSize: 14, color: '#92400E', fontWeight: '500' },
});
