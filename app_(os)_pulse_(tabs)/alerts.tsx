// app/(os)/pulse/(tabs)/alerts.tsx
// MTAA Pulse — Alerts Tab

import React, { useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from "react-native";
import { usePulseAlerts } from "@/domains/pulse/hooks/usePulseHome";
import { AlertTriangle, Bell, Shield, MapPin, X, Check } from "lucide-react-native";

const FILTERS = [
  { key: "all", label: "All", icon: Bell },
  { key: "emergency", label: "Emergency", icon: AlertTriangle },
  { key: "security", label: "Security", icon: Shield },
  { key: "platform", label: "Platform", icon: Bell },
  { key: "community", label: "Community", icon: MapPin },
] as const;

export default function PulseAlertsScreen() {
  const { alerts, unreadCount, isLoading, loadAlerts, markRead, dismiss } = usePulseAlerts();
  const [filter, setFilter] = React.useState<string>("all");

  useEffect(() => {
    loadAlerts(filter === "all" ? {} : { type: filter });
  }, [filter]);

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.alert_type === filter);
  const activeAlerts = filtered.filter((a) => !a.is_dismissed);

  return (
    <View style={styles.container}>
      {/* Unread Badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBar}>
          <Bell size={16} color="#FF6B35" />
          <Text style={styles.unreadText}>{unreadCount} unread alert{unreadCount > 1 ? "s" : ""}</Text>
          <TouchableOpacity onPress={() => activeAlerts.filter((a) => !a.is_read).forEach((a) => markRead(a.id))}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <f.icon size={14} color={filter === f.key ? "#fff" : "rgba(255,255,255,0.5)"} />
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && alerts.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => loadAlerts()} tintColor="#FF6B35" />}
          showsVerticalScrollIndicator={false}
        >
          {activeAlerts.map((alert) => (
            <View key={alert.id} style={[styles.alertCard, getSeverityBorder(alert.severity), !alert.is_read && styles.unreadCard]}>
              <View style={styles.alertIconWrap}>
                {getSeverityIcon(alert.severity)}
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDesc}>{alert.description}</Text>
                <View style={styles.alertFooter}>
                  <Text style={styles.alertMeta}>{alert.alert_type} • {alert.region || "All"}</Text>
                  <Text style={styles.alertTime}>{new Date(alert.created_at).toLocaleDateString()}</Text>
                </View>
                {alert.action_url && (
                  <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.actionText}>{alert.action_label || "Take Action"}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.alertActions}>
                {!alert.is_read && (
                  <TouchableOpacity style={styles.actionIcon} onPress={() => markRead(alert.id)}>
                    <Check size={16} color="#34D399" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionIcon} onPress={() => dismiss(alert.id)}>
                  <X size={16} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {activeAlerts.length === 0 && (
            <View style={styles.empty}>
              <Bell size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No active alerts</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function getSeverityBorder(severity: string) {
  switch (severity) {
    case "emergency": return { borderLeftColor: "#FF3B30", borderLeftWidth: 3 };
    case "critical": return { borderLeftColor: "#FF6B35", borderLeftWidth: 3 };
    case "warning": return { borderLeftColor: "#FBBF24", borderLeftWidth: 3 };
    default: return { borderLeftColor: "#60A5FA", borderLeftWidth: 3 };
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "emergency": return <AlertTriangle size={20} color="#FF3B30" />;
    case "critical": return <AlertTriangle size={20} color="#FF6B35" />;
    case "warning": return <AlertTriangle size={20} color="#FBBF24" />;
    default: return <Bell size={20} color="#60A5FA" />;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  unreadBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "rgba(255,107,53,0.1)",
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  unreadText: { color: "#FF6B35", fontSize: 13, fontWeight: "600", flex: 1 },
  markAll: { color: "#FF6B35", fontSize: 12, fontWeight: "600" },

  filterBar: { maxHeight: 50, paddingHorizontal: 12, paddingVertical: 8 },
  filterBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)",
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: "#FF6B35" },
  filterText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  filterTextActive: { color: "#fff" },

  alertCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12, marginHorizontal: 16, marginBottom: 10, padding: 14,
  },
  unreadCard: { backgroundColor: "rgba(255,255,255,0.07)" },
  alertIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  alertContent: { flex: 1 },
  alertTitle: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  alertDesc: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8 },
  alertFooter: { flexDirection: "row", justifyContent: "space-between" },
  alertMeta: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
  alertTime: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
  actionBtn: {
    backgroundColor: "#FF6B35", borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, alignSelf: "flex-start", marginTop: 10,
  },
  actionText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  alertActions: { justifyContent: "space-between", paddingLeft: 8 },
  actionIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },

  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: 14, marginTop: 12 },
});
