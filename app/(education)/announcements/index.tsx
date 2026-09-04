import { useState } from 'react';
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { Ionicons } from '@expo/vector-icons';

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { supabase } = await import("@/lib/supabase");
      const { data, error: err } = await supabase
        .from("education_announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (err) throw err;
      setAnnouncements(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

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
        <Text style={styles.title}>Announcements</Text>
        <TouchableOpacity onPress={() => router.push("/(education as any)/announcements/create" as any)}>
          <Ionicons name="add-circle" size={24} color="#60a5fa" />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No announcements yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
            <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </TouchableOpacity>
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
  cardDate: { color: "#64748b", fontSize: 12 },
  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "#64748b", marginTop: 12, fontSize: 16 },
});
