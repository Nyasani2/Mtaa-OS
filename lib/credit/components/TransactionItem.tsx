import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Transaction } from "@/lib/credit/types";

interface Props {
  tx: Transaction;
}

export function TransactionItem({ tx }: Props) {
  const isCredit = tx.type === "credit" || tx.type === "reward";
  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: isCredit ? "#10B98120" : "#EF444420" }]}>
        <Ionicons name={isCredit ? "arrow-down" : "arrow-up"} size={18} color={isCredit ? "#10B981" : "#EF4444"} />
      </View>
      <View style={styles.info}>
        <Text style={styles.desc}>{tx.description}</Text>
        <Text style={styles.meta}>{tx.timestamp} • {tx.status}</Text>
      </View>
      <Text style={[styles.amount, { color: isCredit ? "#10B981" : "white" }]}>
        {isCredit ? "+" : "-"}${tx.amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1E293B" },
  iconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 12 },
  info: { flex: 1 },
  desc: { color: "white", fontSize: 14 },
  meta: { color: "#64748B", fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "600" },
});
