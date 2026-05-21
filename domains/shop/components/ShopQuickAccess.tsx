// components/profile/ShopQuickAccess.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useMyShops } from "@/lib/shop/hooks/useShop";
import { useShopStore } from "@/lib/shop/state/shopStore";
import { router } from "expo-router";

export default function ShopQuickAccess() {
  const { shops, loading } = useMyShops();
  const setCurrentShop = useShopStore((s) => s.setCurrentShop);

  if (loading) return null;
  if (shops.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>🏪 Your Business</Text>
        <TouchableOpacity style={styles.createCard} onPress={() => router.push("/shop/create")}>
          <Text style={styles.createIcon}>+</Text>
          <Text style={styles.createText}>Start Selling</Text>
          <Text style={styles.createSubtext}>Create your shop in minutes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>🏪 Your Business</Text>
        <TouchableOpacity onPress={() => router.push("/shop/create")}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {shops.map((shop) => (
          <TouchableOpacity
            key={shop.id}
            style={styles.shopCard}
            onPress={() => {
              setCurrentShop(shop);
              router.push("/shop");
            }}
          >
            <View style={[styles.shopIcon, { backgroundColor: shop.color || "#f59e0b" }]}>
              <Text style={styles.shopIconText}>🏪</Text>
            </View>
            <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
            <Text style={styles.shopStats}>📦 {shop.total_orders} orders</Text>
            <Text style={styles.shopRevenue}>💰 R{shop.total_sales?.toFixed(2) || "0.00"}</Text>
            <View style={[styles.statusBadge, shop.status === "active" ? styles.activeBadge : styles.pendingBadge]}>
              <Text style={styles.statusText}>{shop.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => { setCurrentShop(shops[0]); router.push("/shop"); }}>
          <Text style={styles.actionIcon}>🛒</Text>
          <Text style={styles.actionText}>Open POS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/marketplace")}>
          <Text style={styles.actionIcon}>🌐</Text>
          <Text style={styles.actionText}>Marketplace</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/shop/cart")}>
          <Text style={styles.actionIcon}>🛍️</Text>
          <Text style={styles.actionText}>My Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  addText: { color: "#3b82f6", fontWeight: "600" },
  createCard: { backgroundColor: "#1e293b", borderRadius: 16, padding: 24, marginHorizontal: 16, alignItems: "center", borderWidth: 2, borderColor: "#334155", borderStyle: "dashed" },
  createIcon: { color: "#3b82f6", fontSize: 32, fontWeight: "700", marginBottom: 8 },
  createText: { color: "#f8fafc", fontSize: 18, fontWeight: "600" },
  createSubtext: { color: "#64748b", marginTop: 4 },
  shopCard: { backgroundColor: "#1e293b", borderRadius: 16, padding: 16, marginLeft: 16, width: 160, alignItems: "center" },
  shopIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  shopIconText: { fontSize: 24 },
  shopName: { color: "#f8fafc", fontSize: 15, fontWeight: "600", textAlign: "center", marginBottom: 4 },
  shopStats: { color: "#94a3b8", fontSize: 12, marginBottom: 2 },
  shopRevenue: { color: "#22c55e", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadge: { backgroundColor: "#22c55e20" },
  pendingBadge: { backgroundColor: "#f59e0b20" },
  statusText: { fontSize: 11, fontWeight: "600" },
  quickActions: { flexDirection: "row", paddingHorizontal: 16, marginTop: 16, gap: 12 },
  actionBtn: { flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  actionIcon: { fontSize: 24, marginBottom: 4 },
  actionText: { color: "#e2e8f0", fontSize: 12, fontWeight: "500" },
});
