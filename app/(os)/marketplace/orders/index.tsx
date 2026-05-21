import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useMarketplaceStore } from "@/lib/marketplace/hooks/use-marketplace-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { OrderCard } from "@/lib/marketplace/components/OrderCard";

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const { orders, refreshOrders } = useMarketplaceStore();
  useEffect(() => { if (user) refreshOrders(user.id); }, [user]);
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      {orders.map((order) => <OrderCard key={order.id} order={order} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  title: { fontSize: 24, fontWeight: "bold", color: "white", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
});
