import React, { useState } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Alert, useRouter } from "expo-router";
import EducationService from "@/lib/services/education-service";
import { Alert, Ionicons } from "@expo/vector-icons";

export default function CreateParticipantScreen() {
  const router = useRouter();
  const [eventId, setEventId] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!eventId.trim() || !userId.trim()) {
      Alert.alert("Error", "Event ID and User ID are required");
      return;
    }
    try {
      setLoading(true);
      await EducationService.createParticipant({
        event_id: eventId.trim(),
        user_id: userId.trim(),
        role: role.trim() || undefined,
        registration_status: "registered",
        attended: false,
      });
      Alert.alert("Success", "Participant registered", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to register participant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>Register Participant</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Add someone to an event</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Event ID</Text>
          <TextInput
            value={eventId}
            onChangeText={setEventId}
            placeholder="Enter event UUID"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>User ID</Text>
          <TextInput
            value={userId}
            onChangeText={setUserId}
            placeholder="Enter user UUID"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Role (optional)</Text>
          <TextInput
            value={role}
            onChangeText={setRole}
            placeholder="e.g. Speaker, Volunteer"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading}
          style={{ backgroundColor: loading ? "#1e3a5f" : "#0ea5e9", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 32, flexDirection: "row", justifyContent: "center" }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>Register</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
