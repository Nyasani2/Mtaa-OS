import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { useMarketplaceStore } from "@/lib/mtruck/hooks/use-marketplace-store";
import { FreightListingCard } from "@/lib/mtruck/components/FreightListingCard";

export default function MarketplaceScreen() {
  const { listings, bidOnLoad } = useMarketplaceStore();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rate" | "distance" | "urgency">("rate");
  const filtered = listings.filter((l) => l.origin.toLowerCase().includes(search.toLowerCase()) || l.destination.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sortBy === "rate" ? b.rate - a.rate : sortBy === "distance" ? a.distance - b.distance : a.urgency === "high" ? -1 : 1);
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput style={styles.searchInput} placeholder="Search freight listings..." placeholderTextColor="#64748B" value={search} onChangeText={setSearch} />
      </View>
      <View style={styles.sortRow}>
        {(["rate", "distance", "urgency"] as const).map((s) => (
          <TouchableOpacity key={s} style={[styles.sortChip, sortBy === s && styles.sortChipActive]} onPress={() => setSortBy(s)}>
            <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>{s.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.list}>
        {filtered.map((listing) => <FreightListingCard key={listing.id} listing={listing} onBid={() => bidOnLoad(listing.id)} />)}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  searchBox: { backgroundColor: "#1E293B", borderRadius: 12, padding: 12, margin: 16 },
  searchInput: { color: "white", fontSize: 15 },
  sortRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: "#1E293B" },
  sortChipActive: { backgroundColor: "#6366F1" },
  sortText: { color: "#94A3B8", fontSize: 11 },
  sortTextActive: { color: "white" },
  list: { flex: 1, paddingHorizontal: 16 },
});
