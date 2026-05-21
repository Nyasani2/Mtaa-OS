import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Order } from "@/lib/marketplace/types";

interface Props {
  order: Order;
}

export function OrderCard({ order }: Props) {
  const statusColors: Record<string, string> = { pending: "#F59E0B", confirmed: "#6366F1", shipped: "#3B82F6", delivered: "#10B981", cancelled: "#EF4444", disputed: "#DC2626" };
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.id}>Order #{order.id.slice(-6)}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[order.status] + "20" }]}>
          <Text style={[styles.badgeText, { color: statusColors[order.status] }]}>{order.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.price}>${order.totalPrice.toLocaleString()} {order.currency}</Text>
      <Text style={styles.meta}>Escrow: {order.escrowStatus}</Text>
      {order.trackingNumber && <Text style={styles.tracking}>Tracking: {order.trackingNumber}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  id: { color: "#94A3B8", fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  price: { color: "white", fontSize: 16, fontWeight: "bold" },
  meta: { color: "#94A3B8", fontSize: 13, marginTop: 4 },
  tracking: { color: "#6366F1", fontSize: 12, marginTop: 2 },
});
