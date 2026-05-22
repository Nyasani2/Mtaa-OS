"use client";

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DrivingLicense } from "../types";
import { IdCard, Calendar, AlertCircle } from "lucide-react-native";

interface Props {
  license: DrivingLicense;
}

export function LicenseCard({ license }: Props) {
  const isExpired = license.status === "expired";
  const isSuspended = license.status === "suspended";

  const statusColor = isExpired ? "#DC2626" : isSuspended ? "#F59E0B" : "#059669";
  const statusBg = isExpired ? "#FEE2E2" : isSuspended ? "#FEF3C7" : "#D1FAE5";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: statusBg }]}>
          <IdCard size={20} color={statusColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.licenseNumber}>{license.license_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{license.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Calendar size={14} color="#64748B" />
          <Text style={styles.detailText}>Expires: {new Date(license.expiry_date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailText}>Categories: {license.category.join(", ")}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailText}>County: {license.county}</Text>
        </View>
      </View>

      {isExpired && (
        <View style={styles.alertBox}>
          <AlertCircle size={14} color="#DC2626" />
          <Text style={styles.alertText}>License expired. Renewal required.</Text>
        </View>
      )}
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
  licenseNumber: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  details: { gap: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, color: "#64748B" },
  alertBox: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, padding: 8, backgroundColor: "#FEE2E2", borderRadius: 8 },
  alertText: { fontSize: 12, color: "#DC2626", fontWeight: "600" },
});
