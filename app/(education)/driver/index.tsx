import React, { useState, useEffect, useCallback } from 'react';

import { Alert, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Alert, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, supabase } from "@/lib/supabase";
import { Ionicons } from '@expo/vector-icons';

interface RouteAssignment {
  id: string;
  route_name: string;
  vehicle_reg: string;
  stops: number;
  student_count: number;
  status: "idle" | "on_trip" | "completed";
}

interface ManifestStudent {
  id: string;
  full_name: string;
  stop_name: string;
  boarded: boolean;
  dropped_off: boolean;
  parent_phone: string | null;
}

export default function DriverDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignment, setAssignment] = useState<RouteAssignment | null>(null);
  const [manifest, setManifest] = useState<ManifestStudent[]>([]);
  const [tripActive, setTripActive] = useState(false);
  const [tripStartTime, setTripStartTime] = useState<string | null>(null);
  const [stats, setStats] = useState({ boarded: 0, remaining: 0, dropped: 0 });

  const loadDriverData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: driver } = await supabase
        .from("education_transport_drivers")
        .select("id, assigned_route_id, assigned_vehicle_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!driver) { setLoading(false); return; }

      const { data: route } = await supabase
        .from("education_transport_routes")
        .select("id, name, stops, vehicle_id, status")
        .eq("id", driver.assigned_route_id)
        .maybeSingle();

      const { data: vehicle } = await supabase
        .from("education_transport_vehicles")
        .select("registration_number")
        .eq("id", driver.assigned_vehicle_id)
        .maybeSingle();

      const { data: routeStudents } = await supabase
        .from("education_transport_assignments")
        .select("student_id, stop_name, status, boarded_at, dropped_at")
        .eq("route_id", driver.assigned_route_id)
        .eq("status", "active");

      const studentIds = (routeStudents || []).map((rs: any) => rs.student_id);
      let students: any[] = [];
      if (studentIds.length > 0) {
        const { data: stu } = await supabase
          .from("education_students")
          .select("id, full_name, guardian_phone")
          .in("id", studentIds);
        students = stu || [];
      }

      const mergedManifest: ManifestStudent[] = (routeStudents || []).map((rs: any) => {
        const s = students.find((x: any) => x.id === rs.student_id);
        return {
          id: rs.student_id,
          full_name: s?.full_name || "Unknown",
          stop_name: rs.stop_name || "Stop",
          boarded: !!rs.boarded_at,
          dropped_off: !!rs.dropped_at,
          parent_phone: s?.guardian_phone || null,
        };
      });

      setManifest(mergedManifest);
      setAssignment({
        id: route?.id || "",
        route_name: route?.name || "Unnamed Route",
        vehicle_reg: vehicle?.registration_number || "Unknown",
        stops: route?.stops || 0,
        student_count: mergedManifest.length,
        status: route?.status || "idle",
      });

      const boarded = mergedManifest.filter((m) => m.boarded).length;
      const dropped = mergedManifest.filter((m) => m.dropped_off).length;
      setStats({ boarded, remaining: mergedManifest.length - boarded, dropped });
    } catch (err: any) {
      console.error("[DriverDashboard] load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { loadDriverData(); }, [loadDriverData]);

  const startTrip = async () => {
    if (!assignment?.id) return;
    try {
      const now = new Date().toISOString();
      await supabase.from("education_transport_trips").insert({
        route_id: assignment.id, driver_id: user?.id, started_at: now, status: "in_progress",
      });
      await supabase.from("education_transport_routes").update({ status: "on_trip" }).eq("id", assignment.id);
      setTripActive(true); setTripStartTime(now);
      setAssignment((prev) => (prev ? { ...prev, status: "on_trip" } : prev));
    } catch (err: any) { Alert.alert("Error", err.message || "Failed to start trip"); }
  };

  const endTrip = async () => {
    if (!assignment?.id) return;
    try {
      const now = new Date().toISOString();
      await supabase.from("education_transport_trips").update({ ended_at: now, status: "completed" })
        .eq("route_id", assignment.id).eq("status", "in_progress");
      await supabase.from("education_transport_routes").update({ status: "idle" }).eq("id", assignment.id);
      setTripActive(false); setTripStartTime(null);
      setAssignment((prev) => (prev ? { ...prev, status: "completed" } : prev));
    } catch (err: any) { Alert.alert("Error", err.message || "Failed to end trip"); }
  };

  const toggleBoarded = async (studentId: string, current: boolean) => {
    try {
      const update: any = { boarded_at: current ? null : new Date().toISOString() };
      await supabase.from("education_transport_assignments").update(update)
        .eq("student_id", studentId).eq("route_id", assignment?.id);
      setManifest((prev) => prev.map((m) => (m.id === studentId ? { ...m, boarded: !current } : m)));
      setStats((prev) => ({ boarded: current ? prev.boarded - 1 : prev.boarded + 1, remaining: current ? prev.remaining + 1 : prev.remaining - 1, dropped: prev.dropped }));
    } catch (err: any) { Alert.alert("Error", err.message); }
  };

  const toggleDropped = async (studentId: string, current: boolean) => {
    try {
      const update: any = { dropped_at: current ? null : new Date().toISOString() };
      await supabase.from("education_transport_assignments").update(update)
        .eq("student_id", studentId).eq("route_id", assignment?.id);
      setManifest((prev) => prev.map((m) => (m.id === studentId ? { ...m, dropped_off: !current } : m)));
      setStats((prev) => ({ boarded: prev.boarded, remaining: prev.remaining, dropped: current ? prev.dropped - 1 : prev.dropped + 1 }));
    } catch (err: any) { Alert.alert("Error", err.message); }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 12 }}>Loading driver profile...</Text>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Ionicons name="bus-outline" size={48} color="#334155" />
        <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "700", marginTop: 16 }}>No Route Assigned</Text>
        <Text style={{ color: "#64748b", marginTop: 8, textAlign: "center" }}>You are not currently assigned to any transport route. Contact your transport admin.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", flex: 1 }}>Driver Dashboard</Text>
          <View style={{ backgroundColor: tripActive ? "#064e3b" : "#1e3a5f", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
            <Text style={{ color: tripActive ? "#6ee7b7" : "#7dd3fc", fontSize: 11, fontWeight: "700" }}>{tripActive ? "ON TRIP" : assignment.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={{ color: "#94a3b8", fontSize: 13 }}>{assignment.route_name} &middot; {assignment.vehicle_reg}</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDriverData(); }} tintColor="#38bdf8" />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center", borderTopWidth: 3, borderTopColor: "#3b82f6" }}>
            <Text style={{ color: "#3b82f6", fontSize: 20, fontWeight: "800" }}>{stats.boarded}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Boarded</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center", borderTopWidth: 3, borderTopColor: "#f59e0b" }}>
            <Text style={{ color: "#f59e0b", fontSize: 20, fontWeight: "800" }}>{stats.remaining}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Remaining</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center", borderTopWidth: 3, borderTopColor: "#10b981" }}>
            <Text style={{ color: "#10b981", fontSize: 20, fontWeight: "800" }}>{stats.dropped}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Dropped</Text>
          </View>
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 12, textTransform: "uppercase" }}>Trip Control</Text>
          {!tripActive ? (
            <TouchableOpacity onPress={startTrip} style={{ backgroundColor: "#059669", borderRadius: 10, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Start Trip</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 }}>
                <Ionicons name="time-outline" size={16} color="#6ee7b7" />
                <Text style={{ color: "#6ee7b7", fontSize: 13 }}>Started: {tripStartTime ? new Date(tripStartTime).toLocaleTimeString() : "Now"}</Text>
              </View>
              <TouchableOpacity onPress={endTrip} style={{ backgroundColor: "#dc2626", borderRadius: 10, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                <Ionicons name="stop" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>End Trip</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Passenger Manifest ({manifest.length})</Text>
        {manifest.length === 0 ? (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 24, alignItems: "center" }}>
            <Ionicons name="people-outline" size={32} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 8 }}>No students assigned to this route</Text>
          </View>
        ) : (
          manifest.map((student) => (
            <View key={student.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", borderLeftWidth: 4, borderLeftColor: student.dropped_off ? "#10b981" : student.boarded ? "#3b82f6" : "#f59e0b" }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{student.full_name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{student.full_name}</Text>
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{student.stop_name}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <TouchableOpacity onPress={() => toggleBoarded(student.id, student.boarded)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: student.boarded ? "#3b82f6" : "#334155", justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="enter-outline" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleDropped(student.id, student.dropped_off)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: student.dropped_off ? "#10b981" : "#334155", justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="exit-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
