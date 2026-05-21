import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useCreditStore } from "@/lib/credit/hooks/use-credit-store";
import { TransactionItem } from "@/lib/credit/components/TransactionItem";

export default function HistoryScreen() {
  const { transactions } = useCreditStore();
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Transaction History</Text>
      {transactions.map((tx) => <TransactionItem key={tx.id} tx={tx} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  title: { fontSize: 24, fontWeight: "bold", color: "white", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
});
