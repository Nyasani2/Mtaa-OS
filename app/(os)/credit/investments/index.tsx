import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useCreditStore } from "@/lib/credit/hooks/use-credit-store";

export default function InvestmentsScreen() {
  const { investments } = useCreditStore();
  const total = investments.reduce((sum, i) => sum + i.amount, 0);
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Investments</Text>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Portfolio</Text>
        <Text style={styles.totalValue}>${total.toLocaleString()}</Text>
      </View>
      {investments.map((inv) => (
        <View key={inv.id} style={styles.card}>
          <Text style={styles.name}>{inv.name}</Text>
          <Text style={styles.detail}>{inv.type} • {inv.returnRate}% return</Text>
          <Text style={styles.amount}>${inv.amount.toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  title: { fontSize: 24, fontWeight: "bold", color: "white", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  totalCard: { backgroundColor: "#1E293B", borderRadius: 16, padding: 20, margin: 16, alignItems: "center" },
  totalLabel: { color: "#94A3B8", fontSize: 14 },
  totalValue: { fontSize: 36, fontWeight: "bold", color: "white", marginTop: 8 },
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16 },
  name: { color: "white", fontSize: 15, fontWeight: "600" },
  detail: { color: "#94A3B8", fontSize: 13, marginTop: 2 },
  amount: { color: "#10B981", fontSize: 14, fontWeight: "bold", marginTop: 6 },
});
