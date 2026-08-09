import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function StudentQRDisplayScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [student, setStudent] = useState(null);
  const [qrValue, setQrValue] = useState("");
  const [history, setHistory] = useState([]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: stu } = await supabase
        .from("education_students")
        .select("id, full_name, admission_number, institution_id, grade_level, class_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (stu) {
        setStudent(stu);
        const payload = JSON.stringify({
          type: "education_student", student_id: stu.id, institution_id: stu.institution_id,
          admission_number: stu.admission_number, timestamp: new Date().toISOString().split("T")[0],
        });
        setQrValue(payload);
      }

      const { data: hist } = await supabase
        .from("education_qr_checkins")
        .select("id, checkin_type, qr_code, verified_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setHistory(hist || []);
    } catch (err) { console.error("[StudentQRDisplay] load error:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const regenerateQR = () => {
    if (!student) return;
    const newPayload = JSON.stringify({
      type: "education_student", student_id: student.id, institution_id: student.institution_id,
      admission_number: student.admission_number, timestamp: new Date().toISOString(),
    });
    setQrValue(newPayload);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 12 }}>Loading your QR identity...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Ionicons name="qr-code-outline" size={48} color="#334155" />
        <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "700", marginTop: 16 }}>Not Enrolled</Text>
        <Text style={{ color: "#64748b", marginTop: 8, textAlign: "center" }}>You are not registered as a student in any institution.</Text>
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
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", flex: 1 }}>My QR Identity</Text>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#38bdf8" />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Student Card */}
        <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#334155" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center", marginRight: 14 }}>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{student.full_name?.charAt(0) || "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "700" }}>{student.full_name}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{student.admission_number}</Text>
              <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>Grade {student.grade_level}</Text>
            </View>
          </View>

          {/* QR Display Area */}
          <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 16 }}>
            <View style={{ width: 200, height: 200, backgroundColor: "#f1f5f9", borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="qr-code" size={120} color="#0f172a" />
            </View>
            <Text style={{ color: "#0f172a", fontSize: 12, fontWeight: "600", textAlign: "center" }}>Show this code for attendance, transport, and library access</Text>
          </View>

          <TouchableOpacity onPress={regenerateQR} style={{ backgroundColor: "#3b82f6", borderRadius: 10, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Regenerate Code</Text>
          </TouchableOpacity>
        </View>

        {/* Usage History */}
        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Recent Scans</Text>
        {history.length === 0 ? (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 24, alignItems: "center" }}>
            <Ionicons name="scan-outline" size={32} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 8 }}>No QR scans yet</Text>
          </View>
        ) : (
          history.map((h) => (
            <View key={h.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: h.verified_at ? "#064e3b" : "#451a03", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                <Ionicons name={h.verified_at ? "checkmark" : "time-outline"} size={18} color={h.verified_at ? "#6ee7b7" : "#fcd34d"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{h.checkin_type || "Check-in"}</Text>
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{new Date(h.created_at).toLocaleString()}</Text>
              </View>
              {h.verified_at && (
                <View style={{ backgroundColor: "#064e3b", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: "#6ee7b7", fontSize: 11, fontWeight: "600" }}>Verified</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
