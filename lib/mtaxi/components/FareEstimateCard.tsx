import React from "react";
import { View, Text, StyleSheet } from 'react-native';
import type { FareEstimate } from "../types";

interface Props { estimate: FareEstimate | null; loading: boolean; }

export default function FareEstimateCard({ estimate, loading }: Props) {
  if (loading) return <View style={styles.container}><Text style={styles.loading}>Calculating fare...</Text></View>;
  if (!estimate) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fare Estimate</Text>
      <View style={styles.row}><Text style={styles.label}>Distance</Text><Text style={styles.value}>{estimate.distance_km} km</Text></View>
      <View style={styles.row}><Text style={styles.label}>Base Fare</Text><Text style={styles.value}>{estimate.currency} {estimate.base_fare}</Text></View>
      {estimate.surge_multiplier > 1 && (
        <View style={styles.row}><Text style={[styles.label, styles.surgeLabel]}>Surge ({estimate.surge_multiplier}x)</Text><Text style={[styles.value, styles.surgeValue]}>+{Math.round((estimate.surge_multiplier - 1) * 100)}%</Text></View>
      )}
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{estimate.currency} {estimate.total_fare}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginVertical: 12 },
  title: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { color: "#94a3b8", fontSize: 14 },
  value: { color: "#fff", fontSize: 14, fontWeight: "500" },
  surgeLabel: { color: "#ef4444" },
  surgeValue: { color: "#ef4444", fontWeight: "600" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#334155", paddingTop: 12, marginTop: 4 },
  totalLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  totalValue: { color: "#f59e0b", fontSize: 18, fontWeight: "700" },
  loading: { color: "#94a3b8", fontSize: 14, textAlign: "center" }
});
