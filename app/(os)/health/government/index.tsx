// @ts-nocheck
import React, { useState, useCallback } from "react";
import { Alert,
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from "react-native";
import { Alert, useRouter } from "expo-router";
import { Alert, SafeAreaView } from "react-native-safe-area-context";
import { Alert, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, useHealthRole } from "@/lib/health/hooks/useHealthRole";
import { Alert, useGovernment } from "@/lib/health/hooks/useGovernment";

export default function GovernmentScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { isAdmin } = useHealthRole();
  const { stats, alerts, loading, error, refreshing, refresh, dismissAlert } = useGovernment(user?.id);

  const handleVerifyFacilities = useCallback(() => {
    router.push("/(os)/health/government/verify-facilities" as any);
  }, [router]);

  const handlePopulation = useCallback(() => {
    router.push("/(os)/health/government/population" as any);
  }, [router]);

  const handleSurveillance = useCallback(() => {
    router.push("/(os)/health/government/surveillance" as any);
  }, [router]);

  const handleAlertPress = useCallback((alert: any) => {
    Alert.alert(alert.title, alert.description, [
      { text: "Dismiss", onPress: () => dismissAlert(alert.id) },
      { text: "View Details", onPress: () => router.push({ pathname: "/(os)/health/government/surveillance", params: { alertId: alert.id } } as any) },
    ]);
  }, [router, dismissAlert]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
          <Text style={s.headerTitle}>Government Health</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}><ActivityIndicator size="large" color="#2563eb"/><Text style={s.loadingText}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
          <Text style={s.headerTitle}>Government Health</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <Ionicons name="alert-circle" size={48} color="#ef4444"/>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={refresh}><Text style={s.retryText}>Retry</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={s.headerTitle}>Government Health</Text>
        <TouchableOpacity onPress={refresh} style={s.headerAction}><Ionicons name="refresh" size={22} color="#fff"/></TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>} contentContainerStyle={s.scrollContent}>
        {/* Stats Cards */}
        <View style={s.statsRow}>
          <View style={s.statCard}><Text style={s.statValue}>{stats?.facilities || 0}</Text><Text style={s.statLabel}>Facilities</Text></View>
          <View style={s.statCard}><Text style={s.statValue}>{stats?.verified || 0}</Text><Text style={s.statLabel}>Verified</Text></View>
          <View style={s.statCard}><Text style={s.statValue}>{stats?.alerts || 0}</Text><Text style={s.statLabel}>Alerts</Text></View>
        </View>

        {/* Quick Actions */}
        <Text style={s.sectionTitle}>Actions</Text>
        <View style={s.actionsGrid}>
          <TouchableOpacity style={s.actionCard} onPress={handleVerifyFacilities}>
            <View style={[s.actionIcon, { backgroundColor: "#eff6ff" }]}><FontAwesome5 name="hospital" size={22} color="#2563eb"/></View>
            <Text style={s.actionLabel}>Verify Facilities</Text>
            <Text style={s.actionDesc}>Approve hospitals & clinics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={handlePopulation}>
            <View style={[s.actionIcon, { backgroundColor: "#ecfdf5" }]}><Ionicons name="people" size={22} color="#059669"/></View>
            <Text style={s.actionLabel}>Population</Text>
            <Text style={s.actionDesc}>Health demographics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={handleSurveillance}>
            <View style={[s.actionIcon, { backgroundColor: "#fef2f2" }]}><Ionicons name="warning" size={22} color="#ef4444"/></View>
            <Text style={s.actionLabel}>Surveillance</Text>
            <Text style={s.actionDesc}>Disease monitoring</Text>
          </TouchableOpacity>
        </View>

        {/* Active Alerts */}
        <Text style={s.sectionTitle}>Active Alerts</Text>
        {alerts.length === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons name="shield-checkmark" size={40} color="#059669"/>
            <Text style={s.emptyText}>No active health alerts</Text>
          </View>
        ) : alerts.map((alert) => (
          <TouchableOpacity key={alert.id} style={s.alertCard} onPress={() => handleAlertPress(alert)}>
            <View style={[s.alertSeverity, { backgroundColor: getSeverityColor(alert.severity) }]} />
            <View style={s.alertContent}>
              <Text style={s.alertTitle}>{alert.title}</Text>
              <Text style={s.alertDesc} numberOfLines={2}>{alert.description}</Text>
              <Text style={s.alertMeta}>{alert.location} · {formatDate(alert.created_at)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8"/>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "#dc2626";
    case "high": return "#ea580c";
    case "medium": return "#f59e0b";
    default: return "#2563eb";
  }
}

function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { backgroundColor: "#0f3d5e", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, flexDirection: "row", alignItems: "center" },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", flex: 1 },
  headerAction: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { marginTop: 12, fontSize: 15, color: "#64748b" },
  errorText: { marginTop: 12, fontSize: 15, color: "#ef4444", textAlign: "center" },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "#0f3d5e", borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "600" },
  scrollContent: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  statValue: { fontSize: 22, fontWeight: "700", color: "#1e293b" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 12, marginTop: 8 },
  actionsGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  actionCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  actionIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: "600", color: "#1e293b", textAlign: "center" },
  actionDesc: { fontSize: 10, color: "#94a3b8", textAlign: "center", marginTop: 2 },
  emptyCard: { backgroundColor: "#fff", borderRadius: 14, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 8 },
  alertCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  alertSeverity: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  alertDesc: { fontSize: 12, color: "#64748b", marginTop: 2 },
  alertMeta: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
});
