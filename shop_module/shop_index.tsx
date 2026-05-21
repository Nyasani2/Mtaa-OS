// app/(os)/shop/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { useShopStore } from "@/lib/shop/state/shopStore";
import { useMyShops } from "@/lib/shop/hooks/useShop";
import ShopDashboard from "@/components/shop/ShopDashboard";
import POSScreen from "@/components/shop/POSScreen";
import ProductManager from "@/components/shop/ProductManager";
import OrderManager from "@/components/shop/OrderManager";
import AccountingDashboard from "@/components/shop/AccountingDashboard";
import AffiliateManager from "@/components/shop/AffiliateManager";
import { Text, TouchableOpacity, ScrollView } from "react-native";

export default function ShopScreen() {
  const { shops, loading } = useMyShops();
  const activeTab = useShopStore((s) => s.activeTab);
  const setActiveTab = useShopStore((s) => s.setActiveTab);
  const currentShop = useShopStore((s) => s.currentShop);
  const setCurrentShop = useShopStore((s) => s.setCurrentShop);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading your shops...</Text>
      </View>
    );
  }

  if (shops.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>🏪 No Shop Yet</Text>
        <Text style={styles.emptyDesc}>Create your first business to start selling</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => { /* Navigate to shop creation */ }}>
          <Text style={styles.createBtnText}>+ Create Shop</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const shop = currentShop || shops[0];
  if (!currentShop) setCurrentShop(shop);

  const TABS = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "pos", label: "POS", icon: "🛒" },
    { key: "products", label: "Products", icon: "📦" },
    { key: "orders", label: "Orders", icon: "📋" },
    { key: "accounting", label: "Accounting", icon: "💰" },
    { key: "affiliates", label: "Affiliates", icon: "🔗" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <ShopDashboard shopId={shop.id} />;
      case "pos": return <POSScreen shopId={shop.id} staffId={shop.owner_id} />;
      case "products": return <ProductManager shopId={shop.id} />;
      case "orders": return <OrderManager shopId={shop.id} />;
      case "accounting": return <AccountingDashboard shopId={shop.id} />;
      case "affiliates": return <AffiliateManager shopId={shop.id} isOwner={shop.owner_id === /* current user id */ true} />;
      default: return <ShopDashboard shopId={shop.id} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Shop Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shopSelector}>
        {shops.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.shopChip, currentShop?.id === s.id && styles.shopChipActive]}
            onPress={() => setCurrentShop(s)}
          >
            <Text style={[styles.shopChipText, currentShop?.id === s.id && styles.shopChipTextActive]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  loadingText: { color: "#94a3b8", textAlign: "center", marginTop: 40 },
  emptyTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "700", textAlign: "center", marginTop: 60 },
  emptyDesc: { color: "#64748b", textAlign: "center", marginTop: 12, marginBottom: 24 },
  createBtn: { backgroundColor: "#3b82f6", marginHorizontal: 40, padding: 16, borderRadius: 12, alignItems: "center" },
  createBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  shopSelector: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  shopChip: { backgroundColor: "#1e293b", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  shopChipActive: { backgroundColor: "#f59e0b" },
  shopChipText: { color: "#94a3b8", fontWeight: "500" },
  shopChipTextActive: { color: "#0f172a", fontWeight: "700" },
  tabBar: { paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  tab: { alignItems: "center", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, marginRight: 4 },
  tabActive: { backgroundColor: "#3b82f620" },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { color: "#64748b", fontSize: 11, fontWeight: "500" },
  tabLabelActive: { color: "#3b82f6", fontWeight: "700" },
  content: { flex: 1 },
});
