"use client";

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { TrafficOffence } from "../types";
import { AlertTriangle, MapPin, Calendar, CreditCard } from "lucide-react-native";

interface Props {
  offence: TrafficOffence;
  onPay: (id: string) => void;
}

export function OffenceCard({ offence, onPay }: Props) {
  const isPending = offence.status === "pending";
  const statusColor = isPending ? "#DC2626" : offence.status === "paid" ? "#059669" : "#F59E0B";
  const statusBg = isPending ? "#FEE2E2" : offence.status === "paid" ? "#D1FAE5" : "#FEF3C7";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: statusBg }]}>
          <AlertTriangle size={20} color={statusColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.offenceType}>{offence.offence_type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{offence.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.description}>{offence.description}</Text>
        <View style={styles.detailRow}>
          <MapPin size={14} color="#64748B" />
          <Text style={styles.detailText}>{offence.location}, {offence.county}</Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={14} color="#64748B" />
          <Text style={styles.detailText}>{new Date(offence.offence_date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <CreditCard size={14} color="#64748B" />
          <Text style={[styles.fineText, { color: statusColor }]}>Fine: KES {offence.fine_amount.toLocaleString()}</Text>
        </View>
        <Text style={styles.detailText}>Points deducted: {offence.points_deducted}</Text>
      </View>

      {isPending && (
        <TouchableOpacity style={styles.payButton} onPress={() => onPay(offence.id)}>
          <CreditCard size={16} color="#FFFFFF" />
          <Text style={styles.payButtonText}>Pay Fine Now</Text>
        </TouchableOpacity>
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
  offenceType: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  details: { gap: 6 },
  description: { fontSize: 14, color: "#334155", marginBottom: 4 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, color: "#64748B" },
  fineText: { fontSize: 14, fontWeight: "700" },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  payButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});
