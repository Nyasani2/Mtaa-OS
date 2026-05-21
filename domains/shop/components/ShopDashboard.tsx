// components/shop/ShopDashboard.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useDashboard } from "@/lib/shop/hooks/useShop";
import { useShopStore } from "@/lib/shop/state/shopStore";

interface DashboardProps {
  shopId: string;
}

export default function ShopDashboard({ shopId }: DashboardProps) {
  const { stats, loading } = useDashboard(shopId);
  const setActiveTab = useShopStore((s) => s.setActiveTab);

  const StatCard = ({ title, value, subtitle, color, icon, onPress }: any) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Shop Dashboard</Text>
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : stats ? (
        <View style={styles.grid}>
          <StatCard title="Today's Sales" value={`R${(stats.today_sales || 0).toFixed(2)}`} subtitle={`${stats.today_orders || 0} orders today`} color="#22c55e" icon="💰" onPress={() => setActiveTab("orders")} />
          <StatCard title="Total Revenue" value={`R${(stats.total_revenue || 0).toFixed(2)}`} subtitle={`${stats.total_orders || 0} total orders`} color="#3b82f6" icon="📈" onPress={() => setActiveTab("accounting")} />
          <StatCard title="Pending Orders" value={stats.pending_orders?.toString() || "0"} subtitle="Awaiting action" color="#f59e0b" icon="⏳" onPress={() => setActiveTab("orders")} />
          <StatCard title="Low Stock" value={stats.low_stock_items?.toString() || "0"} subtitle="Items need restocking" color="#ef4444" icon="⚠️" onPress={() => setActiveTab("inventory")} />
        </View>
      ) : (
        <Text style={styles.empty}>No data available</Text>
      )}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab("pos")}>
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.actionText}>Open POS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab("products")}>
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab("inventory")}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Inventory</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { color: "#f8fafc", fontSize: 24, fontWeight: "700", padding: 20 },
  loading: { color: "#94a3b8", textAlign: "center", marginTop: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 10, gap: 10 },
  statCard: { width: "47%", backgroundColor: "#1e293b", borderRadius: 12, padding: 16, borderLeftWidth: 4 },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  statTitle: { color: "#94a3b8", fontSize: 13, fontWeight: "500" },
  statSubtitle: { color: "#64748b", fontSize: 11, marginTop: 4 },
  empty: { color: "#64748b", textAlign: "center", marginTop: 40 },
  quickActions: { padding: 20 },
  sectionTitle: { color: "#94a3b8", fontSize: 14, fontWeight: "600", textTransform: "uppercase", marginBottom: 12 },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionText: { color: "#e2e8f0", fontSize: 13, fontWeight: "500" },
});
