import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { PulseRecommendation } from '../types';

export function RecommendationSection({ recommendations }: { recommendations: PulseRecommendation[] }) {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>✨ Recommended</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {recommendations.map(rec => (
          <TouchableOpacity key={rec.id} style={styles.recCard} onPress={() => router.push(`/(os)/pulse/${rec.rec_type}/${rec.entity_id}`)}>
            <Text style={styles.recType}>{rec.rec_type}</Text>
            <Text style={styles.recName}>{rec.entity_name}</Text>
            <Text style={styles.recReason}>{rec.reason}</Text>
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
  recCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginRight: 12, width: 200 },
  recType: { fontSize: 10, color: '#FF6B35', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  recName: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 },
  recReason: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
});
