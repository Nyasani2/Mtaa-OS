import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { FreightListing } from "@/lib/mtruck/types";

interface Props {
  listing: FreightListing;
  onBid: () => void;
}

export function FreightListingCard({ listing, onBid }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.route}>{listing.origin} → {listing.destination}</Text>
        <View style={[styles.urgency, { backgroundColor: listing.urgency === "high" ? "#EF444420" : "#F59E0B20" }]}>
          <Text style={[styles.urgencyText, { color: listing.urgency === "high" ? "#EF4444" : "#F59E0B" }]}>{listing.urgency.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.cargo}>{listing.cargo} • {listing.weight}kg • {listing.distance}km</Text>
      <View style={styles.footer}>
        <Text style={styles.rate}>${listing.rate}/mile</Text>
        <Text style={styles.bids}>{listing.bids} bids</Text>
        <TouchableOpacity style={styles.bidBtn} onPress={onBid}>
          <Text style={styles.bidText}>Place Bid</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 10, marginHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  route: { color: "white", fontSize: 14, fontWeight: "600", flex: 1 },
  urgency: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  urgencyText: { fontSize: 10, fontWeight: "bold" },
  cargo: { color: "#94A3B8", fontSize: 13, marginBottom: 10 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rate: { color: "#10B981", fontSize: 14, fontWeight: "bold" },
  bids: { color: "#94A3B8", fontSize: 12 },
  bidBtn: { backgroundColor: "#6366F1", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  bidText: { color: "white", fontSize: 12, fontWeight: "bold" },
});
