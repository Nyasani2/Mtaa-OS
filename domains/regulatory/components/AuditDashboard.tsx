"use client";

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuditLogs, useAuditSummary } from "../hooks/useAudit";

const ACTION_COLORS = { INSERT: "#059669", UPDATE: "#ca8a04", DELETE: "#dc2626" };

export default function AuditDashboard() {
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const today = now.toISOString().split("T")[0];
  const { logs, count, loading, error, refetch } = useAuditLogs({ action: actionFilter as any, limit: 50 });
  const { summary, refetch: refetchSummary } = useAuditSummary(startOfMonth, today);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchSummary()]);
    setRefreshing(false);
  };

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={s.header}>
        <Text style={s.headerTitle}>📋 Audit Trail</Text>
        <Text style={s.headerSubtitle}>Immutable record of system changes</Text>
      </View>

      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>{summary?.totalChanges || 0}</Text>
          <Text style={s.summaryLabel}>Total Changes</Text>
        </View>
        <View style={[s.summaryCard, { borderLeftColor: "#059669" }]}>
          <Text style={[s.summaryValue, { color: "#059669" }]}>{summary?.inserts || 0}</Text>
          <Text style={s.summaryLabel}>Inserts</Text>
        </View>
        <View style={[s.summaryCard, { borderLeftColor: "#ca8a04" }]}>
          <Text style={[s.summaryValue, { color: "#ca8a04" }]}>{summary?.updates || 0}</Text>
          <Text style={s.summaryLabel}>Updates</Text>
        </View>
        <View style={[s.summaryCard, { borderLeftColor: "#dc2626" }]}>
          <Text style={[s.summaryValue, { color: "#dc2626" }]}>{summary?.deletes || 0}</Text>
          <Text style={s.summaryLabel}>Deletes</Text>
        </View>
      </View>

      <View style={s.filterSection}>
        <Text style={s.filterLabel}>Action Filter:</Text>
        <View style={s.filterRow}>
          {["INSERT", "UPDATE", "DELETE"].map((action) => (
            <TouchableOpacity
              key={action}
              style={[s.filterChip, actionFilter === action && { backgroundColor: ACTION_COLORS[action as keyof typeof ACTION_COLORS] }]}
              onPress={() => setActionFilter(actionFilter === action ? undefined : action)}
            >
              <Text style={[s.filterChipText, actionFilter === action && { color: "#fff" }]}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>📝 Recent Audit Logs {count > 0 && `(${count})`}</Text>
        {loading && logs.length === 0 ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : logs.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>No audit logs match filters</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={s.logCard}>
              <View style={s.logHeader}>
                <View style={[s.actionBadge, { backgroundColor: ACTION_COLORS[log.action] }]}>
                  <Text style={s.actionBadgeText}>{log.action}</Text>
                </View>
                <Text style={s.logTable}>{log.table_name}</Text>
                <Text style={s.logTime}>{new Date(log.changed_at).toLocaleString()}</Text>
              </View>
              <View style={s.logDetails}>
                <Text style={s.logDetailText}>Record: {log.record_id}</Text>
                <Text style={s.logDetailText}>By: {log.changed_by}</Text>
                {log.reason && <Text style={s.logDetailText}>Reason: {log.reason}</Text>}
              </View>
              {log.new_data && (
                <View style={s.dataPreview}>
                  <Text style={s.dataPreviewTitle}>New Data:</Text>
                  <Text style={s.dataPreviewText}>
                    {JSON.stringify(log.new_data).substring(0, 200)}
                    {JSON.stringify(log.new_data).length > 200 ? "..." : ""}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { padding: 20, paddingTop: 24, backgroundColor: "#1e293b", borderBottomWidth: 1, borderBottomColor: "#334155" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#f8fafc" },
  headerSubtitle: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 8 },
  summaryCard: { width: "48%", backgroundColor: "#1e293b", borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: "#2563eb" },
  summaryValue: { fontSize: 24, fontWeight: "700", color: "#f8fafc" },
  summaryLabel: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  filterSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#334155" },
  filterLabel: { fontSize: 14, color: "#94a3b8", marginBottom: 8 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: { backgroundColor: "#1e293b", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#334155" },
  filterChipText: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#f8fafc", marginBottom: 12 },
  logCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 },
  logHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 },
  actionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  actionBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  logTable: { fontSize: 14, fontWeight: "600", color: "#f8fafc", flex: 1 },
  logTime: { fontSize: 11, color: "#64748b" },
  logDetails: { marginBottom: 8 },
  logDetailText: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  dataPreview: { backgroundColor: "#0f172a", borderRadius: 8, padding: 12 },
  dataPreviewTitle: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  dataPreviewText: { fontSize: 11, color: "#94a3b8", fontFamily: "monospace" },
  emptyState: { alignItems: "center", padding: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: "#64748b", marginTop: 12 },
  errorText: { color: "#dc2626", textAlign: "center", padding: 20 },
});
