// components/shop/MarketplaceBrowser.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ScrollView } from "react-native";
import { useMarketplaceSearch } from "@/lib/shop/hooks/useMarketplace";
import { MarketplaceListing } from "@/lib/shop/types";
import { router } from "expo-router";

const CATEGORIES = ["All", "Retail", "Restaurant", "Bar", "Pharmacy", "Electronics", "Fashion", "Grocery", "Services"];

export default function MarketplaceBrowser() {
  const { listings, loading, error, search } = useMarketplaceSearch();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    search({ query: query || undefined, category: selectedCategory === "All" ? undefined : selectedCategory });
  }, [selectedCategory]);

  const handleSearch = () => {
    search({ query: query || undefined, category: selectedCategory === "All" ? undefined : selectedCategory });
  };

  const renderListing = ({ item }: { item: MarketplaceListing }) => (
    <TouchableOpacity style={styles.listingCard} onPress={() => router.push(`/shop/${item.shop_id}/product/${item.product_id}`)}>
      <Image source={{ uri: item.marketplace_images?.[0] || item.product?.images?.[0] || "https://via.placeholder.com/150" }} style={styles.listingImage} />
      <View style={styles.listingInfo}>
        <Text style={styles.listingName}>{item.product?.name}</Text>
        <Text style={styles.listingShop}>🏪 {item.shop?.name}</Text>
        <View style={styles.listingMeta}>
          <Text style={styles.listingPrice}>R{item.marketplace_price?.toFixed(2) || item.product?.base_price?.toFixed(2)}</Text>
          <Text style={styles.listingRating}>⭐ {item.shop?.rating || "5.0"}</Text>
        </View>
        {item.is_featured && <View style={styles.featuredBadge}><Text style={styles.featuredText}>Featured</Text></View>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Marketplace</Text>
      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="Search products, shops..." placeholderTextColor="#64748b" value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}><Text style={styles.searchBtnText}>🔍</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]} onPress={() => setSelectedCategory(cat)}>
            <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList data={listings} renderItem={renderListing} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>{loading ? "Loading..." : error || "No listings found"}</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { color: "#f8fafc", fontSize: 24, fontWeight: "700", padding: 20 },
  searchRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, backgroundColor: "#1e293b", color: "#f8fafc", padding: 14, borderRadius: 10, fontSize: 16 },
  searchBtn: { backgroundColor: "#3b82f6", width: 50, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  searchBtnText: { fontSize: 20 },
  categoryRow: { paddingHorizontal: 12, marginBottom: 12 },
  categoryChip: { backgroundColor: "#1e293b", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  categoryChipActive: { backgroundColor: "#f59e0b" },
  categoryChipText: { color: "#94a3b8", fontWeight: "500" },
  categoryChipTextActive: { color: "#0f172a", fontWeight: "700" },
  list: { padding: 16 },
  listingCard: { flexDirection: "row", backgroundColor: "#1e293b", borderRadius: 12, marginBottom: 12, overflow: "hidden" },
  listingImage: { width: 100, height: 100 },
  listingInfo: { flex: 1, padding: 12 },
  listingName: { color: "#f8fafc", fontSize: 16, fontWeight: "600" },
  listingShop: { color: "#94a3b8", fontSize: 13, marginTop: 4 },
  listingMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  listingPrice: { color: "#22c55e", fontSize: 18, fontWeight: "700" },
  listingRating: { color: "#f59e0b", fontWeight: "600" },
  featuredBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "#f59e0b", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  featuredText: { color: "#0f172a", fontSize: 10, fontWeight: "700" },
  empty: { color: "#64748b", textAlign: "center", marginTop: 40 },
});
