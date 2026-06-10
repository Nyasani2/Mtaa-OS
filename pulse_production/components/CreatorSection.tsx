import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { PulseCreatorScore } from '../types';

export function CreatorSection({ creators }: { creators: PulseCreatorScore[] }) {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⭐ Trending Creators</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {creators.slice(0, 10).map(creator => (
          <TouchableOpacity key={creator.id} style={styles.creatorCard} onPress={() => router.push(`/(os)/pulse/creator/${creator.creator_id}`)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.creatorName} numberOfLines={1}>{creator.creator_id.slice(0, 8)}</Text>
            <Text style={styles.creatorScore}>{creator.overall_score.toFixed(0)} pts</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', paddingHorizontal: 16, marginBottom: 12 },
  scroll: { paddingHorizontal: 16 },
  creatorCard: { alignItems: 'center', marginRight: 16, width: 80 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { fontSize: 24 },
  creatorName: { fontSize: 12, color: '#fff', fontWeight: '600', textAlign: 'center' },
  creatorScore: { fontSize: 11, color: '#FF6B35', marginTop: 2 },
});
