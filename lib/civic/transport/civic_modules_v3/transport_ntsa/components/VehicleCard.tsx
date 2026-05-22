"use client";

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { VehicleRegistration } from "../types";
import { Car, Calendar, Gauge } from "lucide-react-native";

interface Props {
  vehicle: VehicleRegistration;
}

export function VehicleCard({ vehicle }: Props) {
  const isExpired = vehicle.status === "expired";
  const statusColor = isExpired ? "#DC2626" : vehicle.status === "suspended" ? "#F59E0B" : "#059669";
  const statusBg = isExpired ? "#FEE2E2" : vehicle.status === "suspended" ? "#FEF3C7" : "#D1FAE5";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: statusBg }]}>
          <Car size={20} color={statusColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.plateNumber}>{vehicle.plate_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{vehicle.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model} ({vehicle.year})</Text>
        <View style={styles.detailRow}>
          <Calendar size={14} color="#64748B" />
          <Text style={styles.detailText}>Reg expires: {new Date(vehicle.expiry_date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Gauge size={14} color="#64748B" />
          <Text style={styles.detailText}>{vehicle.body_type} | {vehicle.fuel_type} | {vehicle.seating_capacity} seats</Text>
        </View>
        <Text style={styles.detailText}>County: {vehicle.county}</Text>
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
  plateNumber: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  details: { gap: 6 },
  vehicleName: { fontSize: 15, fontWeight: "600", color: "#334155" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, color: "#64748B" },
});
