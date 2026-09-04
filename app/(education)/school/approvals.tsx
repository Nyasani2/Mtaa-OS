import { Alert, useState } from 'react';
// @ts-nocheck
import React, { useEffect, useState, useCallback } from "react";
import { Alert, View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { Alert, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, Ionicons } from "@expo/vector-icons";

export default function SchoolApprovalsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { supabase } = await import("@/lib/supabase");
      const { data, error: err } = await supabase
        .from("education_approvals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (err) throw err;
      setApprovals(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load approvals");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleApprove = async (id: string) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_approvals").update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      load();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to approve");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.title}>Approvals</Text>
        <View style={{ width: 24 }} />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={approvals}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No pending approvals</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.type} | {item.status}</Text>
            {item.status === "pending" && (
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  title: { color: "#e2e8f0", fontSize: 18, fontWeight: "700" },
  errorText: { color: "#f87171", textAlign: "center", padding: 16 },
  card: { backgroundColor: "#1e293b", marginHorizontal: 12, marginVertical: 6, padding: 16, borderRadius: 12 },
  cardTitle: { color: "#e2e8f0", fontSize: 16, fontWeight: "600", marginBottom: 4 },
  cardBody: { color: "#94a3b8", fontSize: 14, marginBottom: 8 },
  approveBtn: { backgroundColor: "#22c55e", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, alignSelf: "flex-start" },
  approveText: { color: "#fff", fontWeight: "700" },
  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "#64748b", marginTop: 12, fontSize: 16 },
});
