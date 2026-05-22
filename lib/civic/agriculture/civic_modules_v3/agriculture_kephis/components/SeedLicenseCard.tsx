"use client";

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SeedLicense } from "../types";
import { Sprout, Calendar, MapPin } from "lucide-react-native";

interface Props {
  license: SeedLicense;
}

export function SeedLicenseCard({ license }: Props) {
  const isExpired = license.status === "expired";
  const statusColor = isExpired ? "#DC2626" : license.status === "suspended" ? "#F59E0B" : "#7C3AED";
  const statusBg = isExpired ? "#FEE2E2" : license.status === "suspended" ? "#FEF3C7" : "#EDE9FE";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: statusBg }]}>
          <Sprout size={20} color={statusColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.licenseNumber}>{license.license_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{license.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.businessText}>{license.business_name}</Text>
        <Text style={styles.detailText}>Type: {license.license_type}</Text>
        <Text style={styles.detailText}>Crops: {license.crop_categories.join(", ")}</Text>
        <View style={styles.detailRow}>
          <MapPin size={14} color="#64748B" />
          <Text style={styles.detailText}>{license.business_address}, {license.county}</Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={14} color="#64748B" />
          <Text style={styles.detailText}>Expires: {new Date(license.expiry_date).toLocaleDateString()}</Text>
        </View>
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
  licenseNumber: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  details: { gap: 6 },
  businessText: { fontSize: 15, fontWeight: "600", color: "#334155" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, color: "#64748B" },
});
