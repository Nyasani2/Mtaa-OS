// domains/streets/screens/FeedScreen.tsx
// MTAA Streets — Feed Screen (FIXED)

import React, { useState } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { useFeed } from '../hooks/useFeed';
import { FeedCard } from '../components/FeedCard';
import { CreateModal } from '../components/CreateModal';

export default function FeedScreen() {
  const { posts, isLoading, activeTab, setActiveTab, refreshFeed, loadMore } = useFeed();
  const [createVisible, setCreateVisible] = useState(false);

  const tabs = ['For You', 'Following', 'Nearby', 'Trending', 'New', 'Live'];

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <FeedCard
            post={item}
            onProfilePress={(userId) => router.push(`/streets/profile/${userId}`)}
            onCommentPress={(postId) => router.push(`/streets/comments/${postId}`)}
          />
        )}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshFeed} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{isLoading ? 'Loading...' : 'No posts yet'}</Text>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={() => setCreateVisible(true)}>
        <Text style={styles.fabText}>➕</Text>
      </Pressable>

      <CreateModal visible={createVisible} onClose={() => setCreateVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 8 },
  tab: { paddingVertical: 12, paddingHorizontal: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#E91E63' },
  tabText: { fontSize: 13, color: '#888' },
  activeTabText: { color: '#E91E63', fontWeight: '700' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 24 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14 },
});
