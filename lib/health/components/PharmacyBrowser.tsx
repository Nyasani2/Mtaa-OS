// @ts-nocheck
"use client";

import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { usePharmacy as usePharmacies } from "../hooks/usePharmacy";

export function PharmacyBrowser() {
  const { inventory: pharmacies, loading: isLoading } = usePharmacy(null) as any;

  if (isLoading) return <Text style={styles.loading}>Loading pharmacies...</Text>;

  const renderPharmacy = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.address}>{item.address}</Text>
      <Text style={styles.phone}>{item.phone}</Text>
      <View style={styles.tags}>
        {item.is_24h && <Text style={styles.tag}>24h</Text>}
        {item.delivery_available && <Text style={styles.tag}>Delivery</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pharmacies</Text>
      <FlatList
        data={pharmacies || []}
        renderItem={renderPharmacy}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0F0F0F" },
  loading: { color: "#9CA3AF", padding: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginBottom: 16 },
  card: { backgroundColor: "#1F1F1F", padding: 16, borderRadius: 12, marginBottom: 12 },
  name: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  address: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
  phone: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
  tags: { flexDirection: "row", gap: 8, marginTop: 8 },
  tag: { backgroundColor: "#2563eb", color: "#FFFFFF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12 },
});
