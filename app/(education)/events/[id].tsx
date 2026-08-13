
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import EducationService from "@/lib/services/education-service";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const eventId = typeof id === "string" ? id : "";
  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: ev, error: ee } = await supabase.from("education_events").select("*").eq("id", eventId).maybeSingle();
        if (ee) throw ee;
        setEvent(ev);
        const { data: parts } = await supabase.from("education_event_participants").select("*, student:student_id(full_name)").eq("event_id", eventId);
        setParticipants(parts || []);
      } catch (err: any) {
        setError(err.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  if (loading) return <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#38bdf8" /></View>;
  if (error || !event) return (
    <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
      <Text style={{ color: "#f87171", marginTop: 12, fontSize: 16 }}>{error || "Event not found"}</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, backgroundColor: "#1e293b", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
        <Text style={{ color: "#38bdf8", fontWeight: "600" }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const statusColor = event.status === 'upcoming' ? '#0ea5e9' : event.status === 'ongoing' ? '#22c55e' : '#6b7280';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>{event.title}</Text>
        <View style={{ flexDirection: "row", marginTop: 6, alignItems: "center" }}>
          <View style={{ backgroundColor: statusColor + "20", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ color: statusColor, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>{event.status}</Text>
          </View>
          <Text style={{ color: "#64748b", fontSize: 13, marginLeft: 10 }}>{event.event_type || "Event"}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 10 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 8 }}>Details</Text>
          <Text style={{ color: "#f8fafc", fontSize: 14, lineHeight: 20 }}>{event.description || "No description provided."}</Text>
          {event.start_date && (
            <Text style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
              <Ionicons name="calendar-outline" size={13} color="#64748b" /> {new Date(event.start_date).toLocaleString()} {event.end_date ? ` - ${new Date(event.end_date).toLocaleString()}` : ""}
            </Text>
          )}
          {event.location && (
            <Text style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
              <Ionicons name="location-outline" size={13} color="#64748b" /> {event.location}
            </Text>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>Participants ({participants.length})</Text>
          <TouchableOpacity onPress={() => router.push("/(education as any)/participants/create" as any)} style={{ backgroundColor: "#0ea5e9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Add</Text>
          </TouchableOpacity>
        </View>
        {participants.length === 0 ? (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 24, alignItems: "center" }}>
            <Ionicons name="people-outline" size={32} color="#475569" />
            <Text style={{ color: "#64748b", marginTop: 8, fontSize: 13 }}>No participants yet</Text>
          </View>
        ) : (
          participants.map((p) => (
            <View key={p.id} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "#38bdf8", fontWeight: "700" }}>{(p.student?.full_name || "P").charAt(0)}</Text>
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{p.student?.full_name || "Participant"}</Text>
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{p.role || "Attendee"} &bull; {p.status || "Registered"}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

