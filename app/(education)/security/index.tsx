import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function SecurityDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [stats, setStats] = useState({ visitors: 0, incidents: 0, checkins: 0 });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const [v, i, c] = await Promise.all([
        supabase.from("education_visitors").select("*").gte("visit_date", today).order("created_at", { ascending: false }).limit(20).then(r => r.data || []),
        supabase.from("education_security_incidents").select("*").order("created_at", { ascending: false }).limit(20).then(r => r.data || []),
        supabase.from("education_qr_checkins").select("*").gte("created_at", today).order("created_at", { ascending: false }).limit(20).then(r => r.data || []),
      ]);
      setVisitors(v); setIncidents(i); setCheckins(c);
      setStats({ visitors: v.length, incidents: i.filter((x) => !x.resolved).length, checkins: c.length });
    } catch (err) { console.error("[Security] load error:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resolveIncident = async (id) => {
    try { await supabase.from("education_security_incidents").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", id); loadData(); }
    catch (err) { Alert.alert("Error", err.message); }
  };

  const signOutVisitor = async (id) => {
    try { await supabase.from("education_visitors").update({ sign_out_time: new Date().toISOString(), status: "completed" }).eq("id", id); loadData(); }
    catch (err) { Alert.alert("Error", err.message); }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 12 }}>Loading security console...</Text>
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
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", flex: 1 }}>Security</Text>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#38bdf8" />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center", borderTopWidth: 3, borderTopColor: "#3b82f6" }}>
            <Text style={{ color: "#3b82f6", fontSize: 20, fontWeight: "800" }}>{stats.visitors}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Visitors</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center", borderTopWidth: 3, borderTopColor: "#ef4444" }}>
            <Text style={{ color: "#ef4444", fontSize: 20, fontWeight: "800" }}>{stats.incidents}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Active Alerts</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center", borderTopWidth: 3, borderTopColor: "#10b981" }}>
            <Text style={{ color: "#10b981", fontSize: 20, fontWeight: "800" }}>{stats.checkins}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Check-ins</Text>
          </View>
        </View>

        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Today's Visitors</Text>
        {visitors.length === 0 ? (
          <Text style={{ color: "#64748b", paddingVertical: 12, marginBottom: 16 }}>No visitors today</Text>
        ) : (
          visitors.map((v) => (
            <View key={v.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{v.full_name?.charAt(0) || "?"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{v.full_name}</Text>
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{v.purpose} &middot; {v.phone}</Text>
              </View>
              {!v.sign_out_time ? (
                <TouchableOpacity onPress={() => signOutVisitor(v.id)} style={{ backgroundColor: "#dc2626", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>Sign Out</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ backgroundColor: "#064e3b", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: "#6ee7b7", fontSize: 11, fontWeight: "600" }}>Out</Text>
                </View>
              )}
            </View>
          ))
        )}

        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Security Incidents</Text>
        {incidents.length === 0 ? (
          <Text style={{ color: "#64748b", paddingVertical: 12 }}>No incidents reported</Text>
        ) : (
          incidents.map((inc) => (
            <View key={inc.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: inc.severity === "critical" ? "#ef4444" : "#f59e0b" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{inc.type}</Text>
                <View style={{ backgroundColor: inc.severity === "critical" ? "#7f1d1d" : "#451a03", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: inc.severity === "critical" ? "#fca5a5" : "#fcd34d", fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>{inc.severity}</Text>
                </View>
              </View>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>{inc.description}</Text>
              {!inc.resolved && (
                <TouchableOpacity onPress={() => resolveIncident(inc.id)} style={{ backgroundColor: "#059669", borderRadius: 8, padding: 10, alignItems: "center" }}>
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
