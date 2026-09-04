"use client";

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFraudFlags, useFraudMetrics, useUpdateFraudFlag } from "../hooks/useFraud";

const SEVERITY_COLORS = {
  low: "#64748b",
  medium: "#ca8a04",
  high: "#dc2626",
  critical: "#7f1d1d",
};

const STATUS_COLORS = {
  open: "#dc2626",
  under_review: "#ca8a04",
  resolved: "#059669",
  false_positive: "#2563eb",
  escalated: "#7c3aed",
};

const SEVERITY_ORDER = ["critical", "high", "medium", "low"] as const;

export default function FraudDashboard() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [severityFilter, setSeverityFilter] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const { flags, count, loading, error, refetch } = useFraudFlags({
    status: statusFilter,
    severity: severityFilter,
    limit: 50,
  });
  const { metrics, refetch: refetchMetrics } = useFraudMetrics(30);
  const { updateFlag, loading: updating } = useUpdateFraudFlag();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchMetrics()]);
    setRefreshing(false);
  };

  const handleResolve = async (flagId: string) => {
    await updateFlag(flagId, { status: "resolved" });
    refetch();
  };

  const handleEscalate = async (flagId: string) => {
    await updateFlag(flagId, { status: "escalated" });
    refetch();
  };

  const handleFalsePositive = async (flagId: string) => {
    await updateFlag(flagId, { status: "false_positive" });
    refetch();
  };

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🛡️ Fraud Detection</Text>
        <Text style={s.headerSubtitle}>Real-time risk monitoring & flag management</Text>
      </View>

      {/* Metrics Summary */}
      <View style={s.metricsRow}>
        <View style={[s.metricCard, { borderLeftColor: "#dc2626" }]}>
          <Text style={[s.metricValue, { color: "#dc2626" }]}>{metrics?.total_flags || 0}</Text>
          <Text style={s.metricLabel}>Total Flags</Text>
        </View>
        <View style={[s.metricCard, { borderLeftColor: "#ca8a04" }]}>
          <Text style={[s.metricValue, { color: "#ca8a04" }]}>{metrics?.open_flags || 0}</Text>
          <Text style={s.metricLabel}>Open</Text>
        </View>
        <View style={[s.metricCard, { borderLeftColor: "#059669" }]}>
          <Text style={[s.metricValue, { color: "#059669" }]}>{metrics?.resolved_flags || 0}</Text>
          <Text style={s.metricLabel}>Resolved</Text>
        </View>
        <View style={[s.metricCard, { borderLeftColor: "#2563eb" }]}>
          <Text style={[s.metricValue, { color: "#2563eb" }]}>{metrics?.false_positives || 0}</Text>
          <Text style={s.metricLabel}>False +</Text>
        </View>
      </View>

      {/* Severity Breakdown */}
      {metrics?.by_severity && (
        <View style={s.severitySection}>
          <Text style={s.sectionTitle}>📊 Severity Breakdown</Text>
          <View style={s.severityBar}>
            {SEVERITY_ORDER.map((sev) => {
              const count = metrics.by_severity[sev] || 0;
              const total = metrics.total_flags || 1;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <View
                  key={sev}
                  style={[
                    s.severitySegment,
                    { backgroundColor: SEVERITY_COLORS[sev], width: `${pct}%` },
                  ]}
                />
              );
            })}
          </View>
          <View style={s.severityLegend}>
            {SEVERITY_ORDER.map((sev) => (
              <View key={sev} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: SEVERITY_COLORS[sev] }]} />
                <Text style={s.legendText}>{sev}: {metrics.by_severity[sev] || 0}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={s.filterSection}>
        <Text style={s.filterLabel}>Status:</Text>
        <View style={s.filterRow}>
          {["open", "under_review", "resolved", "false_positive", "escalated"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[s.filterChip, statusFilter === status && { backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }]}
              onPress={() => setStatusFilter(statusFilter === status ? undefined : status)}
            >
              <Text style={[s.filterChipText, statusFilter === status && { color: "#fff" }]}>
                {status.replace("_", " ").toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[s.filterLabel, { marginTop: 12 }]}>Severity:</Text>
        <View style={s.filterRow}>
          {SEVERITY_ORDER.map((sev) => (
            <TouchableOpacity
              key={sev}
              style={[s.filterChip, severityFilter === sev && { backgroundColor: SEVERITY_COLORS[sev] }]}
              onPress={() => setSeverityFilter(severityFilter === sev ? undefined : sev)}
            >
              <Text style={[s.filterChipText, severityFilter === sev && { color: "#fff" }]}>
                {sev.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Flags List */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>🚩 Regulatory Flags {count > 0 && `(${count})`}</Text>
        {loading && flags.length === 0 ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : flags.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>🛡️</Text>
            <Text style={s.emptyText}>No flags match filters</Text>
          </View>
        ) : (
          flags.map((flag) => (
            <View key={flag.id} style={s.flagCard}>
              <View style={s.flagHeader}>
                <View style={[s.severityBadge, { backgroundColor: SEVERITY_COLORS[flag.severity] + "30" }]}>
                  <Text style={[s.severityText, { color: SEVERITY_COLORS[flag.severity] }]}>
                    {flag.severity.toUpperCase()}
                  </Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[flag.status] + "30" }]}>
                  <Text style={[s.statusText, { color: STATUS_COLORS[flag.status] }]}>
                    {flag.status.replace("_", " ").toUpperCase()}
                  </Text>
                </View>
                <Text style={s.riskScore}>Risk: {flag.risk_score}</Text>
              </View>

              <Text style={s.flagType}>{flag.flag_type.replace(/_/g, " ").toUpperCase()}</Text>
              <Text style={s.flagDesc}>{flag.description}</Text>

              {flag.evidence && Object.keys(flag.evidence).length > 0 && (
                <View style={s.evidenceBox}>
                  <Text style={s.evidenceTitle}>Evidence:</Text>
                  {Object.entries(flag.evidence).map(([key, val]) => (
                    <Text key={key} style={s.evidenceText}>
                      {key}: {typeof val === "number" ? val.toLocaleString() : String(val)}
                    </Text>
                  ))}
                </View>
              )}

              <Text style={s.flagMeta}>
                User: {flag.user_id?.slice(0, 8)}... | Created: {new Date(flag.created_at).toLocaleString()}
              </Text>

              {flag.status === "open" || flag.status === "under_review" ? (
                <View style={s.actionRow}>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: "#059669" }]}
                    onPress={() => handleResolve(flag.id)}
                    disabled={updating}
                  >
                    <Text style={s.actionBtnText}>Resolve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: "#7c3aed" }]}
                    onPress={() => handleEscalate(flag.id)}
                    disabled={updating}
                  >
                    <Text style={s.actionBtnText}>Escalate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: "#64748b" }]}
                    onPress={() => handleFalsePositive(flag.id)}
                    disabled={updating}
                  >
                    <Text style={s.actionBtnText}>False +</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>

      {/* Avg Resolution Time */}
      {metrics?.avg_resolution_time_hours !== undefined && (
        <View style={s.footerSection}>
          <Text style={s.footerText}>
            ⏱️ Avg Resolution Time: {Math.round(metrics.avg_resolution_time_hours * 10) / 10} hours
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { padding: 20, paddingTop: 24, backgroundColor: "#1e293b", borderBottomWidth: 1, borderBottomColor: "#334155" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#f8fafc" },
  headerSubtitle: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 8 },
  metricCard: { width: "48%", backgroundColor: "#1e293b", borderRadius: 12, padding: 16, borderLeftWidth: 4 },
  metricValue: { fontSize: 24, fontWeight: "700" },
  metricLabel: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  severitySection: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#334155" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#f8fafc", marginBottom: 12 },
  severityBar: { flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden", backgroundColor: "#1e293b" },
  severitySegment: { height: "100%" },
  severityLegend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#94a3b8" },
  filterSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#334155" },
  filterLabel: { fontSize: 14, color: "#94a3b8", marginBottom: 8 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: { backgroundColor: "#1e293b", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#334155" },
  filterChipText: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  section: { padding: 16 },
  flagCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 },
  flagHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  severityText: { fontSize: 10, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  riskScore: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  flagType: { fontSize: 14, fontWeight: "700", color: "#f8fafc", marginBottom: 4 },
  flagDesc: { fontSize: 13, color: "#cbd5e1", marginBottom: 8 },
  evidenceBox: { backgroundColor: "#0f172a", borderRadius: 8, padding: 12, marginBottom: 8 },
  evidenceTitle: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  evidenceText: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  flagMeta: { fontSize: 11, color: "#64748b", marginBottom: 8 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  emptyState: { alignItems: "center", padding: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: "#64748b", marginTop: 12 },
  errorText: { color: "#dc2626", textAlign: "center", padding: 20 },
  footerSection: { padding: 20, alignItems: "center", borderTopWidth: 1, borderTopColor: "#334155" },
  footerText: { fontSize: 12, color: "#64748b" },
});

