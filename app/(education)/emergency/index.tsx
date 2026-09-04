import { Alert, useState } from 'react';

import React, { useEffect, useState } from "react";
import { Alert, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Alert, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Ionicons } from '@expo/vector-icons';

const EMERGENCY_TYPES = [
  { id: "fire", label: "Fire", icon: "flame", color: "#ef4444" },
  { id: "medical", label: "Medical", icon: "medical", color: "#22c55e" },
  { id: "intruder", label: "Intruder", icon: "warning", color: "#f59e0b" },
  { id: "lockdown", label: "Lockdown", icon: "lock-closed", color: "#6366f1" },
  { id: "evacuation", label: "Evacuation", icon: "exit", color: "#0ea5e9" },
  { id: "other", label: "Other", icon: "alert-circle", color: "#6b7280" },
];

export default function EmergencyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [active, setActive] = useState(false);
  const [type, setType] = useState<string | null>(null);
  const [stats, setStats] = useState({ present: 0, missing: 0, injured: 0, buses: 0 });
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [blocked, setBlocked] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);

  const loadEmergencyData = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: activeEmergency } = await supabase
        .from("education_emergencies")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeEmergency) {
        setActive(true);
        setType(activeEmergency.type);
        setStats({
          present: activeEmergency.present_count || 0,
          missing: activeEmergency.missing_count || 0,
          injured: activeEmergency.injured_count || 0,
          buses: activeEmergency.buses_count || 0,
        });

        const [c, r, b, t] = await Promise.all([
          supabase.from("education_emergency_contacts").select("*").eq("institution_id", activeEmergency.institution_id),
          supabase.from("education_safe_routes").select("*").eq("emergency_id", activeEmergency.id),
          supabase.from("education_blocked_areas").select("*").eq("emergency_id", activeEmergency.id),
          supabase.from("education_emergency_timeline").select("*").eq("emergency_id", activeEmergency.id).order("created_at", { ascending: false }),
        ]);
        setContacts(c.data || []);
        setRoutes(r.data || []);
        setBlocked(b.data || []);
        setTimeline(t.data || []);
      }
    } catch (err) {
      console.error("Emergency load error:", err);
    }
  };

  useEffect(() => { loadEmergencyData(); }, [user?.id]);

  const activate = async (emergencyType: string) => {
    if (!user?.id) { Alert.alert("Error", "Not authenticated"); return; }
    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: staff } = await supabase.from("education_staff").select("institution_id").eq("user_id", user.id).maybeSingle();
      const institutionId = staff?.institution_id;
      if (!institutionId) { Alert.alert("Error", "No institution assigned"); return; }

      const { error } = await supabase.from("education_emergencies").insert({
        type: emergencyType,
        status: "active",
        institution_id: institutionId,
        activated_by: user.id,
        present_count: 0,
        missing_count: 0,
        injured_count: 0,
        buses_count: 0,
      });
      if (error) throw error;

      setActive(true);
      setType(emergencyType);
      Alert.alert("Emergency Activated", `${emergencyType.toUpperCase()} emergency has been activated. All staff have been notified.`);
      loadEmergencyData();
    } catch (err: any) {
      Alert.alert("Activation Failed", err.message || "Could not activate emergency");
    } finally {
      setLoading(false);
    }
  };

  const deactivate = async () => {
    if (!active) return;
    Alert.alert("Deactivate Emergency?", "Confirm the situation is resolved.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resolve",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            const { supabase } = await import("@/lib/supabase");
            const { data: activeEmergency } = await supabase
              .from("education_emergencies")
              .select("id")
              .eq("status", "active")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (activeEmergency) {
              await supabase.from("education_emergencies").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", activeEmergency.id);
            }
            setActive(false);
            setType(null);
            setStats({ present: 0, missing: 0, injured: 0, buses: 0 });
            setContacts([]);
            setRoutes([]);
            setBlocked([]);
            setTimeline([]);
          } catch (err: any) {
            Alert.alert("Error", err.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (!active) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }} contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800", marginBottom: 8 }}>Emergency Console</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Select emergency type to activate</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {EMERGENCY_TYPES.map((et) => (
            <TouchableOpacity
              key={et.id}
              onPress={() => activate(et.id)}
              disabled={loading}
              style={{ width: "47%", backgroundColor: "#1e293b", borderRadius: 14, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#334155" }}
            >
              <Ionicons name={et.icon as any} size={32} color={et.color} />
              <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600", marginTop: 10 }}>{et.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }} contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 40 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <View>
          <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>ACTIVE EMERGENCY</Text>
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", marginTop: 4 }}>{type?.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={deactivate} disabled={loading} style={{ backgroundColor: "#dc2626", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>RESOLVE</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
        <StatBox label="Present" value={stats.present} color="#22c55e" />
        <StatBox label="Missing" value={stats.missing} color="#f59e0b" />
        <StatBox label="Injured" value={stats.injured} color="#ef4444" />
        <StatBox label="Buses" value={stats.buses} color="#0ea5e9" />
      </View>

      <TouchableOpacity onPress={() => router.push("/(education as any)/emergency/roll-call" as any)} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#334155" }}>
        <Ionicons name="people" size={22} color="#38bdf8" />
        <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600", marginLeft: 12, flex: 1 }}>Roll Call</Text>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      {routes.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 10 }}>Safe Routes</Text>
          {routes.map((r) => (
            <View key={r.id} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="navigate" size={18} color="#22c55e" />
              <Text style={{ color: "#f8fafc", marginLeft: 10, flex: 1 }}>{r.name}</Text>
              <Text style={{ color: "#64748b", fontSize: 12 }}>{r.capacity || 0} people</Text>
            </View>
          ))}
        </View>
      )}

      {blocked.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 10 }}>Blocked Areas</Text>
          {blocked.map((b) => (
            <View key={b.id} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="close-circle" size={18} color="#ef4444" />
              <Text style={{ color: "#f8fafc", marginLeft: 10 }}>{b.name}</Text>
            </View>
          ))}
        </View>
      )}

      {contacts.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 10 }}>Emergency Contacts</Text>
          {contacts.map((c) => (
            <View key={c.id} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <Text style={{ color: "#f8fafc", fontWeight: "600" }}>{c.name}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{c.role} &bull; {c.phone}</Text>
            </View>
          ))}
        </View>
      )}

      {timeline.length > 0 && (
        <View>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 10 }}>Timeline</Text>
          {timeline.map((t) => (
            <View key={t.id} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: t.severity === "critical" ? "#ef4444" : t.severity === "warning" ? "#f59e0b" : "#0ea5e9" }}>
              <Text style={{ color: "#f8fafc", fontWeight: "600" }}>{t.title}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{t.description}</Text>
              <Text style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>{new Date(t.created_at).toLocaleTimeString()}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 10, padding: 12, alignItems: "center", borderTopWidth: 3, borderTopColor: color }}>
      <Text style={{ color, fontSize: 20, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

