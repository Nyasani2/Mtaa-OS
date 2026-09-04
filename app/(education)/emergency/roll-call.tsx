import React, { useState, useEffect } from 'react';

import { Alert, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Alert, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Ionicons } from '@expo/vector-icons';

export default function RollCallScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [students, setStudents] = useState<any[]>([]);
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: staff } = await supabase.from("education_staff").select("institution_id").eq("user_id", user?.id).maybeSingle();
        if (!staff?.institution_id) { setStudents([]); setLoading(false); return; }

        const { data: s } = await supabase
          .from("education_students")
          .select("id, full_name, grade_level, stream")
          .eq("institution_id", staff.institution_id)
          .order("full_name");
        setStudents(s || []);
      } catch (err) {
        console.error("Roll call load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const togglePresent = (studentId: string) => {
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const saveRollCall = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: emergency } = await supabase
        .from("education_emergencies")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!emergency) { Alert.alert("Error", "No active emergency found."); return; }

      const records = students.map((s) => ({
        emergency_id: emergency.id,
        student_id: s.id,
        status: present.has(s.id) ? "present" : "missing",
        marked_by: user.id,
      }));

      const { error } = await supabase.from("education_emergency_roll_calls").insert(records);
      if (error) throw error;

      Alert.alert("Saved", `Roll call saved. ${present.size} present, ${students.length - present.size} missing.`);
      router.back();
    } catch (err: any) {
      Alert.alert("Save Failed", err.message || "Could not save roll call.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800" }}>Roll Call</Text>
        <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{present.size} / {students.length} marked present</Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => togglePresent(item.id)}
            style={{
              backgroundColor: present.has(item.id) ? "#064e3b" : "#1e293b",
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: present.has(item.id) ? "#22c55e" : "#334155",
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: present.has(item.id) ? "#22c55e20" : "#0f172a", justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: present.has(item.id) ? "#22c55e" : "#38bdf8", fontWeight: "700", fontSize: 16 }}>{(item.full_name || "S").charAt(0)}</Text>
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600" }}>{item.full_name}</Text>
              <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{item.grade_level} {item.stream || ""}</Text>
            </View>
            <Ionicons name={present.has(item.id) ? "checkmark-circle" : "ellipse-outline"} size={24} color={present.has(item.id) ? "#22c55e" : "#475569"} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons name="people-outline" size={48} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 12 }}>No students found</Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={saveRollCall}
        disabled={saving}
        style={{ position: "absolute", bottom: 24, left: 16, right: 16, backgroundColor: "#0ea5e9", paddingVertical: 14, borderRadius: 12, alignItems: "center", opacity: saving ? 0.6 : 1 }}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Save Roll Call</Text>}
      </TouchableOpacity>
    </View>
  );
}

