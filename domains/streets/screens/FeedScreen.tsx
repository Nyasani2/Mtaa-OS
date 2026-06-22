// domains/streets/screens/FeedScreen.tsx
// MTAA Streets — TikTok-Style Full Screen Feed

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Pressable,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useFeed } from '../hooks/useFeed';
import FeedCard from '../components/FeedCard';
import { CreateModal } from '../components/CreateModal';

const { height: SCREEN_H } = Dimensions.get('window');

export default function FeedScreen() {
  const { posts, isLoading, activeTab, setActiveTab, refreshFeed, loadMore } = useFeed();
  const [createVisible, setCreateVisible] = useState(false);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const tabs = ['For You', 'Following', 'Nearby', 'Trending', 'New', 'Live'];

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setVisibleIndex(viewableItems[0].index || 0);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(({ item, index }: any) => (
    <FeedCard
      post={item}
      isVisible={index === visibleIndex}
    />
  ), [visibleIndex]);

  return (
    <View style={styles.container}>
      {/* Top tabs overlay */}
      <View style={styles.tabsOverlay} pointerEvents="box-none">
        <View style={styles.tabs}>
          {tabs.map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* TikTok-style full screen paging feed */}
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        pagingEnabled
        snapToInterval={SCREEN_H}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshFeed}
            tintColor="#fff"
            progressBackgroundColor="#000"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_H,
          offset: SCREEN_H * index,
          index,
        })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading...' : 'No posts yet'}
            </Text>
          </View>
        }
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
      />

      {/* FAB for create */}
      <Pressable style={styles.fab} onPress={() => setCreateVisible(true)}>
        <Text style={styles.fabText}>➕</Text>
      </Pressable>

      <CreateModal visible={createVisible} onClose={() => setCreateVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    zIndex: 100,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
  },
  empty: {
    height: SCREEN_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
  },
});
