import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Text } from 'react-native';
import { useDiscover } from '../hooks/useDiscover';

export default function DiscoverScreen() {
  const { posts, loading, hasMore, filters, trendingTags, refreshDiscover, loadMore, search, searchPeople, setFilters } = useDiscover();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filterList = ['All', 'Videos', 'Users', 'Hashtags', 'Shops', 'Jobs', 'Live'];

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Streets..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => search(searchText)}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => { setSearchText(''); search(''); }}>
            <Text>✕</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        {filterList.map(f => (
          <Pressable
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.activeChip]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.activeFilterText]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {/* Results placeholder — wire to your actual DiscoverGrid or list */}
      <View style={styles.results}>
        {loading && <Text style={styles.loadingText}>Loading...</Text>}
        {posts.length === 0 && !loading && <Text style={styles.emptyText}>No results found</Text>}
        {posts.map((post: any) => (
          <Pressable key={post.id} style={styles.resultItem}>
            <Text style={styles.resultTitle}>{post.title || post.content?.substring(0, 50) || 'Untitled'}</Text>
          </Pressable>
        ))}
        {hasMore && (
          <Pressable style={styles.loadMoreBtn} onPress={loadMore}>
            <Text style={styles.loadMoreText}>Load More</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f5f5f5', margin: 12, borderRadius: 24 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f5f5f5' },
  activeChip: { backgroundColor: '#E91E63' },
  filterText: { fontSize: 13, color: '#555' },
  activeFilterText: { color: '#fff', fontWeight: '600' },
  results: { flex: 1, padding: 12 },
  loadingText: { textAlign: 'center', color: '#888', marginTop: 40 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
  resultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  resultTitle: { fontSize: 14, color: '#333' },
  loadMoreBtn: { padding: 12, alignItems: 'center', backgroundColor: '#f5f5f5', marginTop: 12, borderRadius: 8 },
  loadMoreText: { color: '#E91E63', fontWeight: '600' },
});
