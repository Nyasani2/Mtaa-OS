import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { usePropertySearch } from "@/domains/property/hooks/usePropertySearch";
import { PropertyList, SearchFilters } from "@/domains/property/components";
import { Search, SlidersHorizontal, X } from "lucide-react-native";

export default function PropertySearchScreen() {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { results, loading, search } = usePropertySearch();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Search size={18} color="#9ca3af" />
            <TextInput style={styles.input} placeholder="Search city, neighborhood, or property name" value={query} onChangeText={setQuery} onSubmitEditing={() => search({ query })} />
            {query.length > 0 && <TouchableOpacity onPress={() => setQuery("")}><X size={16} color="#9ca3af" /></TouchableOpacity>}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={20} color="#1a5c4b" />
          </TouchableOpacity>
        </View>
      </View>
      {showFilters && <SearchFilters onApply={(f) => search(f)} />}
      <PropertyList properties={results} loading={loading} emptyMessage="Search for properties to see results" />
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
});
