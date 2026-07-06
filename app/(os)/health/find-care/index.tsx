import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, TextInput, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { useFindCare } from "@/lib/health/hooks/useFindCare";

export default function FindCareScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { facilities, doctors, loading, error, refreshing, refresh, searchFacilities, searchDoctors } = useFindCare();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"facilities" | "doctors">("facilities");
  const [bookingDoctor, setBookingDoctor] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 2) {
        if (activeTab === "facilities") searchFacilities(query);
        else searchDoctors(query);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, activeTab, searchFacilities, searchDoctors]);

  const handleFacilityPress = useCallback((facility: any) => {
    router.push({ pathname: "/(os)/health/find-care/facility", params: { id: facility.id } } as any);
  }, [router]);

  const handleDoctorPress = useCallback((doctor: any) => {
    router.push({ pathname: "/(os)/health/find-care/doctor", params: { id: doctor.id } } as any);
  }, [router]);

  const handleBookDoctor = useCallback((doctorId: string) => {
    setBookingDoctor(doctorId);
    router.push({ pathname: "/(os)/health/appointments/book", params: { doctorId } } as any);
    setBookingDoctor(null);
  }, [router]);

  const data = activeTab === "facilities" ? facilities : doctors;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={s.headerTitle}>Find Care</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color="#94a3b8" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder={activeTab === "facilities" ? "Search hospitals, clinics..." : "Search doctors, specialists..."}
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}><Ionicons name="close-circle" size={18} color="#94a3b8"/></TouchableOpacity>
        )}
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, activeTab === "facilities" && s.tabActive]} onPress={() => setActiveTab("facilities")}>
          <Text style={[s.tabText, activeTab === "facilities" && s.tabTextActive]}>Hospitals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === "doctors" && s.tabActive]} onPress={() => setActiveTab("doctors")}>
          <Text style={[s.tabText, activeTab === "doctors" && s.tabTextActive]}>Doctors</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>} contentContainerStyle={s.scrollContent}>
        {loading && !refreshing ? (
          <View style={s.center}><ActivityIndicator size="large" color="#2563eb"/><Text style={s.loadingText}>Searching...</Text></View>
        ) : error ? (
          <View style={s.center}>
            <Ionicons name="alert-circle" size={48} color="#ef4444"/>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={refresh}><Text style={s.retryText}>Retry</Text></TouchableOpacity>
          </View>
        ) : data.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name={activeTab === "facilities" ? "business-outline" : "people-outline"} size={64} color="#cbd5e1"/>
            <Text style={s.emptyTitle}>{query ? "No results" : "No " + activeTab}</Text>
            <Text style={s.emptySub}>{query ? "Try a different search term." : "Pull down to refresh."}</Text>
          </View>
        ) : activeTab === "facilities" ? data.map((f) => (
          <TouchableOpacity key={f.id} style={s.facilityCard} onPress={() => handleFacilityPress(f)}>
            <View style={s.facilityIconWrap}><Ionicons name="business" size={28} color="#2563eb"/></View>
            <View style={s.facilityInfo}>
              <Text style={s.facilityName}>{f.name}</Text>
              <Text style={s.facilityType}>{f.type || "Hospital"} · {f.city || "Unknown"}</Text>
              <View style={s.facilityMeta}>
                <Text style={s.facilityMetaText}>{f.departments?.length || 0} departments</Text>
                <Text style={s.facilityMetaText}>·</Text>
                <Text style={s.facilityMetaText}>{f.insurance_accepted?.length || 0} insurance</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8"/>
          </TouchableOpacity>
        )) : data.map((d) => (
          <TouchableOpacity key={d.id} style={s.doctorCard} onPress={() => handleDoctorPress(d)}>
            <View style={s.doctorAvatar}><Text style={s.doctorAvatarText}>{(d.name || "D").charAt(0)}</Text></View>
            <View style={s.doctorInfo}>
              <Text style={s.doctorName}>{d.name || "Doctor"}</Text>
              <Text style={s.doctorSpec}>{d.specialization || "General Practitioner"}</Text>
              <Text style={s.doctorHospital}>{d.hospital_name || "Independent"}</Text>
              <View style={s.doctorMeta}>
                <Text style={s.doctorMetaText}>{d.experience_years || 0} yrs exp</Text>
                <Text style={s.doctorMetaText}>·</Text>
                <Text style={s.doctorMetaText}>⭐ {d.rating || "N/A"}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.bookBtnSmall}
              onPress={() => handleBookDoctor(d.id)}
              disabled={bookingDoctor === d.id}
            >
              {bookingDoctor === d.id ? <ActivityIndicator size="small" color="#fff"/> : <Text style={s.bookBtnText}>Book</Text>}
            </TouchableOpacity>
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", flex: 1, textAlign: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", margin: 16, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#1e293b" },
  tabRow: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: "#f1f5f9" },
  tabActive: { backgroundColor: "#0f3d5e" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#fff" },
  scrollContent: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { marginTop: 12, fontSize: 15, color: "#64748b" },
  errorText: { marginTop: 12, fontSize: 15, color: "#ef4444", textAlign: "center" },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "#0f3d5e", borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginTop: 16 },
  emptySub: { fontSize: 14, color: "#94a3b8", marginTop: 4, textAlign: "center" },
  facilityCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  facilityIconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center", marginRight: 12 },
  facilityInfo: { flex: 1 },
  facilityName: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  facilityType: { fontSize: 12, color: "#64748b", marginTop: 2 },
  facilityMeta: { flexDirection: "row", gap: 8, marginTop: 6 },
  facilityMetaText: { fontSize: 11, color: "#94a3b8" },
  doctorCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  doctorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#0f3d5e", justifyContent: "center", alignItems: "center", marginRight: 12 },
  doctorAvatarText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  doctorSpec: { fontSize: 12, color: "#64748b", marginTop: 2 },
  doctorHospital: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  doctorMeta: { flexDirection: "row", gap: 8, marginTop: 6 },
  doctorMetaText: { fontSize: 11, color: "#94a3b8" },
  bookBtnSmall: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#0f3d5e", borderRadius: 8 },
  bookBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },
});
