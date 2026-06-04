"use client";

import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from "react-native";
import { useCBKReportData, useGenerateReport } from "../hooks/useCompliance";

export default function CBKDashboard() {
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [refreshing, setRefreshing] = useState(false);
  const { data, loading, error, refetch } = useCBKReportData(period + "-01");
  const { generateReport, loading: generating } = useGenerateReport();

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const handleGenerateReport = async () => {
    const now = new Date(); const start = `${period}-01`;
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    await generateReport("monthly_summary", start, end);
  };

  if (loading && !data) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={s.loadingText}>Loading CBK Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🏛️ Central Bank Dashboard</Text>
        <Text style={s.headerSubtitle}>MTAA Financial Regulatory Overview</Text>
      </View>

      <View style={s.periodBar}>
        <Text style={s.periodLabel}>Period:</Text>
        <Text style={s.periodValue}>{period}</Text>
        <TouchableOpacity style={s.generateBtn} onPress={handleGenerateReport} disabled={generating}>
          <Text style={s.generateBtnText}>{generating ? "Generating..." : "📄 Generate"}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.metricsGrid}>
        <View style={[s.metricCard, { borderLeftColor: "#2563eb" }]}>
          <Text style={s.metricTitle}>Total Transactions</Text>
          <Text style={[s.metricValue, { color: "#2563eb" }]}>{data?.total_transactions?.toLocaleString() || "0"}</Text>
          <Text style={s.metricSubtitle}>This period</Text>
        </View>
        <View style={[s.metricCard, { borderLeftColor: "#059669" }]}>
          <Text style={s.metricTitle}>Total Value (KES)</Text>
          <Text style={[s.metricValue, { color: "#059669" }]}>KES {(data?.total_value || 0).toLocaleString()}</Text>
          <Text style={s.metricSubtitle}>Transaction volume</Text>
        </View>
        <View style={[s.metricCard, { borderLeftColor: "#0891b2" }]}>
          <Text style={s.metricTitle}>Success Rate</Text>
          <Text style={[s.metricValue, { color: "#0891b2" }]}>
            {data?.total_transactions ? Math.round((data?.successful_transactions / data?.total_transactions) * 100) : 0}%
          </Text>
          <Text style={s.metricSubtitle}>{data?.successful_transactions || 0} successful</Text>
        </View>
        <View style={[s.metricCard, { borderLeftColor: "#dc2626" }]}>
          <Text style={s.metricTitle}>Failed</Text>
          <Text style={[s.metricValue, { color: "#dc2626" }]}>{data?.failed_transactions || 0}</Text>
          <Text style={s.metricSubtitle}>transactions</Text>
        </View>
        <View style={[s.metricCard, { borderLeftColor: "#7c3aed" }]}>
          <Text style={s.metricTitle}>Active Users</Text>
          <Text style={[s.metricValue, { color: "#7c3aed" }]}>{data?.unique_users?.toLocaleString() || "0"}</Text>
          <Text style={s.metricSubtitle}>Unique transactors</Text>
        </View>
        <View style={[s.metricCard, { borderLeftColor: "#ea580c" }]}>
          <Text style={s.metricTitle}>New Users</Text>
          <Text style={[s.metricValue, { color: "#ea580c" }]}>{data?.new_users?.toLocaleString() || "0"}</Text>
          <Text style={s.metricSubtitle}>This period</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>💰 Average Transaction Size</Text>
        <View style={s.bigMetric}>
          <Text style={s.bigMetricValue}>KES {Math.round(data?.avg_transaction_value || 0).toLocaleString()}</Text>
          <Text style={s.bigMetricLabel}>Per transaction average</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>🚨 Fraud Incidents</Text>
        <View style={[s.alertBox, { backgroundColor: (data?.fraud_incidents || 0) > 0 ? "#fef2f2" : "#f0fdf4" }]}>
          <Text style={[s.alertCount, { color: (data?.fraud_incidents || 0) > 0 ? "#dc2626" : "#059669" }]}>
            {data?.fraud_incidents || 0}
          </Text>
          <Text style={s.alertLabel}>
            {(data?.fraud_incidents || 0) > 0 ? "Incidents flagged" : "No fraud incidents"}
          </Text>
        </View>
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>Institution Code: MTAA001 | Jurisdiction: Kenya (KE)</Text>
        <Text style={s.footerText}>Generated: {new Date().toLocaleString()}</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" },
  loadingText: { color: "#94a3b8", marginTop: 12, fontSize: 14 },
  header: { padding: 20, paddingTop: 24, backgroundColor: "#1e293b", borderBottomWidth: 1, borderBottomColor: "#334155" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#f8fafc" },
  headerSubtitle: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  periodBar: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#1e293b", borderBottomWidth: 1, borderBottomColor: "#334155" },
  periodLabel: { color: "#94a3b8", fontSize: 14, marginRight: 8 },
  periodValue: { color: "#f8fafc", fontSize: 16, fontWeight: "600", flex: 1 },
  generateBtn: { backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  generateBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 12 },
  metricCard: { width: "47%", backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 8, borderLeftWidth: 4 },
  metricTitle: { fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  metricValue: { fontSize: 22, fontWeight: "700", marginTop: 8 },
  metricSubtitle: { fontSize: 12, color: "#64748b", marginTop: 4 },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#334155" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#f8fafc", marginBottom: 12 },
  bigMetric: { backgroundColor: "#1e293b", borderRadius: 12, padding: 20, alignItems: "center" },
  bigMetricValue: { fontSize: 32, fontWeight: "700", color: "#f8fafc" },
  bigMetricLabel: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  alertBox: { borderRadius: 12, padding: 20, alignItems: "center" },
  alertCount: { fontSize: 36, fontWeight: "700" },
  alertLabel: { fontSize: 14, color: "#64748b", marginTop: 4 },
  footer: { padding: 20, alignItems: "center" },
  footerText: { fontSize: 12, color: "#475569", marginTop: 2 },
});
