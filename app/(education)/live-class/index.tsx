import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function LiveClassScheduleScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [myRole, setMyRole] = useState("student");

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: profile } = await supabase.from("education_profiles").select("role").eq("user_id", user.id).maybeSingle();
      setMyRole(profile?.role || "student");

      const now = new Date().toISOString();
      const { data: sess } = await supabase.from("education_live_sessions")
        .select("*, education_courses(title, subject)")
        .gte("scheduled_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(50);
      setSessions(sess || []);
    } catch (err) { console.error("[LiveClass] load error:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const goLive = async (sessionId) => {
    try {
      await supabase.from("education_live_sessions").update({ status: "live", started_at: new Date().toISOString() }).eq("id", sessionId);
      Alert.alert("Live", "Session is now live");
      loadData();
    } catch (err) { Alert.alert("Error", err.message); }
  };

  const joinLive = (sessionId) => {
    router.push(`/live-class/${sessionId}`);
  };

  const getStatusColor = (s) => {
    switch (s) { case "live": return "#ef4444"; case "scheduled": return "#3b82f6"; case "ended": return "#64748b"; default: return "#94a3b8"; }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 12 }}>Loading schedule...</Text>
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
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", flex: 1 }}>Live Classes</Text>
          {(myRole === "teacher" || myRole === "admin") && (
            <TouchableOpacity onPress={() => router.push("/live-class/create")} style={{ backgroundColor: "#dc2626", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="videocam" size={14} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>GO LIVE</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={{ color: "#94a3b8", fontSize: 13 }}>Upcoming and live sessions</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#38bdf8" />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {sessions.length === 0 ? (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 40, alignItems: "center" }}>
            <Ionicons name="videocam-outline" size={40} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 12, textAlign: "center" }}>No live sessions scheduled</Text>
          </View>
        ) : (
          sessions.map((s) => {
            const isLive = s.status === "live";
            const isTeacher = myRole === "teacher" || myRole === "admin";
            const canStart = isTeacher && s.status === "scheduled";
            const canJoin = s.status === "live" || s.status === "scheduled";
            return (
              <View key={s.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: getStatusColor(s.status) }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "700", flex: 1 }} numberOfLines={1}>{s.title}</Text>
                  <View style={{ backgroundColor: getStatusColor(s.status) + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: getStatusColor(s.status), fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>{s.status}</Text>
                  </View>
                </View>
                <Text style={{ color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>{s.education_courses?.title || "Course"} &middot; {s.education_courses?.subject || ""}</Text>
                <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 12 }}>{new Date(s.scheduled_at).toLocaleString()}</Text>
                {isLive && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" }} />
                    <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "700" }}>LIVE NOW</Text>
                    <Text style={{ color: "#64748b", fontSize: 12 }}>{s.participant_count || 0} watching</Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {canStart && (
                    <TouchableOpacity onPress={() => goLive(s.id)} style={{ flex: 1, backgroundColor: "#dc2626", borderRadius: 10, padding: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}>
                      <Ionicons name="radio" size={16} color="#fff" />
                      <Text style={{ color: "#fff", fontWeight: "700" }}>Start Live</Text>
                    </TouchableOpacity>
                  )}
                  {canJoin && (
                    <TouchableOpacity onPress={() => joinLive(s.id)} style={{ flex: 1, backgroundColor: isLive ? "#dc2626" : "#3b82f6", borderRadius: 10, padding: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}>
                      <Ionicons name={isLive ? "radio" : "enter"} size={16} color="#fff" />
                      <Text style={{ color: "#fff", fontWeight: "700" }}>{isLive ? "Join Live" : "Enter Room"}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
