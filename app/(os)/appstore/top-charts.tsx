import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/hooks/useAppStore';
import { AppCard } from '@/components/appstore/AppCard';

export default function TopChartsPage() {
  const router = useRouter();
  const { getTopCharts, isInstalled, isInstalling, installApp } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'free' | 'paid' | 'top-grossing'>('all');

  const allApps = getTopCharts();
  const filteredApps = filter === 'all' ? allApps :
    filter === 'free' ? allApps.filter(a => !a.isSystem) :
    filter === 'paid' ? allApps.filter(a => a.isSystem) :
    allApps.filter(a => a.ranking !== undefined);

  const handleInstall = (appId: string) => installApp(appId);
  const handleOpen = (route: string) => router.push(route as any);
  const handleAppPress = (appId: string) => router.push(`/(os)/appstore/${appId}` as any);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Charts</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={styles.filterListContent}
      >
        {(['all', 'free', 'paid', 'top-grossing'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? 'All' : f === 'free' ? 'Free' : f === 'paid' ? 'Paid' : 'Top Grossing'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ranked List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredApps.map((app, index) => (
          <View key={app.id} style={styles.rankRow}>
            <Text style={[styles.rankNumber, index < 3 && styles.rankNumberTop]}>
              {index + 1}
            </Text>
            <View style={styles.rankCard}>
              <AppCard
                app={app}
                isInstalled={isInstalled(app.id)}
                isInstalling={isInstalling(app.id)}
                onInstall={handleInstall}
                onOpen={handleOpen}
                onPress={handleAppPress}
                variant="horizontal"
              />
            </View>
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  filterList: {
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  filterListContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1C1C1C',
  },
  filterTabActive: {
    backgroundColor: '#4ECDC4',
  },
  filterTabText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#121212',
    fontWeight: '700',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankNumber: {
    color: '#666',
    fontSize: 18,
    fontWeight: '700',
    width: 32,
    textAlign: 'center',
  },
  rankNumberTop: {
    color: '#4ECDC4',
    fontSize: 20,
  },
  rankCard: {
    flex: 1,
  },
  bottomSpacer: {
    height: 40,
  },
});
