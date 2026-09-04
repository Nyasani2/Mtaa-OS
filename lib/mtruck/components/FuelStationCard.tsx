// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from 'react-native';
import type { FuelStation } from "@/lib/mtruck/types";

interface Props {
  station: FuelStation;
}

export function FuelStationCard({ station }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={(styles as any).full_name}>{(station as any).full_name}</Text>
        <Text style={styles.price}>${station.price.toFixed(2)}</Text>
      </View>
      <Text style={(styles as any).distance}>{(station as any).distance}km away</Text>
      <View style={styles.amenities}>
        {station.amenities.map((a) => <View key={a} style={styles.amenity}><Text style={styles.amenityText}>{a}</Text></View>)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  name: { color: "white", fontSize: 15, fontWeight: "600" },
  price: { color: "#10B981", fontSize: 15, fontWeight: "bold" },
  distance: { color: "#94A3B8", fontSize: 13, marginBottom: 8 },
  amenities: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  amenity: { backgroundColor: "#0F172A", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  amenityText: { color: "#94A3B8", fontSize: 11 },
});
