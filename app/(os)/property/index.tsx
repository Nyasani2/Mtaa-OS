import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useProperty } from "@/domains/property/hooks/useProperty";
import { Search, Plus, MapPin, Star, Home } from "lucide-react-native";
import { useEffect, useState } from "react";

export default function PropertyIndexScreen() {
  const router = useRouter();
  const { properties, refreshProperties, isLoading, search, searchResults } = useProperty();
  const [query, setQuery] = useState("");

  useEffect(() => {
    refreshProperties();
  }, []);

  const displayed = query.trim() ? searchResults : properties;

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.trim()) search(text);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(os)/property/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.imagePlaceholder}>
        <Home size={32} color="#9ca3af" />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <View style={styles.row}>
          <MapPin size={14} color="#6b7280" />
          <Text style={styles.location} numberOfLines={1}>{item.address || item.location}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>KES {(item.price || 0).toLocaleString()}<Text style={styles.per}> / night</Text></Text>
          <View style={styles.rating}>
            <Star size={14} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.ratingText}>{item.rating || "4.5"}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Property</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/(os)/property/list-property")}>
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Search size={18} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search properties..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={displayed || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Home size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {isLoading ? "Loading properties..." : "No properties found."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e0d5",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a5c4b",
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e0d5",
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1a1a1a" },
  list: { padding: 16, paddingTop: 0, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  imagePlaceholder: {
    height: 160,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 14 },
  title: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  location: { fontSize: 13, color: "#6b7280" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  price: { fontSize: 15, fontWeight: "700", color: "#1a5c4b" },
  per: { fontSize: 13, fontWeight: "400", color: "#6b7280" },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 13, color: "#1a1a1a", fontWeight: "600" },
  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { fontSize: 15, color: "#9ca3af", marginTop: 12 },
});
