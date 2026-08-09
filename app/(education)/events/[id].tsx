import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from "@expo/vector-icons";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const eventId = typeof id === "string" ? id : "";
  const [event, setEvent] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: e, error: ee } = await supabase.from("education_events").select("*").eq("id", eventId).single();
        if (ee) throw ee;
        setEvent(e);

        const [s, p] = await Promise.all([
          e?.institution_id ? EducationService.getInstitutionById(e.institution_id) : Promise.resolve(null),
          EducationService.getParticipants(eventId),
        ]);
        setSchool(s);
        setParticipants(p.slice(0, 10));
      } catch (err: any) {
        setError(err.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ color: "#f87171", marginTop: 12, fontSize: 16 }}>{error || "Event not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, backgroundColor: "#1e293b", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
          <Text style={{ color: "#38bdf8", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const start = event.start_date ? new Date(event.start_date) : null;
  const end = event.end_date ? new Date(event.end_date) : null;
  const isUpcoming = start && start > new Date();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <View style={{ backgroundColor: isUpcoming ? "#064e3b" : "#451a03", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginRight: 10 }}>
            <Text style={{ color: isUpcoming ? "#6ee7b7" : "#fcd34d", fontSize: 11, fontWeight: "700" }}>{isUpcoming ? "UPCOMING" : "PAST"}</Text>
          </View>
          <View style={{ backgroundColor: "#0f172a", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ color: "#38bdf8", fontSize: 11, fontWeight: "600" }}>{event.event_type || "Event"}</Text>
          </View>
        </View>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>{event.title}</Text>
      </View>

      {/* Date & Location */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16 }}>
          {start && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="calendar-outline" size={18} color="#64748b" />
              <Text style={{ color: "#94a3b8", fontSize: 14, marginLeft: 10 }}>
                {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {end ? ` - ${end.toLocaleDateString()} ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
              </Text>
            </View>
          )}
          {event.location && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="location-outline" size={18} color="#64748b" />
              <Text style={{ color: "#94a3b8", fontSize: 14, marginLeft: 10 }}>{event.location}</Text>
            </View>
          )}
        </View>
      </View>

      {/* School */}
      {school && (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.push(`/school/${school.id}`)}
            style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center" }}
          >
            <Ionicons name="school" size={20} color="#0ea5e9" />
            <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600", marginLeft: 10, flex: 1 }}>{school.name}</Text>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      )}

      {/* Description */}
      {event.description && (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>About</Text>
            <Text style={{ color: "#e2e8f0", fontSize: 15, lineHeight: 22 }}>{event.description}</Text>
          </View>
        </View>
      )}

      {/* Participants */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>Participants</Text>
          <TouchableOpacity onPress={() => router.push("/participants")}>
            <Text style={{ color: "#38bdf8", fontSize: 12, fontWeight: "600" }}>View All</Text>
          </TouchableOpacity>
        </View>
        {participants.length > 0 ? (
          participants.map((p) => (
            <View key={p.id} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p.attended ? "#064e3b" : "#0f172a", justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="person" size={16} color={p.attended ? "#6ee7b7" : "#64748b"} />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{p.role || "Participant"}</Text>
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 1 }}>{p.registration_status || "registered"}</Text>
              </View>
              {p.attended && (
                <View style={{ backgroundColor: "#064e3b", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: "#6ee7b7", fontSize: 10, fontWeight: "600" }}>ATTENDED</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 20, alignItems: "center" }}>
            <Ionicons name="people-outline" size={32} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 8, fontSize: 13 }}>No participants yet</Text>
          </View>
        )}
      </View>

      {/* Register Button */}
      <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
        <TouchableOpacity
          onPress={() => router.push("/participants/create")}
          style={{ backgroundColor: "#0ea5e9", borderRadius: 12, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center" }}
        >
          <Ionicons name="person-add" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>Register Participant</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
