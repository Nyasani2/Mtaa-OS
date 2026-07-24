// lib/mtaxi/components/DriverHome.tsx
import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Power, DollarSign, List, TrendingUp, Star, Car, ChevronRight, UserPlus } from "lucide-react-native";
import { useDriver } from "../hooks/useDriver";
import { useAuth } from "@/lib/auth/store/auth.store";

export default function DriverHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { driver, earnings, loading, error, goOnline, goOffline, fetchEarnings } = useDriver(user?.id || "");

  useEffect(() => { if (driver) fetchEarnings(); }, [driver]);

  const toggleOnline = () => {
    if (driver?.is_online) { goOffline(); } else { goOnline(-1.2921, 36.8219); }
  };

  if (loading && !driver) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={{ marginTop: 12, color: "#94a3b8" }}>Loading driver profile...</Text>
      </View>
    );
  }

  if (!driver) {
    return (
      <View style={styles.center}>
        <Car size={48} color="#64748b" />
        <Text style={{ fontSize: 18, color: "#94a3b8", marginTop: 12 }}>Not registered as a driver</Text>
        <Text style={{ fontSize: 14, color: "#64748b", marginTop: 4, textAlign: "center", paddingHorizontal: 40 }}>
          Earn money by driving with MTaxi. Complete your application in minutes.
        </Text>
        <TouchableOpacity style={styles.applyBtn} onPress={() => router.push("/(mtaxi)/driver/onboarding")}>
          <UserPlus size={20} color="#fff" />
          <Text style={styles.applyBtnText}>Apply to Drive</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.learnMoreBtn} onPress={() => router.push("/(mtaxi)/driver-earnings")}>
          <Text style={styles.learnMoreText}>Learn about driver earnings →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Driver Mode</Text>
        <View style={styles.onlineRow}>
          <Text style={styles.onlineLabel}>{driver.is_online ? "Online — Accepting Rides" : "Offline"}</Text>
          <Switch value={driver.is_online} onValueChange={toggleOnline} trackColor={{ false: "#334155", true: "#10b981" }} thumbColor={driver.is_online ? "#fff" : "#94a3b8"} />
        </View>
      </View>

      <View style={styles.earningsCard}>
        <Text style={styles.earningsTitle}>Today&apos;s Earnings</Text>
        <Text style={styles.earningsAmount}>${earnings.today.toFixed(2)}</Text>
        <Text style={styles.earningsDetail}>{earnings.tripsToday} trips completed</Text>
        <View style={styles.earningsRow}>
          <View style={styles.earningsCol}>
            <Text style={styles.earningsLabel}>This Week</Text>
            <Text style={styles.earningsValue}>${earnings.week.toFixed(2)}</Text>
          </View>
          <View style={styles.earningsCol}>
            <Text style={styles.earningsLabel}>This Month</Text>
            <Text style={styles.earningsValue}>${earnings.month.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(mtaxi)/driver-requests")}>
          <List size={20} color="#f59e0b" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.actionText}>Ride Requests</Text>
            <Text style={styles.actionSub}>View pending passenger requests</Text>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(mtaxi)/driver-ride")}>
          <Car size={20} color="#3b82f6" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.actionText}>Current Ride</Text>
            <Text style={styles.actionSub}>Active trip navigation</Text>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(mtaxi)/driver-earnings")}>
          <TrendingUp size={20} color="#10b981" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.actionText}>Earnings Details</Text>
            <Text style={styles.actionSub}>Full breakdown & history</Text>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Star size={16} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.profileText}>Rating: {driver.rating.toFixed(1)}</Text>
          </View>
          <View style={styles.profileRow}>
            <Car size={16} color="#3b82f6" />
            <Text style={styles.profileText}>{driver.vehicle_type} · {driver.vehicle_plate}</Text>
          </View>
          <View style={styles.profileRow}>
            <DollarSign size={16} color="#10b981" />
            <Text style={styles.profileText}>Total Trips: {driver.total_trips}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a", padding: 24 },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#1e293b" },
  greeting: { fontSize: 24, fontWeight: "700", color: "#fff" },
  onlineRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  onlineLabel: { fontSize: 16, color: "#94a3b8" },
  earningsCard: { margin: 16, padding: 20, backgroundColor: "#1e293b", borderRadius: 12, borderLeftWidth: 4, borderLeftColor: "#f59e0b" },
  earningsTitle: { fontSize: 14, color: "#94a3b8" },
  earningsAmount: { fontSize: 36, fontWeight: "800", color: "#fff", marginVertical: 8 },
  earningsDetail: { fontSize: 14, color: "#64748b" },
  earningsRow: { flexDirection: "row", marginTop: 16, gap: 20 },
  earningsCol: { flex: 1 },
  earningsLabel: { fontSize: 12, color: "#64748b" },
  earningsValue: { fontSize: 16, fontWeight: "700", color: "#fff", marginTop: 4 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#1e293b", borderRadius: 10, marginBottom: 10 },
  actionText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  actionSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  profileCard: { backgroundColor: "#1e293b", borderRadius: 10, padding: 16 },
  profileRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  profileText: { marginLeft: 10, fontSize: 14, color: "#e2e8f0" },
  applyBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#f59e0b", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, marginTop: 24, gap: 10 },
  applyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  learnMoreBtn: { marginTop: 16, padding: 10 },
  learnMoreText: { color: "#3b82f6", fontSize: 14, fontWeight: "600" },
});
