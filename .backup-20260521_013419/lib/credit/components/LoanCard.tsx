import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Loan } from "@/lib/credit/types";

interface Props {
  loan: Loan;
}

export function LoanCard({ loan }: Props) {
  const progress = ((loan.principal - loan.remainingBalance) / loan.principal) * 100;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.purpose}>{loan.purpose}</Text>
        <View style={[styles.badge, { backgroundColor: loan.status === "active" ? "#10B98120" : "#F59E0B20" }]}>
          <Text style={[styles.badgeText, { color: loan.status === "active" ? "#10B981" : "#F59E0B" }]}>{loan.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.balance}>${loan.remainingBalance.toLocaleString()} remaining</Text>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.meta}>${loan.monthlyPayment}/mo</Text>
        <Text style={styles.meta}>{loan.interestRate}% APR</Text>
        <Text style={styles.meta}>Due {loan.nextDueDate}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 16, marginBottom: 10, marginHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  purpose: { color: "white", fontSize: 16, fontWeight: "600" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  balance: { color: "#94A3B8", fontSize: 14, marginBottom: 10 },
  progressBg: { height: 6, backgroundColor: "#0F172A", borderRadius: 3, marginBottom: 10 },
  progressFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 3 },
  footer: { flexDirection: "row", justifyContent: "space-between" },
  meta: { color: "#64748B", fontSize: 12 },
});
