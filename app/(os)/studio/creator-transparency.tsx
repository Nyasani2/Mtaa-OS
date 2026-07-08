import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase/client";

interface TransparencyRecord {
  label: string; daily: number; monthly: number; annual: number; color: string;
}

export default function CreatorTransparencyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<TransparencyRecord[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [pendingSettlements, setPendingSettlements] = useState(0);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    if (!user) return;
    const { data: rev } = await supabase.from("studio_creator_revenue").select("*").eq("creator_id", user.id).single();
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
    const { data: pending } = await supabase.from("studio_payout_requests").select("amount").eq("creator_id", user.id).eq("status", "pending");

    if (rev) {
      setRecords([
        { label: "Advertising Income", daily: rev.daily_ad || 0, monthly: rev.monthly_ad || 0, annual: rev.annual_ad || 0, color: "#E53935" },
        { label: "Membership Income", daily: rev.daily_membership || 0, monthly: rev.monthly_membership || 0, annual: rev.annual_membership || 0, color: "#9C27B0" },
        { label: "Tips", daily: rev.daily_tips || 0, monthly: rev.monthly_tips || 0, annual: rev.annual_tips || 0, color: "#FF9800" },
        { label: "Digital Sales", daily: rev.daily_digital || 0, monthly: rev.monthly_digital || 0, annual: rev.annual_digital || 0, color: "#2196F3" },
        { label: "Course Revenue", daily: rev.daily_course || 0, monthly: rev.monthly_course || 0, annual: rev.annual_course || 0, color: "#4CAF50" },
        { label: "Music Revenue", daily: rev.daily_music || 0, monthly: rev.monthly_music || 0, annual: rev.annual_music || 0, color: "#00BCD4" },
        { label: "Merchandise Revenue", daily: rev.daily_merch || 0, monthly: rev.monthly_merch || 0, annual: rev.annual_merch || 0, color: "#795548" },
        { label: "Event Tickets", daily: rev.daily_event || 0, monthly: rev.monthly_event || 0, annual: rev.annual_event || 0, color: "#607D8B" },
      ]);
    }
    setWalletBalance(wallet?.balance || 0);
    setPendingSettlements((pending || []).reduce((s, p) => s + (p.amount || 0), 0));
  }

  const formatKES = (n: number) => `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Transparency</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Wallet Summary */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={styles.walletAmount}>{formatKES(walletBalance)}</Text>
          <Text style={styles.walletPending}>Pending Settlements: {formatKES(pendingSettlements)}</Text>
        </View>

        {/* Earnings Table */}
        <Text style={styles.sectionTitle}>Complete Financial Visibility</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Revenue Stream</Text>
          <Text style={styles.tableHeaderCell}>Daily</Text>
          <Text style={styles.tableHeaderCell}>Monthly</Text>
          <Text style={styles.tableHeaderCell}>Annual</Text>
        </View>
        {records.map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={{ flex: 2, flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.tableDot, { backgroundColor: r.color }]} />
              <Text style={styles.tableCellLabel}>{r.label}</Text>
            </View>
            <Text style={styles.tableCell}>{formatKES(r.daily)}</Text>
            <Text style={styles.tableCell}>{formatKES(r.monthly)}</Text>
            <Text style={styles.tableCell}>{formatKES(r.annual)}</Text>
          </View>
        ))}

        {/* Deductions */}
        <Text style={styles.sectionTitle}>Deductions</Text>
        <View style={styles.deductionCard}>
          <View style={styles.deductionRow}>
            <Text style={styles.deductionLabel}>Taxes Withheld</Text>
            <Text style={styles.deductionValue}>{formatKES(records.reduce((s, r) => s + r.monthly, 0) * 0.05)}</Text>
          </View>
          <View style={styles.deductionRow}>
            <Text style={styles.deductionLabel}>MTAA Commissions</Text>
            <Text style={styles.deductionValue}>{formatKES(records.reduce((s, r) => s + r.monthly, 0) * 0.10)}</Text>
          </View>
        </View>

        {/* Withdrawal History */}
        <Text style={styles.sectionTitle}>Withdrawal History</Text>
        <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/wallet/transactions")}>
          <Text style={styles.linkText}>View All Transactions</Text>
          <Feather name="chevron-right" size={18} color="#E53935" />
        </TouchableOpacity>

        <Text style={styles.auditNote}>Every payment can be audited by the creator. Full transparency, no hidden fees.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 40 },
  walletCard: { backgroundColor: "#141414", borderRadius: 12, padding: 20, marginBottom: 20, alignItems: "center" },
  walletLabel: { color: "#888", fontSize: 14 },
  walletAmount: { color: "#4CAF50", fontSize: 32, fontWeight: "800", marginVertical: 8 },
  walletPending: { color: "#FF9800", fontSize: 13 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1a1a1a", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 4 },
  tableHeaderCell: { color: "#888", fontSize: 11, fontWeight: "700", flex: 1, textAlign: "center" },
  tableRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#141414", paddingVertical: 12, paddingHorizontal: 12, marginBottom: 2 },
  tableDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  tableCellLabel: { color: "#fff", fontSize: 12, fontWeight: "600" },
  tableCell: { color: "#ccc", fontSize: 11, flex: 1, textAlign: "center" },
  deductionCard: { backgroundColor: "#141414", borderRadius: 12, padding: 16, marginBottom: 16 },
  deductionRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  deductionLabel: { color: "#ccc", fontSize: 14 },
  deductionValue: { color: "#f44336", fontSize: 14, fontWeight: "700" },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#141414", borderRadius: 10, padding: 14, marginBottom: 16 },
  linkText: { color: "#E53935", fontSize: 14, fontWeight: "600" },
  auditNote: { color: "#888", fontSize: 12, textAlign: "center", fontStyle: "italic", marginTop: 10 },
});
