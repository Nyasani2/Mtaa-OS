"use client";

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CropCertificate } from "../types";
import { FileCheck, Calendar, MapPin, AlertCircle } from "lucide-react-native";

interface Props {
  certificate: CropCertificate;
}

export function CertificateCard({ certificate }: Props) {
  const isExpired = certificate.status === "expired";
  const isRevoked = certificate.status === "revoked";
  const statusColor = isExpired ? "#DC2626" : isRevoked ? "#7C3AED" : "#059669";
  const statusBg = isExpired ? "#FEE2E2" : isRevoked ? "#EDE9FE" : "#D1FAE5";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: statusBg }]}>
          <FileCheck size={20} color={statusColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.certNumber}>{certificate.certificate_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{certificate.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.cropText}>{certificate.crop_type} — {certificate.variety}</Text>
        <Text style={styles.detailText}>Quantity: {certificate.quantity} {certificate.unit}</Text>
        <View style={styles.detailRow}>
          <MapPin size={14} color="#64748B" />
          <Text style={styles.detailText}>{certificate.origin_farm}, {certificate.origin_county}</Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={14} color="#64748B" />
          <Text style={styles.detailText}>Expires: {new Date(certificate.expiry_date).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.detailText}>Phytosanitary: {certificate.phytosanitary_status}</Text>
      </View>

      {isExpired && (
        <View style={styles.alertBox}>
          <AlertCircle size={14} color="#DC2626" />
          <Text style={styles.alertText}>Certificate expired. Re-inspection required.</Text>
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
  certNumber: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  details: { gap: 6 },
  cropText: { fontSize: 15, fontWeight: "600", color: "#334155" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, color: "#64748B" },
  alertBox: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, padding: 8, backgroundColor: "#FEE2E2", borderRadius: 8 },
  alertText: { fontSize: 12, color: "#DC2626", fontWeight: "600" },
});
