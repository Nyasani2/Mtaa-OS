import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Alert, SafeAreaView } from "react-native-safe-area-context";
import { Alert, useRouter } from "expo-router";
import { Feather } from '@expo/vector-icons';
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, supabase } from "@/lib/supabase";

interface RevenueShare {
  id: string; type: string; gross_amount: number; platform_rate: number; tax_rate: number;
  platform_amount: number; tax_amount: number; creator_amount: number; status: string; created_at: string;
}

const REVENUE_TYPES = [
  { key: "ads", label: "Advertising Revenue", split: "50% Creator / 50% MTAA" },
  { key: "direct", label: "Direct Creator Sales", split: "90% Creator / 10% MTAA" },
  { key: "music", label: "Music Sales", split: "90% Creator / 10% MTAA" },
  { key: "course", label: "Course Sales", split: "90% Creator / 10% MTAA" },
  { key: "podcast", label: "Podcast Subscriptions", split: "90% Creator / 10% MTAA" },
  { key: "product", label: "Digital Products", split: "90% Creator / 10% MTAA" },
  { key: "membership", label: "Premium Subscriptions", split: "90% Creator / 10% MTAA" },
  { key: "event", label: "Event Tickets", split: "90% Creator / 10% MTAA" },
];

export default function RevenueSharingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [shares, setShares] = useState<RevenueShare[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "payouts">("overview");

  useEffect(() => { loadShares(); }, []);

  async function loadShares() {
    if (!user) return;
    const { data } = await supabase.from("studio_revenue").select("*").eq("creator_id", user.id).order("created_at", { ascending: false });
    setShares(data || []);
  }

  async function requestPayout() {
    if (!user) return;
    const { error } = await supabase.from("studio_payout_requests").insert({ creator_id: user.id, status: "pending" });
    if (error) { Alert.alert("Error", error.message); return; }
    Alert.alert("Payout Requested", "Your payout request has been submitted for review.");
  }

  const totalGross = shares.reduce((s, sh) => s + sh.gross_amount, 0);
  const totalNet = shares.reduce((s, sh) => s + sh.creator_amount, 0);
  const totalPlatform = shares.reduce((s, sh) => s + sh.platform_amount, 0);
  const totalTax = shares.reduce((s, sh) => s + sh.tax_amount, 0);

  const formatKES = (n: number) => `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue Sharing</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabRow}>
        {(["overview", "history", "payouts"] as const).map((tab: any) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === "overview" && (
          <>
            <View style={styles.totalsCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Gross Revenue</Text>
                <Text style={styles.totalValue}>{formatKES(totalGross)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Platform Commission (10%)</Text>
                <Text style={[styles.totalValue, { color: "#f44336" }]}>-{formatKES(totalPlatform)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Government Tax</Text>
                <Text style={[styles.totalValue, { color: "#f44336" }]}>-{formatKES(totalTax)}</Text>
              </View>
              <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: "#333", marginTop: 8, paddingTop: 12 }]}>
                <Text style={[styles.totalLabel, { color: "#4CAF50" }]}>Your Net Earnings</Text>
                <Text style={[styles.totalValue, { color: "#4CAF50", fontSize: 22 }]}>{formatKES(totalNet)}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Revenue Split Rules</Text>
            {REVENUE_TYPES.map((rt, i) => (
              <View key={i} style={styles.ruleCard}>
                <Text style={styles.ruleLabel}>{rt.label}</Text>
                <Text style={styles.ruleSplit}>{rt.split}</Text>
                <Text style={styles.ruleNote}>Taxes calculated separately per jurisdiction.</Text>
              </View>
            ))}
          </>
        )}

        {activeTab === "history" && (
          <>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {shares.length === 0 ? (
              <Text style={styles.emptyText}>No revenue transactions yet.</Text>
            ) : (
              shares.map((s: any) => (
                <View key={s.id} style={styles.txRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txType}>{REVENUE_TYPES.find((r: any) => r.key === s.type)?.label || s.type}</Text>
                    <Text style={styles.txDate}>{new Date(s.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.txGross}>{formatKES(s.gross_amount)}</Text>
                    <Text style={styles.txNet}>{formatKES(s.creator_amount)} net</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "payouts" && (
          <>
            <Text style={styles.sectionTitle}>Payouts</Text>
            <View style={styles.payoutCard}>
              <Text style={styles.payoutLabel}>Available for Withdrawal</Text>
              <Text style={styles.payoutAmount}>{formatKES(totalNet)}</Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={requestPayout}>
                <Text style={styles.btnPrimaryText}>Request Payout</Text>
              </TouchableOpacity>
              <Text style={styles.payoutNote}>Payouts processed within 3-5 business days to your linked wallet.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#E53935" },
  tabText: { color: "#888", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#E53935" },
  scroll: { padding: 16, paddingBottom: 40 },
  totalsCard: { backgroundColor: "#141414", borderRadius: 12, padding: 20, marginBottom: 20 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  totalLabel: { color: "#ccc", fontSize: 14 },
  totalValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  ruleCard: { backgroundColor: "#141414", borderRadius: 10, padding: 14, marginBottom: 10 },
  ruleLabel: { color: "#fff", fontSize: 14, fontWeight: "700" },
  ruleSplit: { color: "#E53935", fontSize: 13, fontWeight: "600", marginTop: 4 },
  ruleNote: { color: "#888", fontSize: 12, marginTop: 4 },
  emptyText: { color: "#888", fontSize: 14, textAlign: "center", marginVertical: 30 },
  txRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#141414", borderRadius: 10, padding: 14, marginBottom: 8 },
  txType: { color: "#fff", fontSize: 14, fontWeight: "600" },
  txDate: { color: "#888", fontSize: 12, marginTop: 2 },
  txGross: { color: "#fff", fontSize: 14, fontWeight: "700" },
  txNet: { color: "#4CAF50", fontSize: 12, marginTop: 2 },
  payoutCard: { backgroundColor: "#141414", borderRadius: 12, padding: 20, alignItems: "center" },
  payoutLabel: { color: "#888", fontSize: 14 },
  payoutAmount: { color: "#4CAF50", fontSize: 32, fontWeight: "800", marginVertical: 12 },
  payoutNote: { color: "#888", fontSize: 12, textAlign: "center", marginTop: 12 },
  btnPrimary: { backgroundColor: "#E53935", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 10, width: "100%" },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
