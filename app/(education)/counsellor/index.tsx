import { Alert, useState } from 'react';
// @ts-nocheck
import React, { useEffect, useState, useCallback } from "react";
import { Alert, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { Alert, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, supabase } from "@/lib/supabase";
import { Ionicons } from '@expo/vector-icons';

export default function CounsellorDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: appts } = await supabase.from("education_counselling_appointments")
        .select("*, education_students(full_name, grade_level)")
        .eq("counsellor_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(20);
      setAppointments(appts || []);

      const { data: cas } = await supabase.from("education_counselling_cases")
        .select("*, education_students(full_name)")
        .eq("counsellor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setCases(cas || []);

      const pending = (cas || []).filter((c) => c.status === "open").length;
      const resolved = (cas || []).filter((c) => c.status === "resolved").length;
      setStats({ total: cas?.length || 0, pending, resolved });
    } catch (err) { console.error("[Counsellor] load error:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateCaseStatus = async (caseId, status) => {
    try {
      await supabase.from("education_counselling_cases").update({ status, updated_at: new Date().toISOString() }).eq("id", caseId);
      loadData();
    } catch (err) { Alert.alert("Error", err.message); }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 12 }}>Loading counsellor workspace...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", flex: 1 }}>Counsellor</Text>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#38bdf8" />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center", borderTopWidth: 3, borderTopColor: "#3b82f6" }}>
            <Text style={{ color: "#3b82f6", fontSize: 20, fontWeight: "800" }}>{stats.total}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Cases</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center", borderTopWidth: 3, borderTopColor: "#f59e0b" }}>
            <Text style={{ color: "#f59e0b", fontSize: 20, fontWeight: "800" }}>{stats.pending}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Open</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center", borderTopWidth: 3, borderTopColor: "#10b981" }}>
            <Text style={{ color: "#10b981", fontSize: 20, fontWeight: "800" }}>{stats.resolved}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Resolved</Text>
          </View>
        </View>

        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Upcoming Appointments</Text>
        {appointments.length === 0 ? (
          <Text style={{ color: "#64748b", paddingVertical: 12, marginBottom: 16 }}>No upcoming appointments</Text>
        ) : (
          appointments.map((a) => (
            <View key={a.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{a.education_students?.full_name?.charAt(0) || "?"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{a.education_students?.full_name || "Student"}</Text>
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{new Date(a.scheduled_at).toLocaleString()}</Text>
              </View>
              <View style={{ backgroundColor: a.status === "confirmed" ? "#064e3b" : "#451a03", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ color: a.status === "confirmed" ? "#6ee7b7" : "#fcd34d", fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>{a.status}</Text>
              </View>
            </View>
          ))
        )}

        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Cases</Text>
        {cases.length === 0 ? (
          <Text style={{ color: "#64748b", paddingVertical: 12 }}>No counselling cases</Text>
        ) : (
          cases.map((c) => (
            <View key={c.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: c.status === "open" ? "#f59e0b" : "#10b981" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{c.education_students?.full_name || "Student"}</Text>
                <View style={{ backgroundColor: c.status === "open" ? "#451a03" : "#064e3b", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: c.status === "open" ? "#fcd34d" : "#6ee7b7", fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>{c.status}</Text>
                </View>
              </View>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginBottom: 10 }}>{c.description}</Text>
              {c.status === "open" && (
                <TouchableOpacity onPress={() => updateCaseStatus(c.id, "resolved")} style={{ backgroundColor: "#059669", borderRadius: 8, padding: 10, alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Mark Resolved</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
