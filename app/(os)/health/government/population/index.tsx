// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { useGovernment } from "@/lib/health/hooks/useGovernment";

export default function PopulationScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { population, loading, error, refreshing, refresh, searchPopulation } = useGovernment(user?.id);
  const [query, setQuery] = useState("");

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (text.trim().length > 2) {
      searchPopulation(text);
    }
  }, [searchPopulation]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={s.headerTitle}>Population Health</Text>
        <TouchableOpacity onPress={() => router.push("/(os)/health/government/population/add" as any)} style={s.headerAction}>
          <Ionicons name="add" size={22} color="#fff"/>
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color="#94a3b8" style={s.searchIcon} />
        <TextInput style={s.searchInput} placeholder="Search citizens..." placeholderTextColor="#94a3b8" value={query} onChangeText={handleSearch} />
        {query.length > 0 && <TouchableOpacity onPress={() => { setQuery(""); searchPopulation(""); }}><Ionicons name="close-circle" size={18} color="#94a3b8"/></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>} contentContainerStyle={s.scrollContent}>
        {loading && !refreshing ? (
          <View style={s.center}><ActivityIndicator size="large" color="#2563eb"/><Text style={s.loadingText}>Loading...</Text></View>
        ) : error ? (
          <View style={s.center}><Ionicons name="alert-circle" size={48} color="#ef4444"/><Text style={s.errorText}>{error}</Text><TouchableOpacity style={s.retryBtn} onPress={refresh}><Text style={s.retryText}>Retry</Text></TouchableOpacity></View>
        ) : population.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="people-outline" size={64} color="#cbd5e1"/>
            <Text style={s.emptyTitle}>No Records</Text>
            <Text style={s.emptySub}>Population health data will appear here.</Text>
          </View>
        ) : population.map((p) => (
          <TouchableOpacity key={p.id} style={s.card} onPress={() => router.push({ pathname: "/(os)/health/government/population/detail", params: { id: p.id } } as any)}>
            <View style={s.cardAvatar}><Text style={s.cardAvatarText}>{(p.name || "?").charAt(0)}</Text></View>
            <View style={s.cardInfo}>
              <Text style={s.cardName}>{p.name || "Unknown"}</Text>
              <Text style={s.cardMeta}>{p.age} yrs · {p.gender} · {p.city || "Unknown"}</Text>
              <View style={s.cardTags}>
                <View style={[s.tag, { backgroundColor: p.vaccination_status === "up_to_date" ? "#ecfdf5" : "#fef2f2" }]}>
                  <Text style={[s.tagText, { color: p.vaccination_status === "up_to_date" ? "#059669" : "#ef4444" }]}>{p.vaccination_status || "Unknown"}</Text>
                </View>
                {p.chronic_conditions?.length > 0 && (
                  <View style={[s.tag, { backgroundColor: "#fff7ed" }]}><Text style={[s.tagText, { color: "#ea580c" }]}>{p.chronic_conditions.length} conditions</Text></View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8"/>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { backgroundColor: "#0f3d5e", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, flexDirection: "row", alignItems: "center" },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", flex: 1 },
  headerAction: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", margin: 16, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#1e293b" },
  scrollContent: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { marginTop: 12, fontSize: 15, color: "#64748b" },
  errorText: { marginTop: 12, fontSize: 15, color: "#ef4444", textAlign: "center" },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "#0f3d5e", borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginTop: 16 },
  emptySub: { fontSize: 14, color: "#94a3b8", marginTop: 4, textAlign: "center" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  cardAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#0f3d5e", justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardAvatarText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  cardMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  cardTags: { flexDirection: "row", gap: 6, marginTop: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: "600" },
});
