import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from "expo-router";
import { useStaySearch } from "@/domains/stay/hooks/useStaySearch";
import { StayList, SearchFilters } from "@/domains/stay/components";
import { Search, SlidersHorizontal, X, Map } from "lucide-react-native";

export default function StaySearchScreen() {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { results, loading, search, clearResults } = useStaySearch();
  const router = useRouter();

  const handleSearch = () => {
    if (!query.trim()) { clearResults(); return; }
    search({ query });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Search size={18} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="Search city, neighborhood, or stay name"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              placeholderTextColor="#9ca3af"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(""); clearResults(); }}>
                <X size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={20} color="#1a5c4b" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, showMap && styles.filterBtnActive]} onPress={() => setShowMap(!showMap)}>
            <Map size={20} color={showMap ? "#fff" : "#1a5c4b"} />
          </TouchableOpacity>
        </View>
      </View>

      {showFilters && (
        <SearchFilters
          filters={{}}
          onChange={(f) => search(f)}
          onApply={() => setShowFilters(false)}
          onClear={() => { clearResults(); setShowFilters(false); }}
        />
      )}

      {showMap ? (
        <View style={styles.mapPlaceholder}>
          <Map size={48} color="#d1d5db" />
          <Text style={styles.mapText}>Map view coming soon</Text>
        </View>
      ) : (
        <StayList
          listings={results}
          loading={loading}
          emptyMessage={query ? "No stays match your search" : "Search for stays to see results"}
          onSelect={(id) => router.push(`/(os)/stay/${id}` as any)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e0d5" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  input: { flex: 1, fontSize: 15, color: "#1a1a1a" },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  filterBtnActive: { backgroundColor: "#1a5c4b" },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  mapText: { fontSize: 16, color: '#9ca3af', marginTop: 12 },
});
