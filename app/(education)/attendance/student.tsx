import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { Ionicons } from "@expo/vector-icons";

const STATUS_COLORS: Record<string, string> = {
  present: "#22c55e",
  absent: "#ef4444",
  late: "#f59e0b",
  excused: "#0ea5e9",
};

export default function StudentAttendanceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "present" | "absent" | "late" | "excused">("all");

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data, error } = await supabase
          .from("education_attendance")
          .select("*, class:class_id(name, subject:subject_id(name))")
          .eq("student_id", user.id)
          .order("date", { ascending: false })
          .limit(100);
        if (error) throw error;

        const list = data || [];
        setRecords(list);
        setStats({
          present: list.filter((r) => r.status === "present").length,
          absent: list.filter((r) => r.status === "absent").length,
          late: list.filter((r) => r.status === "late").length,
          excused: list.filter((r) => r.status === "excused").length,
          total: list.length,
        });
      } catch (err) {
        console.error("Attendance load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const filtered = filter === "all" ? records : records.filter((r) => r.status === filter);

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
        <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800" }}>My Attendance</Text>
        <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{stats.total} records</Text>
      </View>

      <View style={{ flexDirection: "row", padding: 16, gap: 8 }}>
        {(["all", "present", "absent", "late", "excused"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: filter === f ? "#0ea5e9" : "#1e293b",
              borderWidth: 1,
              borderColor: filter === f ? "#0ea5e9" : "#334155",
            }}
          >
            <Text style={{ color: filter === f ? "#fff" : "#94a3b8", fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>
              {f} {f !== "all" ? `(${stats[f]})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: (STATUS_COLORS[item.status] || "#6b7280") + "20", justifyContent: "center", alignItems: "center" }}>
              <Ionicons
                name={item.status === "present" ? "checkmark" : item.status === "absent" ? "close" : item.status === "late" ? "time" : "help-circle"}
                size={18}
                color={STATUS_COLORS[item.status] || "#6b7280"}
              />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{item.class?.name || "Class"}</Text>
              <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                {item.class?.subject?.name || "Subject"} &bull; {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={{ backgroundColor: (STATUS_COLORS[item.status] || "#6b7280") + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: STATUS_COLORS[item.status] || "#6b7280", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>{item.status}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons name="calendar-outline" size={48} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 12 }}>No attendance records</Text>
          </View>
        }
      />
    </View>
  );
}
