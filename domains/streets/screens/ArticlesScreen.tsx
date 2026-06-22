// domains/streets/screens/ArticlesScreen.tsx
// MTAA Streets — Articles Feed (compact card list)

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { useFeed } from '../hooks/useFeed';
import ArticleCard from '../components/ArticleCard';
import { CreateModal } from '../components/CreateModal';

export default function ArticlesScreen() {
  const { posts, isLoading, refreshFeed, loadMore } = useFeed();
  const [createVisible, setCreateVisible] = useState(false);

  // Filter to text-only posts (no video, optional image thumbnail)
  const articles = posts.filter(p => p.media_type !== 'video');

  const renderItem = useCallback(({ item }: any) => (
    <ArticleCard post={item} />
  ), []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Articles</Text>
        <Pressable style={styles.writeBtn} onPress={() => setCreateVisible(true)}>
          <Text style={styles.writeBtnText}>✍️ Write</Text>
        </Pressable>
      </View>

      <FlatList
        data={articles}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshFeed} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading articles...' : 'No articles yet'}
            </Text>
          </View>
        }
      />

      <CreateModal visible={createVisible} onClose={() => setCreateVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  writeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF2D55',
  },
  writeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  empty: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
  },
});
