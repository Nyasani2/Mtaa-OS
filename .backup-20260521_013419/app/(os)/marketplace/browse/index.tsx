import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView } from "react-native";
import { useMarketplaceStore } from "@/lib/marketplace/hooks/use-marketplace-store";
import { ListingCard } from "@/lib/marketplace/components/ListingCard";

export default function BrowseScreen() {
  const { listings } = useMarketplaceStore();
  const [search, setSearch] = useState("");
  const filtered = listings.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()) || l.category.toLowerCase().includes(search.toLowerCase()));
  return (
    <View style={styles.container}>
      <TextInput style={styles.search} placeholder="Search listings..." placeholderTextColor="#64748B" value={search} onChangeText={setSearch} />
      <ScrollView>
        {filtered.map((listing) => <ListingCard key={listing.id} listing={listing} onPress={() => {}} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  search: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, margin: 16, color: "white", fontSize: 15 },
});
