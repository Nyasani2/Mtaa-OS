import React, { useState, useCallback } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Alert, useRouter } from "expo-router";
import { Alert, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, useAppointments } from "@/lib/health/hooks/useAppointments";
import { Alert, format } from "date-fns";

type TabType = "upcoming" | "past";

function getStatusColor(status: string): string {
  switch (status) {
    case "scheduled": return "#2563eb";
    case "completed": return "#059669";
    case "cancelled": return "#ef4444";
    case "no_show": return "#f59e0b";
    case "in_progress": return "#7c3aed";
    default: return "#64748b";
  }
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { appointments, loading, error, refreshing, refresh, cancelAppointment } = useAppointments(user?.id);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filtered = appointments.filter((a) => {
    const isPast = new Date(a.appointment_date) < new Date();
    return activeTab === "upcoming" ? !isPast : isPast;
  });

  const handleBook = useCallback(() => router.push("/(os)/health/find-care" as any), [router]);

  const handleCancel = useCallback(async (id: string) => {
    Alert.alert("Cancel Appointment", "Are you sure?", [
      { text: "Keep", style: "cancel" },
      { text: "Cancel", style: "destructive", onPress: async () => {
        setCancellingId(id);
        const result = await cancelAppointment(id);
        setCancellingId(null);
        if (!result.success) Alert.alert("Error", result.error || "Failed to cancel");
      }},
    ]);
  }, [cancelAppointment]);

  const handleCardPress = useCallback((apt: any) => {
    router.push({ pathname: "/(os)/health/appointments/detail", params: { id: apt.id } } as any);
  }, [router]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
          <Text style={s.headerTitle}>Appointments</Text>
          <TouchableOpacity onPress={handleBook} style={s.headerAction}><Ionicons name="add" size={24} color="#fff"/></TouchableOpacity>
        </View>
        <View style={s.center}><ActivityIndicator size="large" color="#2563eb"/><Text style={s.loadingText}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
          <Text style={s.headerTitle}>Appointments</Text>
          <TouchableOpacity onPress={handleBook} style={s.headerAction}><Ionicons name="add" size={24} color="#fff"/></TouchableOpacity>
        </View>
        <View style={s.center}>
          <Ionicons name="alert-circle" size={48} color="#ef4444"/>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={refresh}><Text style={s.retryText}>Retry</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={s.headerTitle}>Appointments</Text>
        <TouchableOpacity onPress={handleBook} style={s.headerAction}><Ionicons name="add" size={24} color="#fff"/></TouchableOpacity>
      </View>
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, activeTab === "upcoming" && s.tabActive]} onPress={() => setActiveTab("upcoming")}>
          <Text style={[s.tabText, activeTab === "upcoming" && s.tabTextActive]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === "past" && s.tabActive]} onPress={() => setActiveTab("past")}>
          <Text style={[s.tabText, activeTab === "past" && s.tabTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>} contentContainerStyle={s.scrollContent}>
        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#cbd5e1"/>
            <Text style={s.emptyTitle}>{activeTab === "upcoming" ? "No Upcoming" : "No Past"}</Text>
            <Text style={s.emptySub}>{activeTab === "upcoming" ? "Book your first appointment." : "History appears here."}</Text>
            {activeTab === "upcoming" && (
              <TouchableOpacity style={s.bookBtn} onPress={handleBook}>
                <Ionicons name="add" size={18} color="#fff"/><Text style={s.bookBtnText}>Book</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : filtered.map((apt) => (
          <TouchableOpacity key={apt.id} style={s.card} onPress={() => handleCardPress(apt)} disabled={cancellingId === apt.id}>
            <View style={s.cardHeader}>
              <View style={[s.statusBadge, { backgroundColor: getStatusColor(apt.status) + "20" }]}>
                <View style={[s.statusDot, { backgroundColor: getStatusColor(apt.status) }]}/>
                <Text style={[s.statusText, { color: getStatusColor(apt.status) }]}>{apt.status}</Text>
              </View>
              {apt.status === "scheduled" && (
                <TouchableOpacity onPress={() => handleCancel(apt.id)} disabled={cancellingId === apt.id}>
                  {cancellingId === apt.id ? <ActivityIndicator size="small" color="#ef4444"/> : <Ionicons name="close-circle" size={22} color="#ef4444"/>}
                </TouchableOpacity>
              )}
            </View>
            <Text style={s.doctorName}>{apt.doctor_name || "Doctor"}</Text>
            <Text style={s.hospitalName}>{apt.hospital_name || "Hospital"}</Text>
            <View style={s.cardFooter}>
              <View style={s.footerItem}><Ionicons name="calendar" size={14} color="#64748b"/><Text style={s.footerText}>{format(new Date(apt.appointment_date), "MMM d")}</Text></View>
              <View style={s.footerItem}><Ionicons name="time" size={14} color="#64748b"/><Text style={s.footerText}>{format(new Date(apt.appointment_date), "h:mm a")}</Text></View>
              <View style={s.footerItem}><Ionicons name="location" size={14} color="#64748b"/><Text style={s.footerText}>{apt.department || "General"}</Text></View>
            </View>
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
  tabRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", gap: 8 },
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
  bookBtn: { flexDirection: "row", alignItems: "center", marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#0f3d5e", borderRadius: 12, gap: 8 },
  bookBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  doctorName: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  hospitalName: { fontSize: 13, color: "#64748b", marginTop: 2 },
  cardFooter: { flexDirection: "row", marginTop: 12, gap: 16 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: 12, color: "#64748b" },
});
