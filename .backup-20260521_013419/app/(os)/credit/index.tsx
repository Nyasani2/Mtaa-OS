import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCreditStore } from "@/lib/credit/hooks/use-credit-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { CreditScoreRing } from "@/lib/credit/components/CreditScoreRing";
import { LoanCard } from "@/lib/credit/components/LoanCard";
import { TransactionItem } from "@/lib/credit/components/TransactionItem";

export default function CreditHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile, loans, transactions, refresh } = useCreditStore();

  useEffect(() => { if (user) refresh(user.id); }, [user]);

  const quickActions = [
    { label: "Loans", icon: "cash", route: "/(os)/credit/loans", color: "#6366F1" },
    { label: "Invest", icon: "trending-up", route: "/(os)/credit/investments", color: "#10B981" },
    { label: "History", icon: "time", route: "/(os)/credit/history", color: "#F59E0B" },
    { label: "Apply", icon: "add-circle", route: "/(os)/credit/apply", color: "#EC4899" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Credit & Finance</Text>
        <Text style={styles.subtitle}>Your financial health</Text>
      </View>

      {profile && <CreditScoreRing score={profile.score} tier={profile.tier} />}

      <View style={styles.limitCard}>
        <Text style={styles.limitLabel}>Credit Limit</Text>
        <Text style={styles.limitValue}>${profile?.limit.toLocaleString() || "0"}</Text>
        <View style={styles.limitBar}>
          <View style={[styles.limitFill, { width: `${((profile?.used || 0) / (profile?.limit || 1)) * 100}%` }]} />
        </View>
        <Text style={styles.limitUsed}>${profile?.used.toLocaleString() || "0"} used • ${profile?.available.toLocaleString() || "0"} available</Text>
      </View>

      <View style={styles.actionsRow}>
        {quickActions.map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.route as any)}>
            <View style={[styles.actionIcon, { backgroundColor: a.color + "20" }]}>
              <Ionicons name={a.icon as any} size={22} color={a.color} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Active Loans</Text>
      {loans.filter((l) => l.status === "active").map((loan) => <LoanCard key={loan.id} loan={loan} />)}

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {transactions.slice(0, 5).map((tx) => <TransactionItem key={tx.id} tx={tx} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "white" },
  subtitle: { color: "#94A3B8", fontSize: 14, marginTop: 4 },
  limitCard: { backgroundColor: "#1E293B", borderRadius: 16, padding: 20, margin: 16 },
  limitLabel: { color: "#94A3B8", fontSize: 14 },
  limitValue: { fontSize: 32, fontWeight: "bold", color: "white", marginTop: 8 },
  limitBar: { height: 8, backgroundColor: "#0F172A", borderRadius: 4, marginTop: 12 },
  limitFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 4 },
  limitUsed: { color: "#94A3B8", fontSize: 13, marginTop: 8 },
  actionsRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, marginBottom: 20 },
  actionBtn: { alignItems: "center" },
  actionIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  actionLabel: { color: "white", fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "white", marginTop: 24, marginBottom: 12, paddingHorizontal: 20 },
});
