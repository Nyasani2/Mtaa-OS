// app/(os)/shop/[shopId]/product/[productId].tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, TextInput } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ShopService } from "@/lib/shop/services/shopService";
import { useCart } from "@/lib/shop/hooks/useShop";
import { ShopProduct, Shop } from "@/lib/shop/types";
import CustomerChat from "@/components/shop/CustomerChat";

export default function ProductDetailScreen() {
  const { shopId, productId } = useLocalSearchParams();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showChat, setShowChat] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    loadData();
  }, [shopId, productId]);

  const loadData = async () => {
    try {
      const [p, s] = await Promise.all([
        ShopService.getProductById(productId as string),
        ShopService.getShopById(shopId as string),
      ]);
      setProduct(p);
      setShop(s);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock_quantity < quantity) { Alert.alert("Error", "Not enough stock"); return; }
    addToCart({ product, quantity });
    Alert.alert("Added to Cart", `${quantity} x ${product.name}`);
  };

  const handleBuyNow = async () => {
    if (!product || !shop) return;
    // Navigate to checkout with this product
  };

  if (!product) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.images?.[0] || "https://via.placeholder.com/400" }} style={styles.heroImage} />
      <View style={styles.content}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.shopName}>🏪 {shop?.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>R{(product.sale_price || product.base_price).toFixed(2)}</Text>
          {product.sale_price && <Text style={styles.originalPrice}>R{product.base_price.toFixed(2)}</Text>}
        </View>
        <Text style={styles.description}>{product.description || "No description available"}</Text>

        <View style={styles.stockRow}>
          <Text style={styles.stockText}>Stock: {product.stock_quantity} units</Text>
          {product.stock_quantity <= product.stock_alert_level && <Text style={styles.lowStock}>⚠️ Low Stock</Text>}
        </View>

        <View style={styles.quantityRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.addCartBtn} onPress={handleAddToCart}>
            <Text style={styles.addCartText}>🛒 Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow}>
            <Text style={styles.buyNowText}>⚡ Buy Now</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.chatBtn} onPress={() => setShowChat(!showChat)}>
          <Text style={styles.chatBtnText}>💬 Chat with Seller</Text>
        </TouchableOpacity>

        {showChat && shop && (
          <View style={styles.chatContainer}>
            <CustomerChat shopId={shop.id} customerId={/* current user id */ "user-id"} productId={product.id} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  loading: { color: "#94a3b8", textAlign: "center", marginTop: 40 },
  heroImage: { width: "100%", height: 300 },
  content: { padding: 20 },
  productName: { color: "#f8fafc", fontSize: 24, fontWeight: "700", marginBottom: 8 },
  shopName: { color: "#94a3b8", fontSize: 15, marginBottom: 12 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  price: { color: "#22c55e", fontSize: 28, fontWeight: "700" },
  originalPrice: { color: "#64748b", fontSize: 18, textDecorationLine: "line-through" },
  description: { color: "#e2e8f0", fontSize: 15, lineHeight: 22, marginBottom: 16 },
  stockRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  stockText: { color: "#94a3b8" },
  lowStock: { color: "#f59e0b", fontWeight: "600" },
  quantityRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  qtyBtn: { width: 40, height: 40, backgroundColor: "#1e293b", borderRadius: 20, alignItems: "center", justifyContent: "center" },
  qtyBtnText: { color: "#f8fafc", fontSize: 20, fontWeight: "700" },
  qtyValue: { color: "#f8fafc", fontSize: 20, fontWeight: "600", minWidth: 30, textAlign: "center" },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  addCartBtn: { flex: 1, backgroundColor: "#1e293b", padding: 16, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#3b82f6" },
  addCartText: { color: "#3b82f6", fontSize: 16, fontWeight: "700" },
  buyNowBtn: { flex: 1, backgroundColor: "#f59e0b", padding: 16, borderRadius: 12, alignItems: "center" },
  buyNowText: { color: "#0f172a", fontSize: 16, fontWeight: "700" },
  chatBtn: { backgroundColor: "#334155", padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  chatBtnText: { color: "#f8fafc", fontWeight: "600" },
  chatContainer: { height: 400, backgroundColor: "#1e293b", borderRadius: 12, overflow: "hidden" },
});
