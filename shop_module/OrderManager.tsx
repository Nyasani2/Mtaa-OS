// components/shop/OrderManager.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, ScrollView } from "react-native";
import { useShopOrders } from "@/lib/shop/hooks/useShop";
import { ShopService } from "@/lib/shop/services/shopService";
import { ShopOrder } from "@/lib/shop/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", confirmed: "#3b82f6", preparing: "#8b5cf6", ready: "#06b6d4",
  out_for_delivery: "#f97316", delivered: "#22c55e", cancelled: "#ef4444", refunded: "#64748b",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", preparing: "Preparing", ready: "Ready",
  out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
};

interface OrderManagerProps {
  shopId: string;
}

export default function OrderManager({ shopId }: OrderManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const { orders, loading, refresh } = useShopOrders(shopId, selectedStatus);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [detailModal, setDetailModal] = useState(false);

  const statusOptions = ["all", "pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await ShopService.updateOrderStatus(orderId, newStatus);
      if (newStatus === "delivered") await ShopService.confirmDelivery(orderId);
      refresh();
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status: newStatus as any });
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };

  const renderOrder = ({ item }: { item: ShopOrder }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => { setSelectedOrder(item); setDetailModal(true); }}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.order_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + "20" }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>
      <Text style={styles.customerName}>{item.customer_name || "Walk-in Customer"}</Text>
      <Text style={styles.orderMeta}>📞 {item.customer_phone || "N/A"} | 🚚 {item.delivery_type}</Text>
      <View style={styles.orderFooter}>
        <Text style={styles.itemCount}>{item.items?.length || 0} items</Text>
        <Text style={styles.orderTotal}>R{item.total_amount.toFixed(2)}</Text>
      </View>
      {item.escrow_enabled && (
        <View style={styles.escrowBadge}>
          <Text style={styles.escrowText}>🔒 Escrow {item.payment_status === "paid" ? "Released" : "Held"}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {statusOptions.map((status) => (
          <TouchableOpacity key={status} style={[styles.filterChip, (selectedStatus === status || (!selectedStatus && status === "all")) && styles.filterChipActive]} onPress={() => setSelectedStatus(status === "all" ? undefined : status)}>
            <Text style={[styles.filterChipText, (selectedStatus === status || (!selectedStatus && status === "all")) && styles.filterChipTextActive]}>
              {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList data={orders} renderItem={renderOrder} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} refreshing={loading} onRefresh={refresh} ListEmptyComponent={<Text style={styles.empty}>No orders found</Text>} />
      <Modal visible={detailModal} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          {selectedOrder && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order {selectedOrder.order_number}</Text>
                <TouchableOpacity onPress={() => setDetailModal(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Customer</Text>
                <Text style={styles.detailText}>👤 {selectedOrder.customer_name || "Walk-in"}</Text>
                <Text style={styles.detailText}>📞 {selectedOrder.customer_phone || "N/A"}</Text>
                <Text style={styles.detailText}>📧 {selectedOrder.customer_email || "N/A"}</Text>
                {selectedOrder.delivery_address && <Text style={styles.detailText}>📍 {selectedOrder.delivery_address}</Text>}
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items</Text>
                {selectedOrder.items?.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemDetail}>{item.quantity} x R{item.unit_price.toFixed(2)}</Text>
                    <Text style={styles.itemTotal}>R{item.total_price.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment</Text>
                <View style={styles.summaryRow}><Text>Subtotal</Text><Text>R{selectedOrder.subtotal.toFixed(2)}</Text></View>
                <View style={styles.summaryRow}><Text>Tax</Text><Text>R{selectedOrder.tax_amount.toFixed(2)}</Text></View>
                <View style={styles.summaryRow}><Text>Delivery</Text><Text>R{selectedOrder.delivery_fee.toFixed(2)}</Text></View>
                {selectedOrder.discount_amount > 0 && <View style={styles.summaryRow}><Text>Discount</Text><Text>-R{selectedOrder.discount_amount.toFixed(2)}</Text></View>}
                <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>R{selectedOrder.total_amount.toFixed(2)}</Text></View>
              </View>
              {selectedOrder.affiliate_id && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Affiliate</Text>
                  <Text style={styles.detailText}>Commission: R{selectedOrder.affiliate_commission.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.actionSection}>
                <Text style={styles.sectionTitle}>Actions</Text>
                <View style={styles.actionGrid}>
                  {selectedOrder.status === "pending" && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange(selectedOrder.id, "confirmed")}>
                      <Text style={styles.actionBtnText}>✅ Confirm Order</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === "confirmed" && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange(selectedOrder.id, "preparing")}>
                      <Text style={styles.actionBtnText}>👨‍🍳 Start Preparing</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === "preparing" && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange(selectedOrder.id, "ready")}>
                      <Text style={styles.actionBtnText}>📦 Mark Ready</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === "ready" && selectedOrder.delivery_type === "delivery" && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange(selectedOrder.id, "out_for_delivery")}>
                      <Text style={styles.actionBtnText}>🚚 Out for Delivery</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === "out_for_delivery" && (
                    <TouchableOpacity style={[styles.actionBtn, styles.deliverBtn]} onPress={() => handleStatusChange(selectedOrder.id, "delivered")}>
                      <Text style={styles.actionBtnText}>✓ Confirm Delivery</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === "ready" && selectedOrder.delivery_type === "pickup" && (
                    <TouchableOpacity style={[styles.actionBtn, styles.deliverBtn]} onPress={() => handleStatusChange(selectedOrder.id, "delivered")}>
                      <Text style={styles.actionBtnText}>✓ Customer Picked Up</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status !== "cancelled" && selectedOrder.status !== "delivered" && (
                    <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => handleStatusChange(selectedOrder.id, "cancelled")}>
                      <Text style={styles.cancelBtnText}>✗ Cancel Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  title: { color: "#f8fafc", fontSize: 20, fontWeight: "700", padding: 16 },
  filterRow: { paddingHorizontal: 12, marginBottom: 8 },
  filterChip: { backgroundColor: "#1e293b", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  filterChipActive: { backgroundColor: "#3b82f6" },
  filterChipText: { color: "#94a3b8", fontWeight: "500" },
  filterChipTextActive: { color: "#fff" },
  list: { padding: 12 },
  orderCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  orderNumber: { color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: "600" },
  customerName: { color: "#e2e8f0", fontSize: 15, marginBottom: 4 },
  orderMeta: { color: "#64748b", fontSize: 13, marginBottom: 8 },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  itemCount: { color: "#94a3b8" },
  orderTotal: { color: "#f59e0b", fontSize: 18, fontWeight: "700" },
  escrowBadge: { marginTop: 8, backgroundColor: "#f59e0b20", padding: 8, borderRadius: 6, alignSelf: "flex-start" },
  escrowText: { color: "#f59e0b", fontSize: 12, fontWeight: "600" },
  empty: { color: "#64748b", textAlign: "center", marginTop: 40 },
  modalContainer: { flex: 1, backgroundColor: "#0f172a" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  modalTitle: { color: "#f8fafc", fontSize: 22, fontWeight: "700" },
  closeBtn: { color: "#94a3b8", fontSize: 24 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  sectionTitle: { color: "#94a3b8", fontSize: 14, fontWeight: "600", textTransform: "uppercase", marginBottom: 12 },
  detailText: { color: "#e2e8f0", fontSize: 15, marginBottom: 6 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#334155" },
  itemName: { color: "#f8fafc", flex: 1 },
  itemDetail: { color: "#94a3b8", marginHorizontal: 12 },
  itemTotal: { color: "#f59e0b", fontWeight: "600" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  totalRow: { borderTopWidth: 1, borderTopColor: "#334155", marginTop: 8, paddingTop: 12 },
  totalLabel: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  totalValue: { color: "#22c55e", fontSize: 18, fontWeight: "700" },
  actionSection: { padding: 20 },
  actionGrid: { gap: 10 },
  actionBtn: { backgroundColor: "#3b82f6", padding: 14, borderRadius: 10, alignItems: "center" },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  deliverBtn: { backgroundColor: "#22c55e" },
  cancelBtn: { backgroundColor: "#ef444420" },
  cancelBtnText: { color: "#ef4444", fontSize: 16, fontWeight: "600" },
});
