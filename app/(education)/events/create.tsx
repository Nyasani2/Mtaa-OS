import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function EventCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("general");
  const [audience, setAudience] = useState("all");

  const eventTypes = ["general", "sports", "academic", "cultural", "meeting", "exam"];
  const audiences = ["all", "students", "teachers", "parents", "staff"];

  const createEvent = async () => {
    if (!title.trim()) { Alert.alert("Missing", "Event title is required"); return; }
    try {
      setLoading(true);
      const { error } = await supabase.from("education_events").insert({
        title: title.trim(), description: description.trim() || null,
        location: location.trim() || null, event_type: eventType,
        audience: audience, created_by: user?.id,
        status: "upcoming", created_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert("Created", "Event published successfully");
      router.back();
    } catch (err) { Alert.alert("Error", err.message || "Failed to create event"); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", flex: 1 }}>Create Event</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Event title" placeholderTextColor="#475569" style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 14, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155", marginBottom: 14 }} />

        <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Description</Text>
        <TextInput value={description} onChangeText={setDescription} placeholder="What's this event about?" placeholderTextColor="#475569" multiline numberOfLines={4} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 14, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155", marginBottom: 14, textAlignVertical: "top" }} />

        <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Location</Text>
        <TextInput value={location} onChangeText={setLocation} placeholder="Where is it happening?" placeholderTextColor="#475569" style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 14, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155", marginBottom: 14 }} />

        <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 8, textTransform: "uppercase" }}>Event Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {eventTypes.map((t) => (
            <TouchableOpacity key={t} onPress={() => setEventType(t)} style={{ backgroundColor: eventType === t ? "#3b82f6" : "#1e293b", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: eventType === t ? "#3b82f6" : "#334155" }}>
              <Text style={{ color: eventType === t ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600", textTransform: "capitalize" }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 8, textTransform: "uppercase" }}>Audience</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {audiences.map((a) => (
            <TouchableOpacity key={a} onPress={() => setAudience(a)} style={{ backgroundColor: audience === a ? "#3b82f6" : "#1e293b", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: audience === a ? "#3b82f6" : "#334155" }}>
              <Text style={{ color: audience === a ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600", textTransform: "capitalize" }}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={createEvent} disabled={loading} style={{ backgroundColor: "#3b82f6", borderRadius: 12, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
          {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="add-circle" size={18} color="#fff" />}
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{loading ? "Creating..." : "Publish Event"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
