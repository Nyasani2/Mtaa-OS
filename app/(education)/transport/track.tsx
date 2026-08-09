import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function TransportTrackScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState([]);
  const [trips, setTrips] = useState([]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // Get children linked to this parent
      const { data: links } = await supabase.from("education_parent_students")
        .select("student_id, education_students(id, full_name, grade_level, assigned_route_id)")
        .eq("parent_id", user.id);

      const kids = (links || []).map((l: any) => ({
        id: l.student_id,
        full_name: l.education_students?.full_name || "Unknown",
        grade: l.education_students?.grade_level,
        route_id: l.education_students?.assigned_route_id,
      }));
      setChildren(kids);

      // Get active trips for their routes
      const routeIds = kids.map((k) => k.route_id).filter(Boolean);
      if (routeIds.length > 0) {
        const { data: t } = await supabase.from("education_transport_trips")
          .select("*, education_transport_routes(name)")
          .in("route_id", routeIds)
          .eq("status", "in_progress")
          .order("started_at", { ascending: false });
        setTrips(t || []);
      }
    } catch (err) { console.error("[TransportTrack] load error:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 12 }}>Loading transport data...</Text>
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
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", flex: 1 }}>Track My Child</Text>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#38bdf8" />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Children */}
        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>My Children</Text>
        {children.length === 0 ? (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="people-outline" size={32} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 8 }}>No children linked to your account</Text>
          </View>
        ) : (
          children.map((child) => (
            <View key={child.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>{child.full_name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600" }}>{child.full_name}</Text>
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>Grade {child.grade || "N/A"}</Text>
              </View>
              <View style={{ backgroundColor: child.route_id ? "#064e3b" : "#451a03", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: child.route_id ? "#6ee7b7" : "#fcd34d", fontSize: 11, fontWeight: "600" }}>{child.route_id ? "On Route" : "No Route"}</Text>
              </View>
            </View>
          ))
        )}

        {/* Active Trips */}
        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, marginTop: 8, textTransform: "uppercase" }}>Active Trips</Text>
        {trips.length === 0 ? (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 24, alignItems: "center" }}>
            <Ionicons name="bus-outline" size={32} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 8 }}>No buses currently on trip</Text>
          </View>
        ) : (
          trips.map((trip) => (
            <View key={trip.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#ef4444" }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444" }} />
                <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "700" }}>LIVE TRIP</Text>
              </View>
              <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600" }}>{trip.education_transport_routes?.name || "Route"}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Started: {new Date(trip.started_at).toLocaleTimeString()}</Text>
              <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="speedometer-outline" size={14} color="#64748b" />
                  <Text style={{ color: "#64748b", fontSize: 12 }}>{trip.speed_kmh || 0} km/h</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="location-outline" size={14} color="#64748b" />
                  <Text style={{ color: "#64748b", fontSize: 12 }}>{trip.current_stop || "En route"}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
