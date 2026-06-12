// app/(os)/pulse/search.tsx
// MTAA Pulse — Search Screen

import React, { useEffect } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePulseSearch } from "@/domains/pulse/hooks/usePulseHome";
import { Search, X, Clock, ArrowRight } from "lucide-react-native";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "post", label: "Posts" },
  { key: "job", label: "Jobs" },
  { key: "product", label: "Products" },
  { key: "event", label: "Events" },
  { key: "business", label: "Businesses" },
  { key: "creator", label: "Creators" },
] as const;

export default function PulseSearchScreen() {
  const router = useRouter();
  const { query: initialQuery } = useLocalSearchParams<{ query?: string }>();
  const {
    query, results, suggestions, hasMore, isLoading, error,
    setQuery, setFilters, search, loadMore, getSuggestions
  } = usePulseSearch();

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      search(initialQuery);
    }
  }, [initialQuery]);

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchWrap}>
          <Search size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trends, topics, people..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              getSuggestions(text);
            }}
            onSubmitEditing={() => search(query)}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <X size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {query.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, styles.filterBtnActive]}
              onPress={() => setFilters({ type: f.key === "all" ? undefined : f.key })}
            >
              <Text style={styles.filterText}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Suggestions */}
      {query.length > 0 && suggestions.length > 0 && results.length === 0 && !isLoading && (
        <View style={styles.suggestions}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i} style={styles.suggestionRow} onPress={() => { setQuery(s); search(s); }}>
              <Clock size={16} color="rgba(255,255,255,0.3)" />
              <Text style={styles.suggestionText}>{s}</Text>
              <ArrowRight size={16} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Results */}
      {isLoading && results.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {results.map((item) => (
            <TouchableOpacity key={item.id} style={styles.resultRow}>
              <View style={styles.resultIcon}>
                <Text style={styles.resultIconText}>{item.entity_type.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultDesc} numberOfLines={1}>{item.description || item.entity_type}</Text>
                {item.tags && item.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {item.tags.slice(0, 3).map((tag, i) => (
                      <Text key={i} style={styles.tag}>#{tag}</Text>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
          {results.length > 0 && hasMore && (
            <TouchableOpacity style={styles.loadMore} onPress={loadMore}>
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          )}
          {query.length > 0 && results.length === 0 && !isLoading && (
            <View style={styles.empty}>
              <Search size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No results for "{query}"</Text>
            </View>
          )}
          {query.length === 0 && (
            <View style={styles.empty}>
              <Search size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>Start typing to search Pulse</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  searchWrap: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  cancel: { color: "#FF6B35", fontSize: 14, fontWeight: "600" },

  filterBar: { maxHeight: 44, paddingHorizontal: 12, paddingVertical: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)",
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: "rgba(255,107,53,0.2)" },
  filterText: { color: "#FF6B35", fontSize: 12, fontWeight: "600" },

  suggestions: { paddingHorizontal: 16 },
  suggestionRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)",
  },
  suggestionText: { flex: 1, color: "#fff", fontSize: 14 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  resultRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)",
  },
  resultIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,107,53,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  resultIconText: { color: "#FF6B35", fontSize: 18, fontWeight: "700" },
  resultInfo: { flex: 1, marginLeft: 12 },
  resultTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  resultDesc: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 },
  tagRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  tag: { color: "#34D399", fontSize: 11 },

  loadMore: { alignItems: "center", paddingVertical: 16 },
  loadMoreText: { color: "#FF6B35", fontSize: 14, fontWeight: "600" },

  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: 14, marginTop: 12 },
});
