import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFuelStore } from "@/lib/mtruck/hooks/use-fuel-store";
import { FuelStationCard } from "@/lib/mtruck/components/FuelStationCard";

export default function FuelScreen() {
  const { stations, averagePrice } = useFuelStore();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Average Fuel Price</Text>
        <Text style={styles.priceValue}>${averagePrice.toFixed(2)}</Text>
        <Text style={styles.priceUnit}>per liter</Text>
      </View>
      <Text style={styles.sectionTitle}>Nearby Stations</Text>
      {stations.map((station) => <FuelStationCard key={station.id} station={station} />)}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  priceCard: { backgroundColor: "#1E293B", borderRadius: 16, padding: 24, margin: 16, alignItems: "center" },
  priceLabel: { color: "#94A3B8", fontSize: 14 },
  priceValue: { fontSize: 40, fontWeight: "bold", color: "white", marginTop: 8 },
  priceUnit: { color: "#64748B", fontSize: 14, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "white", marginTop: 8, marginBottom: 12, paddingHorizontal: 20 },
});
