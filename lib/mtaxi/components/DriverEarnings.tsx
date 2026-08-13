// lib/mtaxi/components/DriverEarnings.tsx
import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { DollarSign, TrendingUp, Calendar, Clock, ChevronLeft } from "lucide-react-native";
import { useDriver } from "../hooks/useDriver";
import { useAuthStore as useAuth } from "@/lib/auth/store/auth.store";

export default function DriverEarnings() {
  const router = useRouter();
  const { user } = useAuth();
  const { earnings, loading, error, fetchEarnings, driver } = useDriver(user?.id || "");

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalAmount}>${(earnings.today + earnings.week + earnings.month).toFixed(2)}</Text>
        <Text style={styles.totalSub}>Lifetime earnings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Breakdown</Text>
        {[
          { label: "Today", amount: earnings.today, icon: Clock, color: "#10b981" },
          { label: "This Week", amount: earnings.week, icon: Calendar, color: "#3b82f6" },
          { label: "This Month", amount: earnings.month, icon: TrendingUp, color: "#f59e0b" },
        ].map((item) => (
          <View key={item.label} style={styles.breakdownRow}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + "20" }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.breakdownLabel}>{item.label}</Text>
              <Text style={styles.breakdownAmount}>${item.amount.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Trips Today</Text>
            <Text style={styles.statValue}>{earnings.tripsToday}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Avg per Trip</Text>
            <Text style={styles.statValue}>${earnings.tripsToday > 0 ? (earnings.today / earnings.tripsToday).toFixed(2) : "0.00"}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Rating</Text>
            <Text style={styles.statValue}>{driver?.rating.toFixed(1) || "--"}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 60, backgroundColor: "#1e293b" },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  totalCard: { margin: 16, padding: 24, backgroundColor: "#1e293b", borderRadius: 12, alignItems: "center", borderLeftWidth: 4, borderLeftColor: "#f59e0b" },
  totalLabel: { fontSize: 14, color: "#94a3b8" },
  totalAmount: { fontSize: 40, fontWeight: "800", color: "#fff", marginVertical: 8 },
  totalSub: { fontSize: 13, color: "#64748b" },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 12 },
  breakdownRow: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#1e293b", borderRadius: 10, marginBottom: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  breakdownLabel: { fontSize: 14, color: "#94a3b8" },
  breakdownAmount: { fontSize: 18, fontWeight: "700", color: "#fff", marginTop: 2 },
  statCard: { backgroundColor: "#1e293b", borderRadius: 10, padding: 16 },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#334155" },
  statLabel: { fontSize: 14, color: "#94a3b8" },
  statValue: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
