import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { usePulseHome } from '@/domains/pulse/hooks/usePulseHome';
import { TrendingCard } from '@/domains/pulse/components/TrendingCard';

export default function TrendingScreen() {
  const { trending, isLoading, refresh } = usePulseHome();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#FF6B35" />}
    >
      <Text style={styles.header}>🔥 Trending Now</Text>
      {trending.map((trend, index) => (
        <TrendingCard key={trend.id} trend={trend} rank={index + 1} />
      ))}
      {!trending.length && !isLoading && (
        <Text style={styles.empty}>No trending items yet</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a', padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  empty: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 },
});
