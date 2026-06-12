// app/(os)/pulse/index.tsx
// MTAA Pulse — Home Feed Screen

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFeed, FeedTab } from '../../../domains/pulse/hooks/useFeed';
import { useAuthStore } from '../../../domains/identity/state/authStore';
import VideoPlayer from '../../../domains/pulse/components/VideoPlayer';
import LoadingState from '../../../components/ui/LoadingState';
import ErrorState from '../../../components/ui/ErrorState';
import EmptyState from '../../../components/ui/EmptyState';
import SafeAreaWrapper from '../../../components/ui/SafeAreaWrapper';
import { FontAwesome5 } from '@expo/vector-icons';

export default function PulseHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id || '';

  const {
    data: posts,
    loading,
    error,
    activeTab,
    setActiveTab,
    hasMore,
    refreshing,
    refresh,
    loadMore,
  } = useFeed(userId);

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const toggleLike = useCallback((postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

  const renderPost = ({ item }: { item: any }) => {
    const isLiked = likedPosts.has(item.id);
    const mediaUrl = item.resolved_media_url || item.media_url || '';
    const thumbnailUrl = item.resolved_thumbnail_url || item.thumbnail_url || '';
    const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.mov') || item.media_type === 'video';

    return (
      <View style={styles.postCard}>
        {/* Author Header */}
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(item.author_name || 'U')[0].toUpperCase()}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.authorName}>{item.author_name || 'Unknown'}</Text>
            <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.caption}>{item.caption || item.title || item.content || ''}</Text>

        {/* Media */}
        {mediaUrl && isVideo && (
          <VideoPlayer
            content_id={item.id}
            video_url={mediaUrl}
            thumbnail_url={thumbnailUrl}
            user_id={userId}
            autoPlay={false}
            style={styles.videoPlayer}
          />
        )}
        {mediaUrl && !isVideo && (
          <View style={styles.imageContainer}>
            <img src={mediaUrl} alt="Post media" style={styles.image as any} />
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item.id)}>
            <FontAwesome5 name={isLiked ? 'heart' : 'heart'} solid={isLiked} size={20} color={isLiked ? '#ff3b30' : '#666'} />
            <Text style={[styles.actionText, isLiked && styles.likedText]}>{item.likes_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <FontAwesome5 name="comment" size={20} color="#666" />
            <Text style={styles.actionText}>{item.comments_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <FontAwesome5 name="share" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <FontAwesome5 name="bookmark" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const tabs: { key: FeedTab; label: string }[] = [
    { key: 'for_you', label: 'For You' },
    { key: 'following', label: 'Following' },
    { key: 'trending', label: 'Trending' },
  ];

  return (
    <SafeAreaWrapper edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pulse</Text>
        <TouchableOpacity style={styles.createBtn}>
          <FontAwesome5 name="plus" size={16} color="#fff" />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading && posts.length === 0 ? (
        <LoadingState message="Loading Pulse..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          message="Be the first to share something on Pulse!"
          icon="newspaper"
          actionLabel="Create Post"
          onAction={() => {}}
        />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerText: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  caption: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  videoPlayer: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    objectFit: 'cover',
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  likedText: {
    color: '#ff3b30',
  },
});
