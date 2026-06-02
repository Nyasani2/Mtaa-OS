import React from 'react';
import { View, Text, Image, Pressable, FlatList, StyleSheet } from 'react-native';
import type { DiscoverItem } from '../types';

interface DiscoverGridProps {
  items: DiscoverItem[];
  onItemPress: (item: DiscoverItem) => void;
  onHashtagPress: (tag: string) => void;
}

export function DiscoverGrid({ items, onItemPress, onHashtagPress }: DiscoverGridProps) {
  const renderItem = ({ item }: { item: DiscoverItem }) => (
    <Pressable onPress={() => onItemPress(item)} style={styles.gridItem}>
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.overlay}>
        <Text style={styles.gridTitle}>{item.title}</Text>
        <Text style={styles.gridMeta}>{item.viewCount} views</Text>
      </View>
      {item.isLive && (
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      numColumns={2}
      contentContainerStyle={styles.grid}
    />
  );
}

const styles = StyleSheet.create({
  grid: { padding: 8 },
  gridItem: { flex: 1, margin: 4, aspectRatio: 0.75, borderRadius: 8, overflow: 'hidden' },
  thumbnail: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)' },
  gridTitle: { color: '#fff', fontSize: 12, fontWeight: '600' },
  gridMeta: { color: '#ccc', fontSize: 10 },
  liveBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#E91E63', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
