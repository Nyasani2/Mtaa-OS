import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const services = [
  { name: "Waste Collection", status: "Active", next: "Tomorrow" },
  { name: "Street Lighting", status: "Active", next: "N/A" },
  { name: "Road Maintenance", status: "Scheduled", next: "Next week" },
  { name: "Public Transit", status: "Active", next: "Running" },
];

export default function ServicesScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>City Services</Text>
      {services.map((s, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.name}>{s.name}</Text>
          <Text style={styles.meta}>Status: {s.status} • Next: {s.next}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  title: { fontSize: 24, fontWeight: "bold", color: "white", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16 },
  name: { color: "white", fontSize: 15, fontWeight: "600" },
  meta: { color: "#94A3B8", fontSize: 13, marginTop: 2 },
});
