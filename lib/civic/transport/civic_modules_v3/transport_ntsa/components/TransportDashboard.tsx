"use client";

import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useTransport } from "../controllers/useTransport";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { Car, IdCard, AlertTriangle, FileText, MapPin, Search, Plus } from "lucide-react-native";

export function TransportDashboard() {
  const { user } = useAuth();
  const { licenses, vehicles, offences, isLoading, error, loadLicenses, loadVehicles, loadOffences } = useTransport();

  React.useEffect(() => {
    if (user?.id) {
      loadLicenses(user.id);
      loadVehicles(user.id);
      loadOffences(user.id);
    }
  }, [user?.id]);

  const activeLicenses = licenses.filter((l) => l.status === "active").length;
  const expiredLicenses = licenses.filter((l) => l.status === "expired").length;
  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const pendingOffences = offences.filter((o) => o.status === "pending").length;
  const totalFines = offences
    .filter((o) => o.status === "pending")
    .reduce((sum, o) => sum + o.fine_amount, 0);

  const menuItems = [
    { icon: IdCard, label: "My Licenses", count: licenses.length, route: "/(os)/transport/licenses", color: "#2563EB" },
    { icon: Car, label: "My Vehicles", count: vehicles.length, route: "/(os)/transport/vehicles", color: "#059669" },
    { icon: AlertTriangle, label: "Traffic Offences", count: pendingOffences, route: "/(os)/transport/offences", color: "#DC2626" },
    { icon: FileText, label: "Applications", count: 0, route: "/(os)/transport/applications", color: "#7C3AED" },
    { icon: MapPin, label: "Road Incidents", count: 0, route: "/(os)/transport/incidents", color: "#EA580C" },
    { icon: Search, label: "Plate Search", route: "/(os)/transport/search", color: "#0891B2" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NTSA Transport</Text>
        <Text style={styles.headerSubtitle}>National Transport & Safety Authority</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#DBEAFE" }]}>
          <Text style={[styles.statNumber, { color: "#2563EB" }]}>{activeLicenses}</Text>
          <Text style={styles.statLabel}>Active Licenses</Text>
          {expiredLicenses > 0 && (
            <Text style={styles.statWarning}>{expiredLicenses} expired</Text>
          )}
        </View>
        <View style={[styles.statCard, { backgroundColor: "#D1FAE5" }]}>
          <Text style={[styles.statNumber, { color: "#059669" }]}>{activeVehicles}</Text>
          <Text style={styles.statLabel}>Active Vehicles</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#FEE2E2" }]}>
          <Text style={[styles.statNumber, { color: "#DC2626" }]}>{pendingOffences}</Text>
          <Text style={styles.statLabel}>Pending Fines</Text>
          <Text style={styles.statWarning}>KES {totalFines.toLocaleString()}</Text>
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
        onPress={() => router.push("/(os)/transport/apply" as any)}
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
  header: { padding: 20, paddingTop: 40, backgroundColor: "#1E3A5F" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 14, color: "#94A3B8", marginTop: 4 },
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
    backgroundColor: "#1E3A5F",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  errorBox: { margin: 16, padding: 12, backgroundColor: "#FEE2E2", borderRadius: 8 },
  errorText: { color: "#DC2626", fontSize: 14 },
});
