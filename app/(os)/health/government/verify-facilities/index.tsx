import React, { useState, useCallback } from "react";
import { Alert,
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, TextInput, Alert,
} from "react-native";
import { Alert, useRouter } from "expo-router";
import { Alert, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, useGovernment } from "@/lib/health/hooks/useGovernment";

export default function VerifyFacilitiesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { facilities, loading, error, refreshing, refresh, verifyFacility, rejectFacility } = useGovernment(user?.id);
  const [query, setQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filtered = facilities.filter((f) =>
    !query || f.name.toLowerCase().includes(query.toLowerCase()) || (f.city || "").toLowerCase().includes(query.toLowerCase())
  );

  const handleVerify = useCallback(async (id: string) => {
    setProcessingId(id);
    const result = await verifyFacility(id);
    setProcessingId(null);
    if (!result.success) Alert.alert("Error", result.error || "Failed");
  }, [verifyFacility]);

  const handleReject = useCallback((id: string) => {
    Alert.alert("Reject Facility", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: async () => {
        setProcessingId(id);
        const result = await rejectFacility(id);
        setProcessingId(null);
        if (!result.success) Alert.alert("Error", result.error || "Failed");
      }},
    ]);
  }, [rejectFacility]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={s.headerTitle}>Verify Facilities</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color="#94a3b8" style={s.searchIcon} />
        <TextInput style={s.searchInput} placeholder="Search facilities..." placeholderTextColor="#94a3b8" value={query} onChangeText={setQuery} />
        {query.length > 0 && <TouchableOpacity onPress={() => setQuery("")}><Ionicons name="close-circle" size={18} color="#94a3b8"/></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>} contentContainerStyle={s.scrollContent}>
        {loading && !refreshing ? (
          <View style={s.center}><ActivityIndicator size="large" color="#2563eb"/><Text style={s.loadingText}>Loading...</Text></View>
        ) : error ? (
          <View style={s.center}><Ionicons name="alert-circle" size={48} color="#ef4444"/><Text style={s.errorText}>{error}</Text><TouchableOpacity style={s.retryBtn} onPress={refresh}><Text style={s.retryText}>Retry</Text></TouchableOpacity></View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="business-outline" size={64} color="#cbd5e1"/>
            <Text style={s.emptyTitle}>No Pending Facilities</Text>
            <Text style={s.emptySub}>All facilities have been reviewed.</Text>
          </View>
        ) : filtered.map((f) => (
          <View key={f.id} style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardIconWrap}><FontAwesome5 name="hospital" size={20} color="#2563eb"/></View>
              <View style={s.cardInfo}>
                <Text style={s.cardName}>{f.name}</Text>
                <Text style={s.cardType}>{f.type || "Hospital"} · {f.city || "Unknown"}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: f.status === "pending" ? "#fff7ed" : f.status === "verified" ? "#ecfdf5" : "#fef2f2" }]}>
                <Text style={[s.statusText, { color: f.status === "pending" ? "#ea580c" : f.status === "verified" ? "#059669" : "#ef4444" }]}>{f.status}</Text>
              </View>
            </View>
            <Text style={s.cardAddress}>{f.address || "No address provided"}</Text>
            <View style={s.cardMeta}>
              <Text style={s.cardMetaText}>{f.departments?.length || 0} departments</Text>
              <Text style={s.cardMetaText}>·</Text>
              <Text style={s.cardMetaText}>{f.staff_count || 0} staff</Text>
              <Text style={s.cardMetaText}>·</Text>
              <Text style={s.cardMetaText}>{f.license_number || "No license"}</Text>
            </View>
            {f.status === "pending" && (
              <View style={s.actionsRow}>
                <TouchableOpacity style={s.rejectBtn} onPress={() => handleReject(f.id)} disabled={processingId === f.id}>
                  {processingId === f.id ? <ActivityIndicator size="small" color="#ef4444"/> : <Text style={s.rejectText}>Reject</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.verifyBtn} onPress={() => handleVerify(f.id)} disabled={processingId === f.id}>
                  {processingId === f.id ? <ActivityIndicator size="small" color="#fff"/> : <Text style={s.verifyText}>Verify</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  cardIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  cardType: { fontSize: 12, color: "#64748b", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "600" },
  cardAddress: { fontSize: 13, color: "#64748b", marginBottom: 8 },
  cardMeta: { flexDirection: "row", gap: 8, marginBottom: 12 },
  cardMetaText: { fontSize: 11, color: "#94a3b8" },
  actionsRow: { flexDirection: "row", gap: 10 },
  rejectBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#fef2f2", alignItems: "center", borderWidth: 1, borderColor: "#fecaca" },
  rejectText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },
  verifyBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0f3d5e", alignItems: "center" },
  verifyText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
