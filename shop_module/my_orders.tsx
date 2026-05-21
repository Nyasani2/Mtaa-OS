// app/(os)/shop/my-orders.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useShopOrders } from "@/lib/shop/hooks/useShop";
import { ShopService } from "@/lib/shop/services/shopService";
import { ShopOrder } from "@/lib/shop/types";
import { router } from "expo-router";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", confirmed: "#3b82f6", preparing: "#8b5cf6", ready: "#06b6d4",
  out_for_delivery: "#f97316", delivered: "#22c55e", cancelled: "#ef4444", refunded: "#64748b",
};

export default function MyOrdersScreen() {
  const [orders, setOrders] = React.useState<ShopOrder[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    ShopService.getMyOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  const renderOrder = ({ item }: { item: ShopOrder }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => router.push(`/shop/orders/${item.id}`)}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.order_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + "20" }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.shopName}>🏪 {item.shop?.name}</Text>
      <View style={styles.orderFooter}>
        <Text style={styles.itemCount}>{item.items?.length || 0} items</Text>
        <Text style={styles.orderTotal}>R{item.total_amount.toFixed(2)}</Text>
      </View>
      {item.escrow_enabled && <Text style={styles.escrowText}>🔒 Escrow Protected</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Orders</Text>
      <FlatList data={orders} renderItem={renderOrder} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} refreshing={loading} onRefresh={() => ShopService.getMyOrders().then(setOrders)} ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { color: "#f8fafc", fontSize: 24, fontWeight: "700", padding: 20 },
  list: { padding: 16 },
  orderCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  orderNumber: { color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: "600" },
  shopName: { color: "#94a3b8", fontSize: 14, marginBottom: 8 },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  itemCount: { color: "#64748b" },
  orderTotal: { color: "#f59e0b", fontSize: 18, fontWeight: "700" },
  escrowText: { color: "#22c55e", fontSize: 12, marginTop: 8 },
  empty: { color: "#64748b", textAlign: "center", marginTop: 40 },
});
