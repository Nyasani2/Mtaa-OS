import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import StayCard from './StayCard';

interface Props {
  listings: any[];
  onSelect?: (id: string) => void;
  onToggleSave?: (id: string) => void;
  savedIds?: string[];
  loading?: boolean;
  horizontal?: boolean;
  emptyMessage?: string;
}

export default function StayList({ listings, onSelect, onToggleSave, savedIds, loading, horizontal, emptyMessage }: Props) {
  if (loading) return <Text style={styles.empty}>Loading stays...</Text>;
  if (!listings?.length) return <Text style={styles.empty}>{emptyMessage || 'No stays found'}</Text>;

  if (horizontal) {
    return (
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <StayCard
            listing={item}
            variant="compact"
            onPress={() => onSelect?.(item.id)}
            onToggleSave={() => onToggleSave?.(item.id)}
            isSaved={savedIds?.includes(item.id)}
          />
        )}
        contentContainerStyle={styles.horizontalList}
      />
    );
  }

  return (
    <FlatList
      data={listings}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <StayCard
          listing={item}
          variant="full"
          onPress={() => onSelect?.(item.id)}
          onToggleSave={() => onToggleSave?.(item.id)}
          isSaved={savedIds?.includes(item.id)}
        />
      )}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  horizontalList: { paddingHorizontal: 16, paddingBottom: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#6b7280', fontSize: 15 },
});
