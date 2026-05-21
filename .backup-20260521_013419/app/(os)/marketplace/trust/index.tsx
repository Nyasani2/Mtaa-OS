import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useMarketplaceStore } from "@/lib/marketplace/hooks/use-marketplace-store";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function TrustScreen() {
  const { user } = useAuthStore();
  const { trustScore, refreshTrust } = useMarketplaceStore();
  useEffect(() => { if (user) refreshTrust(user.id); }, [user]);
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Trust Score</Text>
      {trustScore ? (
        <View style={styles.card}>
          <Text style={styles.score}>{trustScore.score}/100</Text>
          <Text style={styles.meta}>{trustScore.transactions} transactions</Text>
          <Text style={styles.meta}>{trustScore.disputes} disputes ({trustScore.resolvedDisputes} resolved)</Text>
          <Text style={styles.meta}>{trustScore.verified ? "✓ Verified" : "Not verified"}</Text>
        </View>
      ) : (
        <Text style={styles.empty}>No trust data yet. Complete transactions to build your score.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  title: { fontSize: 24, fontWeight: "bold", color: "white", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  card: { backgroundColor: "#1E293B", borderRadius: 16, padding: 24, margin: 16, alignItems: "center" },
  score: { fontSize: 48, fontWeight: "bold", color: "#10B981" },
  meta: { color: "#94A3B8", fontSize: 14, marginTop: 8 },
  empty: { color: "#64748B", textAlign: "center", marginTop: 40, paddingHorizontal: 20 },
});
