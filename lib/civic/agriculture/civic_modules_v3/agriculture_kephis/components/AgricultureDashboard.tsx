"use client";

import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useAgriculture } from "../controllers/useAgriculture";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { FileCheck, Sprout, Bug, TrendingUp, ClipboardList, Search, Plus } from "lucide-react-native";

export function AgricultureDashboard() {
  const { user } = useAuth();
  const { certificates, seedLicenses, pestReports, marketPrices, isLoading, error, loadCertificates, loadSeedLicenses, loadPestReports, loadMarketPrices } = useAgriculture();

  React.useEffect(() => {
    if (user?.id) {
      loadCertificates(user.id);
      loadSeedLicenses(user.id);
    }
    loadPestReports();
    loadMarketPrices();
  }, [user?.id]);

  const activeCerts = certificates.filter((c) => c.status === "active").length;
  const expiredCerts = certificates.filter((c) => c.status === "expired").length;
  const activeLicenses = seedLicenses.filter((l) => l.status === "active").length;
  const activeOutbreaks = pestReports.filter((p) => p.spread_status === "outbreak").length;

  const menuItems = [
    { icon: FileCheck, label: "Crop Certificates", count: certificates.length, route: "/(os)/agriculture/certificates", color: "#059669" },
    { icon: Sprout, label: "Seed Licenses", count: seedLicenses.length, route: "/(os)/agriculture/seed-licenses", color: "#7C3AED" },
    { icon: Bug, label: "Pest / Disease", count: pestReports.length, route: "/(os)/agriculture/pest-reports", color: "#DC2626" },
    { icon: TrendingUp, label: "Market Prices", count: marketPrices.length, route: "/(os)/agriculture/market-prices", color: "#0891B2" },
    { icon: ClipboardList, label: "Applications", count: 0, route: "/(os)/agriculture/applications", color: "#EA580C" },
    { icon: Search, label: "Verify Certificate", route: "/(os)/agriculture/verify", color: "#2563EB" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KEPHIS Agriculture</Text>
        <Text style={styles.headerSubtitle}>Kenya Plant Health Inspectorate Service</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#D1FAE5" }]}>
          <Text style={[styles.statNumber, { color: "#059669" }]}>{activeCerts}</Text>
          <Text style={styles.statLabel}>Active Certs</Text>
          {expiredCerts > 0 && <Text style={styles.statWarning}>{expiredCerts} expired</Text>}
        </View>
        <View style={[styles.statCard, { backgroundColor: "#EDE9FE" }]}>
          <Text style={[styles.statNumber, { color: "#7C3AED" }]}>{activeLicenses}</Text>
          <Text style={styles.statLabel}>Seed Licenses</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#FEE2E2" }]}>
          <Text style={[styles.statNumber, { color: "#DC2626" }]}>{activeOutbreaks}</Text>
          <Text style={styles.statLabel}>Outbreaks</Text>
        </View>
      </View>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuCard}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + "15" }]}>
              <item.icon size={24} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.count !== undefined && item.count > 0 && (
              <View style={[styles.badge, { backgroundColor: item.color }]}>
                <Text style={styles.badgeText}>{item.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => router.push("/(os)/agriculture/apply" as any)}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>New Application</Text>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { padding: 20, paddingTop: 40, backgroundColor: "#166534" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 14, color: "#A7F3D0", marginTop: 4 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: "center" },
  statNumber: { fontSize: 28, fontWeight: "700" },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 4, textAlign: "center" },
  statWarning: { fontSize: 11, color: "#DC2626", marginTop: 2 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  menuCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  menuIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  menuLabel: { fontSize: 13, fontWeight: "600", color: "#334155" },
  badge: { position: "absolute", top: 8, right: 8, borderRadius: 10, minWidth: 20, height: 20, justifyContent: "center", alignItems: "center" },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#166534",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  errorBox: { margin: 16, padding: 12, backgroundColor: "#FEE2E2", borderRadius: 8 },
  errorText: { color: "#DC2626", fontSize: 14 },
});
