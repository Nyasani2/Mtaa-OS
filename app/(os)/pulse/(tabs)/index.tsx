import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { usePulseHome } from '@/domains/pulse/hooks/usePulseHome';
import { TrendingSection } from '@/domains/pulse/components/TrendingSection';
import { AlertSection } from '@/domains/pulse/components/AlertSection';
import { RecommendationSection } from '@/domains/pulse/components/RecommendationSection';
import { TopicSection } from '@/domains/pulse/components/TopicSection';
import { AnalyticsSection } from '@/domains/pulse/components/AnalyticsSection';
import { CreatorSection } from '@/domains/pulse/components/CreatorSection';

export default function PulseHomeScreen() {
  const { trending, alerts, recommendations, topics, analytics, creators, isLoading, error, refresh } = usePulseHome();

  if (isLoading && !trending.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading Pulse...</Text>
      </View>
    );
  }

  if (error && !trending.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#FF6B35" />}
    >
      <Text style={styles.header}>⚡ Pulse</Text>
      <Text style={styles.subheader}>What is happening across MTAA</Text>

      {alerts.length > 0 && <AlertSection alerts={alerts} />}
      {trending.length > 0 && <TrendingSection trends={trending} />}
      {creators.length > 0 && <CreatorSection creators={creators} />}
      {recommendations.length > 0 && <RecommendationSection recommendations={recommendations} />}
      {topics.length > 0 && <TopicSection topics={topics} />}
      {analytics.length > 0 && <AnalyticsSection analytics={analytics} />}

      {!isLoading && !trending.length && !alerts.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No signals yet. Check back soon.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a1a' },
  header: { fontSize: 32, fontWeight: '800', color: '#fff', paddingHorizontal: 16, paddingTop: 20 },
  subheader: { fontSize: 14, color: 'rgba(255,255,255,0.5)', paddingHorizontal: 16, marginBottom: 16 },
  loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: 12 },
  errorText: { color: '#FF6B35', fontSize: 16, marginBottom: 16 },
  retryBtn: { backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
