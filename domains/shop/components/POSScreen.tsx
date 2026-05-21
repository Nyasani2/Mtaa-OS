// components/shop/POSScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, Modal } from "react-native";
import { useShopStore } from "@/lib/shop/state/shopStore";
import { usePOSSession } from "@/lib/shop/hooks/useShop";
import { ShopService } from "@/lib/shop/services/shopService";
import { CartItem } from "@/lib/shop/types";

interface POSScreenProps {
  shopId: string;
  staffId: string;
}

export default function POSScreen({ shopId, staffId }: POSScreenProps) {
  const { posSession, openSession, closeSession } = usePOSSession(shopId);
  const posCart = useShopStore((s) => s.posCart);
  const addToPosCart = useShopStore((s) => s.addToPosCart);
  const removeFromPosCart = useShopStore((s) => s.removeFromPosCart);
  const clearPosCart = useShopStore((s) => s.clearPosCart);
  const posCartTotal = useShopStore((s) => s.posCartTotal());

  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [paymentModal, setPaymentModal] = useState(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanning(false);
    try {
      const result = await ShopService.getProductByBarcode(shopId, data, "barcode");
      if (result.found && result.product) {
        if (!result.in_stock) {
          Alert.alert("Out of Stock", `${result.product.name} is out of stock`);
          return;
        }
        addToPosCart({ product: result.product, quantity: 1 });
      } else {
        Alert.alert("Not Found", "Product not found in inventory");
      }
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };

  const handleManualEntry = async () => {
    if (!manualCode.trim()) return;
    try {
      const result = await ShopService.getProductByBarcode(shopId, manualCode, "barcode");
      if (result.found && result.product) {
        addToPosCart({ product: result.product, quantity: 1 });
        setManualCode("");
      } else {
        Alert.alert("Not Found", "Product not found");
      }
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };

  const handleCheckout = async (paymentMethod: "cash" | "card" | "wallet") => {
    try {
      const items = posCart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku,
        quantity: item.quantity,
        unit_price: item.product.sale_price || item.product.base_price,
        cost_price: item.product.cost_price,
        variant_data: item.variant || {},
      }));

      const order = await ShopService.createOrder({
        shop_id: shopId,
        customer_id: null,
        items,
        payment_method: paymentMethod,
        is_pos_order: true,
        pos_session_id: posSession?.id,
        delivery_type: "pickup",
      });

      clearPosCart();
      setPaymentModal(false);
      Alert.alert("Success", `Order ${order.order_number} created`);
    } catch (e) {
      Alert.alert("Checkout Failed", (e as Error).message);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.product.name}</Text>
        <Text style={styles.cartItemPrice}>
          R{(item.product.sale_price || item.product.base_price).toFixed(2)} x {item.quantity}
        </Text>
      </View>
      <View style={styles.cartItemActions}>
        <TouchableOpacity onPress={() => removeFromPosCart(item.product.id)} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => addToPosCart({ product: item.product, quantity: 1 })} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!posSession) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>POS Session Required</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => openSession(staffId, 0)}>
          <Text style={styles.primaryBtnText}>Open Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>POS Terminal</Text>
        <TouchableOpacity onPress={() => setScanning(true)} style={styles.scanBtn}>
          <Text style={styles.scanBtnText}>📷 Scan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.manualEntry}>
        <TextInput
          style={styles.input}
          placeholder="Enter barcode or product name..."
          value={manualCode}
          onChangeText={setManualCode}
          onSubmitEditing={handleManualEntry}
        />
        <TouchableOpacity onPress={handleManualEntry} style={styles.addManualBtn}>
          <Text style={styles.addManualBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posCart}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.product.id}
        style={styles.cartList}
        ListEmptyComponent={<Text style={styles.emptyCart}>Scan or type to add items</Text>}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>R{posCartTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.checkoutRow}>
          <TouchableOpacity style={styles.checkoutBtn} onPress={() => setPaymentModal(true)}>
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearBtn} onPress={clearPosCart}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={scanning} animationType="slide">
        <View style={styles.scannerContainer}>
          <Text style={styles.scannerTitle}>Scan Barcode or QR</Text>
          <Text style={styles.scannerHint}>Camera view placeholder - integrate expo-camera</Text>
          <TouchableOpacity style={styles.closeScanner} onPress={() => setScanning(false)}>
            <Text style={styles.closeScannerText}>Close Scanner</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={paymentModal} animationType="slide" transparent>
        <View style={styles.paymentOverlay}>
          <View style={styles.paymentModal}>
            <Text style={styles.paymentTitle}>Payment</Text>
            <Text style={styles.paymentTotal}>R{posCartTotal.toFixed(2)}</Text>
            <TouchableOpacity style={styles.paymentBtn} onPress={() => handleCheckout("cash")}>
              <Text style={styles.paymentBtnText}>💵 Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paymentBtn} onPress={() => handleCheckout("card")}>
              <Text style={styles.paymentBtnText}>💳 Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paymentBtn} onPress={() => handleCheckout("wallet")}>
              <Text style={styles.paymentBtnText}>👛 Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelPayment} onPress={() => setPaymentModal(false)}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  headerTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "700" },
  scanBtn: { backgroundColor: "#f59e0b", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  scanBtnText: { color: "#0f172a", fontWeight: "600" },
  manualEntry: { flexDirection: "row", padding: 12, gap: 8 },
  input: { flex: 1, backgroundColor: "#1e293b", color: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 16 },
  addManualBtn: { backgroundColor: "#3b82f6", paddingHorizontal: 16, justifyContent: "center", borderRadius: 8 },
  addManualBtnText: { color: "#fff", fontWeight: "600" },
  cartList: { flex: 1 },
  cartItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  cartItemInfo: { flex: 1 },
  cartItemName: { color: "#f8fafc", fontSize: 16, fontWeight: "500" },
  cartItemPrice: { color: "#94a3b8", marginTop: 4 },
  cartItemActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  removeBtn: { backgroundColor: "#ef4444", width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  removeBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  addBtn: { backgroundColor: "#22c55e", width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  addBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  quantity: { color: "#f8fafc", fontSize: 16, fontWeight: "600", minWidth: 24, textAlign: "center" },
  emptyCart: { color: "#64748b", textAlign: "center", marginTop: 40, fontSize: 16 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#1e293b" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  totalLabel: { color: "#94a3b8", fontSize: 18 },
  totalAmount: { color: "#f59e0b", fontSize: 24, fontWeight: "700" },
  checkoutRow: { flexDirection: "row", gap: 12 },
  checkoutBtn: { flex: 1, backgroundColor: "#22c55e", padding: 16, borderRadius: 12, alignItems: "center" },
  checkoutBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  clearBtn: { backgroundColor: "#ef4444", paddingHorizontal: 20, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  clearBtnText: { color: "#fff", fontWeight: "600" },
  scannerContainer: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  scannerTitle: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 20 },
  scannerHint: { color: "#94a3b8", marginBottom: 40 },
  closeScanner: { backgroundColor: "rgba(255,255,255,0.2)", padding: 16, borderRadius: 8 },
  closeScannerText: { color: "#fff", fontSize: 16 },
  paymentOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" },
  paymentModal: { backgroundColor: "#1e293b", padding: 24, borderRadius: 16, width: "80%" },
  paymentTitle: { color: "#f8fafc", fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  paymentTotal: { color: "#f59e0b", fontSize: 32, fontWeight: "700", textAlign: "center", marginBottom: 24 },
  paymentBtn: { backgroundColor: "#334155", padding: 16, borderRadius: 12, marginBottom: 12, alignItems: "center" },
  paymentBtnText: { color: "#f8fafc", fontSize: 18, fontWeight: "600" },
  cancelPayment: { alignItems: "center", marginTop: 8 },
  primaryBtn: { backgroundColor: "#3b82f6", padding: 16, borderRadius: 12, alignItems: "center", margin: 16 },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  title: { color: "#f8fafc", fontSize: 20, textAlign: "center", marginTop: 40 },
});
