import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { PulseTopic } from '../types';

export function TopicSection({ topics }: { topics: PulseTopic[] }) {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📌 Featured Topics</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {topics.map(topic => (
          <TouchableOpacity key={topic.id} style={styles.topicChip} onPress={() => router.push(`/(os)/pulse/topics/${topic.slug}`)}>
            <Text style={styles.topicName}>{topic.name}</Text>
            <Text style={styles.topicCount}>{topic.follower_count.toLocaleString()}</Text>
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
  topicChip: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, marginRight: 8, alignItems: 'center' },
  topicName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  topicCount: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
});
