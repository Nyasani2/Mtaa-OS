"use client";

import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from "react-native";
import { useComplianceReports, useTaxRecords, useGenerateReport } from "../hooks/useCompliance";

const REPORT_TYPES = [
  { id: "daily_summary", label: "📅 Daily" },
  { id: "weekly_summary", label: "📊 Weekly" },
  { id: "monthly_summary", label: "📈 Monthly" },
  { id: "suspicious_activity", label: "🚨 Suspicious" },
  { id: "large_transactions", label: "💰 Large Txn" },
  { id: "cross_border", label: "🌍 Cross Border" },
];

const STATUS_COLORS = { draft: "#64748b", submitted: "#2563eb", acknowledged: "#059669", rejected: "#dc2626" };

export default function ComplianceDashboard() {
  const [selectedType, setSelectedType] = useState("monthly_summary");
  const [refreshing, setRefreshing] = useState(false);
  const { reports, loading, error, refetch } = useComplianceReports({ limit: 20 });
  const { records: taxRecords } = useTaxRecords({ limit: 10 });
  const { generateReport, loading: generating } = useGenerateReport();

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const handleGenerate = async () => {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    await generateReport(selectedType, start, end);
    refetch();
  };

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={s.header}>
        <Text style={s.headerTitle}>⚖️ Compliance Center</Text>
        <Text style={s.headerSubtitle}>Regulatory reporting & tax management</Text>
      </View>

      <View style={s.generateSection}>
        <Text style={s.sectionTitle}>📄 Generate Report</Text>
        <View style={s.typeGrid}>
          {REPORT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[s.typeChip, selectedType === type.id && s.typeChipActive]}
              onPress={() => setSelectedType(type.id)}
            >
              <Text style={[s.typeChipText, selectedType === type.id && s.typeChipTextActive]}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.generateBtn} onPress={handleGenerate} disabled={generating}>
          <Text style={s.generateBtnText}>{generating ? "Generating..." : "Generate Report"}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>📋 Recent Reports</Text>
        {loading && reports.length === 0 ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : reports.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>No reports generated yet</Text>
          </View>
        ) : (
          reports.map((report) => (
            <View key={report.id} style={s.reportCard}>
              <View style={s.reportHeader}>
                <Text style={s.reportType}>{report.report_type.replace(/_/g, " ").toUpperCase()}</Text>
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[report.status] + "20" }]}>
                  <Text style={[s.statusText, { color: STATUS_COLORS[report.status] }]}>{report.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={s.reportPeriod}>{report.period_start} → {report.period_end}</Text>
              <View style={s.reportStats}>
                <Text style={s.reportStat}>Vol: KES {(report.total_volume || 0).toLocaleString()}</Text>
                <Text style={s.reportStat}>Txns: {report.total_transactions || 0}</Text>
                <Text style={s.reportStat}>Users: {report.total_users || 0}</Text>
              </View>
              <Text style={s.reportJurisdiction}>🌍 {report.jurisdiction}</Text>
            </View>
          ))
        )}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>💵 Recent Tax Records</Text>
        {taxRecords.length === 0 ? (
          <Text style={s.emptyText}>No tax records found</Text>
        ) : (
          taxRecords.slice(0, 5).map((record) => (
            <View key={record.id} style={s.taxCard}>
              <View style={s.taxHeader}>
                <Text style={s.taxType}>{record.tax_type.toUpperCase()}</Text>
                <Text style={s.taxAmount}>KES {record.tax_amount.toLocaleString()}</Text>
              </View>
              <Text style={s.taxDetail}>Rate: {(record.tax_rate * 100).toFixed(2)}%</Text>
              <Text style={s.taxDetail}>Period: {record.tax_period}</Text>
              <Text style={s.taxDetail}>Status: {record.status}</Text>
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
  generateSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#334155" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#f8fafc", marginBottom: 12 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  typeChip: { backgroundColor: "#1e293b", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#334155" },
  typeChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  typeChipText: { fontSize: 12, color: "#94a3b8" },
  typeChipTextActive: { color: "#fff", fontWeight: "600" },
  generateBtn: { backgroundColor: "#059669", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  generateBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#334155" },
  reportCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 },
  reportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  reportType: { fontSize: 14, fontWeight: "700", color: "#f8fafc", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  reportPeriod: { fontSize: 12, color: "#94a3b8", marginBottom: 8 },
  reportStats: { flexDirection: "row", gap: 16, marginBottom: 8 },
  reportStat: { fontSize: 12, color: "#cbd5e1" },
  reportJurisdiction: { fontSize: 12, color: "#64748b" },
  taxCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 },
  taxHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  taxType: { fontSize: 14, fontWeight: "600", color: "#f8fafc" },
  taxAmount: { fontSize: 16, fontWeight: "700", color: "#059669" },
  taxDetail: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  emptyState: { alignItems: "center", padding: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, color: "#64748b", marginTop: 8, textAlign: "center" },
  errorText: { color: "#dc2626", textAlign: "center", padding: 20 },
});
