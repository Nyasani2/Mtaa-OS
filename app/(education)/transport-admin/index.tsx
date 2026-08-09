import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

interface Vehicle { id: string; registration_number: string; capacity: number; status: string; type: string; }
interface Driver { id: string; full_name: string; license_number: string; phone: string; assigned_route_id: string | null; status: string; }
interface Route { id: string; name: string; stops: number; student_count: number; status: string; vehicle_id: string | null; }
interface Incident { id: string; type: string; description: string; severity: string; reported_at: string; resolved: boolean; }

export default function TransportAdminScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("fleet");
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "", description: "", severity: "medium" });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [v, d, r, i] = await Promise.all([
        supabase.from("education_transport_vehicles").select("*").order("created_at", { ascending: false }).limit(50).then(res => res.data || []),
        supabase.from("education_transport_drivers").select("*").order("created_at", { ascending: false }).limit(50).then(res => res.data || []),
        supabase.from("education_transport_routes").select("*").order("created_at", { ascending: false }).limit(50).then(res => res.data || []),
        supabase.from("education_transport_incidents").select("*").order("reported_at", { ascending: false }).limit(50).then(res => res.data || []),
      ]);
      setVehicles(v); setDrivers(d); setRoutes(r); setIncidents(i);
    } catch (err) { console.error("[TransportAdmin] load error:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const reportIncident = async () => {
    if (!form.type.trim() || !form.description.trim()) { Alert.alert("Missing", "Type and description required"); return; }
    try {
      const { error } = await supabase.from("education_transport_incidents").insert({
        reporter_id: user?.id, type: form.type.trim(), description: form.description.trim(),
        severity: form.severity, reported_at: new Date().toISOString(), resolved: false,
      });
      if (error) throw error;
      Alert.alert("Reported", "Incident logged");
      setShowForm(false); setForm({ type: "", description: "", severity: "medium" }); loadData();
    } catch (err) { Alert.alert("Error", err.message || "Failed"); }
  };

  const resolveIncident = async (id) => {
    try {
      await supabase.from("education_transport_incidents").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", id);
      loadData();
    } catch (err) { Alert.alert("Error", err.message); }
  };

  const sevColor = (s) => { switch(s){ case "critical": return "#ef4444"; case "high": return "#f97316"; case "medium": return "#f59e0b"; default: return "#3b82f6"; } };
  const vehColor = (s) => { switch(s){ case "active": return "#10b981"; case "maintenance": return "#f59e0b"; default: return "#64748b"; } };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 12 }}>Loading transport command...</Text>
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
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", flex: 1 }}>Transport Command</Text>
        </View>
        <Text style={{ color: "#94a3b8", fontSize: 13 }}>Fleet &middot; Routes &middot; Incidents</Text>
      </View>

      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        {["fleet","routes","incidents"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: activeTab === tab ? "#3b82f6" : "#1e293b", alignItems: "center" }}>
            <Text style={{ color: activeTab === tab ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600", textTransform: "capitalize" }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#38bdf8" />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

        {activeTab === "fleet" && (
          <View>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center" }}>
                <Text style={{ color: "#3b82f6", fontSize: 20, fontWeight: "800" }}>{vehicles.length}</Text>
                <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Vehicles</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center" }}>
                <Text style={{ color: "#10b981", fontSize: 20, fontWeight: "800" }}>{drivers.length}</Text>
                <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Drivers</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center" }}>
                <Text style={{ color: "#f59e0b", fontSize: 20, fontWeight: "800" }}>{routes.length}</Text>
                <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Routes</Text>
              </View>
            </View>

            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Vehicles</Text>
            {vehicles.length === 0 ? (
              <Text style={{ color: "#64748b", textAlign: "center", paddingVertical: 24 }}>No vehicles registered</Text>
            ) : (
              vehicles.map((v) => (
                <View key={v.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: vehColor(v.status) + "20", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                    <Ionicons name="bus-outline" size={22} color={vehColor(v.status)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600" }}>{v.registration_number}</Text>
                    <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{v.type} &middot; Capacity: {v.capacity}</Text>
                  </View>
                  <View style={{ backgroundColor: vehColor(v.status) + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: vehColor(v.status), fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>{v.status}</Text>
                  </View>
                </View>
              ))
            )}

            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, marginTop: 8, textTransform: "uppercase" }}>Drivers</Text>
            {drivers.length === 0 ? (
              <Text style={{ color: "#64748b", textAlign: "center", paddingVertical: 24 }}>No drivers registered</Text>
            ) : (
              drivers.map((d) => (
                <View key={d.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>{d.full_name?.charAt(0) || "?"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{d.full_name}</Text>
                    <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{d.phone || "No phone"}</Text>
                  </View>
                  <View style={{ backgroundColor: d.assigned_route_id ? "#064e3b" : "#451a03", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: d.assigned_route_id ? "#6ee7b7" : "#fcd34d", fontSize: 11, fontWeight: "600" }}>{d.assigned_route_id ? "Assigned" : "Unassigned"}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "routes" && (
          <View>
            {routes.length === 0 ? (
              <Text style={{ color: "#64748b", textAlign: "center", paddingVertical: 24 }}>No routes configured</Text>
            ) : (
              routes.map((r) => (
                <View key={r.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600" }}>{r.name}</Text>
                    <View style={{ backgroundColor: r.status === "on_trip" ? "#064e3b" : "#1e3a5f", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ color: r.status === "on_trip" ? "#6ee7b7" : "#7dd3fc", fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>{r.status}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="location-outline" size={14} color="#64748b" />
                      <Text style={{ color: "#64748b", fontSize: 12 }}>{r.stops} stops</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="people-outline" size={14} color="#64748b" />
                      <Text style={{ color: "#64748b", fontSize: 12 }}>{r.student_count || 0} students</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "incidents" && (
          <View>
            <TouchableOpacity onPress={() => setShowForm(!showForm)} style={{ backgroundColor: "#dc2626", borderRadius: 10, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Report Incident</Text>
            </TouchableOpacity>

            {showForm && (
              <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Incident Type</Text>
                <TextInput value={form.type} onChangeText={(t) => setForm(p => ({ ...p, type: t }))} placeholder="e.g. Breakdown, Accident" placeholderTextColor="#475569" style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 14, borderWidth: 1, borderColor: "#334155", marginBottom: 10 }} />
                <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Description</Text>
                <TextInput value={form.description} onChangeText={(t) => setForm(p => ({ ...p, description: t }))} placeholder="Describe what happened..." placeholderTextColor="#475569" multiline numberOfLines={3} style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 14, borderWidth: 1, borderColor: "#334155", marginBottom: 10, textAlignVertical: "top" }} />
                <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Severity</Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                  {["low","medium","high","critical"].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setForm(p => ({ ...p, severity: s }))} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: form.severity === s ? sevColor(s) : "#0f172a", alignItems: "center", borderWidth: 1, borderColor: form.severity === s ? sevColor(s) : "#334155" }}>
                      <Text style={{ color: form.severity === s ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={reportIncident} style={{ backgroundColor: "#ef4444", borderRadius: 10, padding: 12, alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Submit Report</Text>
                </TouchableOpacity>
              </View>
            )}

            {incidents.length === 0 ? (
              <Text style={{ color: "#64748b", textAlign: "center", paddingVertical: 24 }}>No incidents reported</Text>
            ) : (
              incidents.map((inc) => (
                <View key={inc.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: sevColor(inc.severity) }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{inc.type}</Text>
                    <View style={{ backgroundColor: sevColor(inc.severity) + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ color: sevColor(inc.severity), fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>{inc.severity}</Text>
                    </View>
                  </View>
                  <Text style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>{inc.description}</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: "#64748b", fontSize: 11 }}>{new Date(inc.reported_at).toLocaleString()}</Text>
                    {!inc.resolved ? (
                      <TouchableOpacity onPress={() => resolveIncident(inc.id)} style={{ backgroundColor: "#059669", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>Resolve</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ backgroundColor: "#064e3b", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: "#6ee7b7", fontSize: 11, fontWeight: "600" }}>Resolved</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
