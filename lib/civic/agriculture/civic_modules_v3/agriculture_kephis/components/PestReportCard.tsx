"use client";

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PestDiseaseReport } from "../types";
import { Bug, MapPin, Calendar, TrendingUp } from "lucide-react-native";

interface Props {
  report: PestDiseaseReport;
}

export function PestReportCard({ report }: Props) {
  const isOutbreak = report.spread_status === "outbreak";
  const severityColor = report.severity === "severe" ? "#DC2626" : report.severity === "high" ? "#EA580C" : report.severity === "moderate" ? "#F59E0B" : "#059669";
  const severityBg = severityColor + "15";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: severityBg }]}>
          <Bug size={20} color={severityColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.pestName}>{report.pest_disease_name}</Text>
          <View style={[styles.severityBadge, { backgroundColor: severityBg }]}>
            <Text style={[styles.severityText, { color: severityColor }]}>{report.severity.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>Type: {report.type} | Affected: {report.affected_crop}</Text>
        <Text style={styles.detailText}>Area affected: {report.area_affected_hectares} hectares</Text>
        <View style={styles.detailRow}>
          <MapPin size={14} color="#64748B" />
          <Text style={styles.detailText}>{report.location}, {report.county}</Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={14} color="#64748B" />
          <Text style={styles.detailText}>{new Date(report.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <TrendingUp size={14} color={isOutbreak ? "#DC2626" : "#64748B"} />
          <Text style={[styles.spreadText, isOutbreak && { color: "#DC2626", fontWeight: "700" }]}>
            Spread: {report.spread_status}
          </Text>
        </View>
        <Text style={styles.detailText}>Status: {report.status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  headerText: { marginLeft: 12, flex: 1 },
  pestName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  severityBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  severityText: { fontSize: 10, fontWeight: "700" },
  details: { gap: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, color: "#64748B" },
  spreadText: { fontSize: 13, color: "#64748B" },
});
