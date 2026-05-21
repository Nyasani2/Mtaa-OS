// app/(os)/shop/cart.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from "react-native";
import { useCart } from "@/lib/shop/hooks/useShop";
import { useShopStore } from "@/lib/shop/state/shopStore";
import { ShopService } from "@/lib/shop/services/shopService";
import { router } from "expo-router";

export default function CartScreen() {
  const { cart, removeFromCart, updateCartQuantity, total, clearCart } = useCart();
  const currentShop = useShopStore((s) => s.currentShop);

  const handleCheckout = async () => {
    if (!currentShop) { Alert.alert("Error", "No shop selected"); return; }
    try {
      const items = cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku,
        quantity: item.quantity,
        unit_price: item.product.sale_price || item.product.base_price,
        cost_price: item.product.cost_price,
        variant_data: item.variant || {},
      }));

      const order = await ShopService.createOrder({
        shop_id: currentShop.id,
        items,
        payment_method: "escrow",
        delivery_type: "delivery",
        escrow_enabled: true,
      });

      clearCart();
      Alert.alert("Order Placed", `Order ${order.order_number} created with escrow protection`);
      router.push(`/shop/orders/${order.id}`);
    } catch (e) {
      Alert.alert("Checkout Failed", (e as Error).message);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.product.images?.[0] || "https://via.placeholder.com/80" }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        <Text style={styles.itemPrice}>R{(item.product.sale_price || item.product.base_price).toFixed(2)} each</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity onPress={() => updateCartQuantity(item.product.id, item.quantity - 1)} style={styles.qtyBtn}><Text style={styles.qtyText}>−</Text></TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateCartQuantity(item.product.id, item.quantity + 1)} style={styles.qtyBtn}><Text style={styles.qtyText}>+</Text></TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={styles.removeBtn}><Text style={styles.removeText}>✕</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🛒 Shopping Cart</Text>
      <FlatList data={cart} renderItem={renderItem} keyExtractor={(item) => item.product.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>Your cart is empty</Text>} />
      {cart.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>R{total.toFixed(2)}</Text></View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}><Text style={styles.checkoutText}>🔒 Checkout with Escrow</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { color: "#f8fafc", fontSize: 24, fontWeight: "700", padding: 20 },
  list: { padding: 16 },
  cartItem: { flexDirection: "row", backgroundColor: "#1e293b", borderRadius: 12, padding: 12, marginBottom: 12, alignItems: "center" },
  itemImage: { width: 80, height: 80, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { color: "#f8fafc", fontSize: 16, fontWeight: "600" },
  itemPrice: { color: "#94a3b8", marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  qtyBtn: { width: 28, height: 28, backgroundColor: "#334155", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  qtyText: { color: "#f8fafc", fontWeight: "700" },
  qtyValue: { color: "#f8fafc", fontSize: 16, fontWeight: "600", minWidth: 24, textAlign: "center" },
  removeBtn: { padding: 8 },
  removeText: { color: "#ef4444", fontSize: 18 },
  empty: { color: "#64748b", textAlign: "center", marginTop: 40 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#1e293b" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  totalLabel: { color: "#94a3b8", fontSize: 18 },
  totalValue: { color: "#f59e0b", fontSize: 24, fontWeight: "700" },
  checkoutBtn: { backgroundColor: "#22c55e", padding: 18, borderRadius: 12, alignItems: "center" },
  checkoutText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
