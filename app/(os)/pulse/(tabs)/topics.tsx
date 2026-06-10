import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { usePulseTopics } from '@/domains/pulse/hooks/usePulseHome';

export default function TopicsScreen() {
  const { topics, followedTopics, isLoading, loadTopics, follow, unfollow } = usePulseTopics();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadTopics} tintColor="#FF6B35" />}
    >
      <Text style={styles.header}>📌 Topics</Text>
      {topics.map(topic => (
        <View key={topic.id} style={styles.topicCard}>
          <View style={styles.topicInfo}>
            <Text style={styles.topicName}>{topic.name}</Text>
            <Text style={styles.topicMeta}>{topic.follower_count.toLocaleString()} followers • {topic.post_count} posts</Text>
          </View>
          <TouchableOpacity
            style={[styles.followBtn, topic.is_following && styles.followingBtn]}
            onPress={() => topic.is_following ? unfollow(topic.id) : follow(topic.id)}
          >
            <Text style={[styles.followText, topic.is_following && styles.followingText]}>
              {topic.is_following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
      {!topics.length && !isLoading && (
        <Text style={styles.empty}>No topics yet</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a', padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  topicCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginBottom: 8 },
  topicInfo: { flex: 1 },
  topicName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  topicMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  followBtn: { backgroundColor: '#FF6B35', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  followingBtn: { backgroundColor: 'rgba(255,255,255,0.1)' },
  followText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  followingText: { color: 'rgba(255,255,255,0.7)' },
  empty: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 },
});
