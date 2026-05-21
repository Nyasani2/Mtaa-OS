import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  label: string;
  value: string;
  change: string;
  color: string;
}

export function MetricCard({ label, value, change, color }: Props) {
  return (
    <View style={[styles.card, { borderColor: color + "30" }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={[styles.change, { color }]}>{change}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "47%", backgroundColor: "#1E293B", borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10 },
  label: { color: "#94A3B8", fontSize: 12, marginBottom: 6 },
  value: { color: "white", fontSize: 18, fontWeight: "bold" },
  change: { fontSize: 12, fontWeight: "600", marginTop: 4 },
});
