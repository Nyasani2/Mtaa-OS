import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Listing } from "@/lib/marketplace/types";

interface Props {
  listing: Listing;
  onPress: () => void;
}

export function ListingCard({ listing, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageBox}>
        {listing.images[0] ? (
          <Image source={{ uri: listing.images[0] }} style={styles.image} />
        ) : (
          <Ionicons name="image" size={32} color="#64748B" />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.price}>${listing.price.toLocaleString()} {listing.currency}</Text>
        <Text style={styles.meta}>{listing.condition} • {listing.location}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", backgroundColor: "#1E293B", borderRadius: 12, padding: 12, marginBottom: 10, marginHorizontal: 16, gap: 12 },
  imageBox: { width: 80, height: 80, borderRadius: 10, backgroundColor: "#0F172A", justifyContent: "center", alignItems: "center" },
  image: { width: 80, height: 80, borderRadius: 10 },
  info: { flex: 1, justifyContent: "center" },
  title: { color: "white", fontSize: 15, fontWeight: "600" },
  price: { color: "#10B981", fontSize: 16, fontWeight: "bold", marginTop: 4 },
  meta: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
});
