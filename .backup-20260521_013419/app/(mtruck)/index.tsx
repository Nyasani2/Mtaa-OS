import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFleetStore } from "@/lib/mtruck/hooks/use-fleet-store";
import { FleetStatCard } from "@/lib/mtruck/components/FleetStatCard";
import { QuickActionCard } from "@/lib/mtruck/components/QuickActionCard";
import { ActiveLoadItem } from "@/lib/mtruck/components/ActiveLoadItem";
import { FleetAlertItem } from "@/lib/mtruck/components/FleetAlertItem";

export default function MTruckHome() {
  const router = useRouter();
  const { fleet, loads, alerts, refresh, loading } = useFleetStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const quickActions = [
    { id: "dispatch", label: "Dispatch", icon: "navigate" as const, route: "/(mtruck)/dispatch", color: "#F59E0B" },
    { id: "tracking", label: "Tracking", icon: "location" as const, route: "/(mtruck)/tracking", color: "#10B981" },
    { id: "loads", label: "Load Board", icon: "cube" as const, route: "/(mtruck)/loads", color: "#6366F1" },
    { id: "fleet", label: "Fleet", icon: "bus" as const, route: "/(mtruck)/fleet", color: "#EC4899" },
    { id: "marketplace", label: "Market", icon: "cart" as const, route: "/(mtruck)/marketplace", color: "#8B5CF6" },
    { id: "analytics", label: "Analytics", icon: "bar-chart" as const, route: "/(mtruck)/analytics", color: "#06B6D4" },
    { id: "routes", label: "Routes", icon: "map" as const, route: "/(mtruck)/routes", color: "#14B8A6" },
    { id: "drivers", label: "Drivers", icon: "people" as const, route: "/(mtruck)/drivers", color: "#F97316" },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MTruck OS</Text>
          <Text style={styles.subtitle}>Fleet Command Center</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push("/(mtruck)/settings" as any)}>
          <Ionicons name="settings-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <FleetStatCard label="Active Trucks" value={fleet.activeTrucks} change={5} icon="bus" color="#F59E0B" />
        <FleetStatCard label="On Road" value={fleet.onRoad} change={3} icon="navigate" color="#10B981" />
      </View>
      <View style={styles.statsRow}>
        <FleetStatCard label="Pending Loads" value={fleet.pendingLoads} change={-2} icon="cube" color="#6366F1" />
        <FleetStatCard label="Revenue Today" value={`$${fleet.revenueToday.toLocaleString()}`} change={12} icon="cash" color="#EC4899" />
      </View>

      <Text style={styles.sectionTitle}>Operations</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <QuickActionCard key={action.id} label={action.label} icon={action.icon} color={action.color} onPress={() => router.push(action.route as any)} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Loads</Text>
        <TouchableOpacity onPress={() => router.push("/(mtruck)/loads" as any)}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#6366F1" style={{ marginVertical: 20 }} />
      ) : loads.slice(0, 3).map((load) => (
        <ActiveLoadItem key={load.id} load={load} />
      ))}

      {alerts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Alerts</Text>
          {alerts.slice(0, 3).map((alert) => (
            <FleetAlertItem key={alert.id} alert={alert} />
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "bold", color: "white" },
  subtitle: { fontSize: 14, color: "#94A3B8", marginTop: 4 },
  settingsBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#1E293B", justifyContent: "center", alignItems: "center" },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "white", marginTop: 24, marginBottom: 12, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  seeAll: { color: "#6366F1", fontSize: 14, fontWeight: "600" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
});
