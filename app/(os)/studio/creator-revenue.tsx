import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase/client";

interface RevenueLedger {
  gross_revenue: number;
  platform_commission: number;
  government_tax: number;
  net_earnings: number;
  wallet_deposit: number;
}

interface RevenueBreakdown {
  label: string;
  amount: number;
  color: string;
}

export default function CreatorRevenueScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [ledger, setLedger] = useState<RevenueLedger | null>(null);
  const [breakdown, setBreakdown] = useState<RevenueBreakdown[]>([]);

  useEffect(() => { loadRevenue(); }, []);

  async function loadRevenue() {
    if (!user) return;
    const { data } = await supabase.from("studio_creator_revenue").select("*").eq("creator_id", user.id).single();
    if (data) {
      setLedger({
        gross_revenue: data.gross_revenue || 0,
        platform_commission: data.platform_commission || 0,
        government_tax: data.government_tax || 0,
        net_earnings: data.net_earnings || 0,
        wallet_deposit: data.wallet_deposit || 0,
      });
      setBreakdown([
        { label: "Ad Revenue", amount: data.ad_revenue || 0, color: "#E53935" },
        { label: "Memberships", amount: data.membership_revenue || 0, color: "#9C27B0" },
        { label: "Tips", amount: data.tips_revenue || 0, color: "#FF9800" },
        { label: "Digital Sales", amount: data.digital_sales || 0, color: "#2196F3" },
        { label: "Course Sales", amount: data.course_revenue || 0, color: "#4CAF50" },
        { label: "Music Sales", amount: data.music_revenue || 0, color: "#00BCD4" },
        { label: "Merchandise", amount: data.merch_revenue || 0, color: "#795548" },
        { label: "Event Tickets", amount: data.event_revenue || 0, color: "#607D8B" },
      ]);
    }
  }

  const formatKES = (n: number) => `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const total = breakdown.reduce((s, b) => s + b.amount, 0) || 1;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Revenue</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Transparent Ledger */}
        <View style={styles.ledgerCard}>
          <Text style={styles.ledgerTitle}>Transparent Earnings Ledger</Text>
          {ledger && (
            <>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>Gross Revenue</Text>
                <Text style={styles.ledgerValue}>{formatKES(ledger.gross_revenue)}</Text>
              </View>
              <View style={styles.arrowDown}><Feather name="arrow-down" size={16} color="#888" /></View>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>Platform Commission (10%)</Text>
                <Text style={[styles.ledgerValue, { color: "#f44336" }]}>-{formatKES(ledger.platform_commission)}</Text>
              </View>
              <View style={styles.arrowDown}><Feather name="arrow-down" size={16} color="#888" /></View>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>Government Tax</Text>
                <Text style={[styles.ledgerValue, { color: "#f44336" }]}>-{formatKES(ledger.government_tax)}</Text>
              </View>
              <View style={styles.arrowDown}><Feather name="arrow-down" size={16} color="#888" /></View>
              <View style={styles.ledgerRow}>
                <Text style={[styles.ledgerLabel, { color: "#4CAF50" }]}>Net Creator Earnings</Text>
                <Text style={[styles.ledgerValue, { color: "#4CAF50", fontSize: 20 }]}>{formatKES(ledger.net_earnings)}</Text>
              </View>
              <View style={styles.arrowDown}><Feather name="arrow-down" size={16} color="#888" /></View>
              <View style={styles.ledgerRow}>
                <Text style={[styles.ledgerLabel, { color: "#2196F3" }]}>Wallet Deposit</Text>
                <Text style={[styles.ledgerValue, { color: "#2196F3", fontSize: 20 }]}>{formatKES(ledger.wallet_deposit)}</Text>
              </View>
            </>
          )}
          <Text style={styles.transparencyNote}>Every transaction is fully traceable. No hidden deductions.</Text>
        </View>

        {/* Revenue Breakdown */}
        <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
        {breakdown.map((item, i) => (
          <View key={i} style={styles.breakdownRow}>
            <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
            <Text style={styles.breakdownLabel}>{item.label}</Text>
            <View style={{ flex: 1, height: 8, backgroundColor: "#1a1a1a", borderRadius: 4, marginHorizontal: 12, overflow: "hidden" }}>
              <View style={{ width: `${Math.min((item.amount / total) * 100, 100)}%`, height: "100%", backgroundColor: item.color, borderRadius: 4 }} />
            </View>
            <Text style={styles.breakdownValue}>{formatKES(item.amount)}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push("/wallet")}>
          <Text style={styles.btnPrimaryText}>View Wallet</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 40 },
  ledgerCard: { backgroundColor: "#141414", borderRadius: 12, padding: 20, marginBottom: 20 },
  ledgerTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 16 },
  ledgerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  ledgerLabel: { color: "#ccc", fontSize: 14 },
  ledgerValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  arrowDown: { alignItems: "center", marginVertical: 4 },
  transparencyNote: { color: "#888", fontSize: 12, textAlign: "center", marginTop: 14, fontStyle: "italic" },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  breakdownRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  breakdownDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  breakdownLabel: { color: "#ccc", fontSize: 13, width: 100 },
  breakdownValue: { color: "#fff", fontSize: 13, fontWeight: "700", width: 90, textAlign: "right" },
  btnPrimary: { backgroundColor: "#E53935", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
