import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMarketplaceStore } from "@/lib/marketplace/hooks/use-marketplace-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ListingCard } from "@/lib/marketplace/components/ListingCard";
import { OrderCard } from "@/lib/marketplace/components/OrderCard";

export default function MarketplaceHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { listings, orders, trustScore, refreshListings, refreshOrders, refreshTrust } = useMarketplaceStore();

  useEffect(() => {
    refreshListings();
    if (user) { refreshOrders(user.id); refreshTrust(user.id); }
  }, [user]);

  const actions = [
    { label: "Browse", icon: "search", route: "/(os)/marketplace/browse", color: "#6366F1" },
    { label: "Orders", icon: "cart", route: "/(os)/marketplace/orders", color: "#10B981" },
    { label: "Sell", icon: "add-circle", route: "/(os)/marketplace/sell", color: "#F59E0B" },
    { label: "Trust", icon: "shield-checkmark", route: "/(os)/marketplace/trust", color: "#EC4899" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Buy, sell, trade with escrow protection</Text>
      </View>

      {trustScore && (
        <View style={styles.trustCard}>
          <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          <View style={styles.trustInfo}>
            <Text style={styles.trustScore}>Trust Score: {trustScore.score}/100</Text>
            <Text style={styles.trustMeta}>{trustScore.transactions} transactions • {trustScore.disputes} disputes</Text>
          </View>
        </View>
      )}

      <View style={styles.actionsRow}>
        {actions.map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.route as any)}>
            <View style={[styles.actionIcon, { backgroundColor: a.color + "20" }]}>
              <Ionicons name={a.icon as any} size={22} color={a.color} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Featured Listings</Text>
      {listings.slice(0, 4).map((listing) => (
        <ListingCard key={listing.id} listing={listing} onPress={() => {}} />
      ))}

      {orders.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {orders.slice(0, 3).map((order) => <OrderCard key={order.id} order={order} />)}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "white" },
  subtitle: { color: "#94A3B8", fontSize: 14, marginTop: 4 },
  trustCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 16, gap: 12 },
  trustInfo: { flex: 1 },
  trustScore: { color: "white", fontSize: 16, fontWeight: "600" },
  trustMeta: { color: "#94A3B8", fontSize: 13, marginTop: 2 },
  actionsRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, marginBottom: 20 },
  actionBtn: { alignItems: "center" },
  actionIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  actionLabel: { color: "white", fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "white", marginTop: 24, marginBottom: 12, paddingHorizontal: 20 },
});
