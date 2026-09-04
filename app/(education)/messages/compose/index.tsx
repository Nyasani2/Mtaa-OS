import React, { useState } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch } from "react-native";
import { Alert, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from '@expo/vector-icons';

export default function ComposeMessageScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [receiverId, setReceiverId] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) {
      Alert.alert("Error", "Message body is required");
      return;
    }
    if (!isBroadcast && !receiverId.trim()) {
      Alert.alert("Error", "Receiver ID is required for direct messages");
      return;
    }
    try {
      setLoading(true);
      await EducationService.sendMessage({
        sender_id: user?.id || "",
        receiver_id: isBroadcast ? undefined : receiverId.trim(),
        institution_id: institutionId.trim() || undefined,
        subject: subject.trim() || undefined,
        body: body.trim(),
        message_type: "general",
        is_broadcast: isBroadcast,
      });
      Alert.alert("Sent", "Message sent successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send message");
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
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>Compose</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Send a message or broadcast</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600" }}>Broadcast to all</Text>
          <Switch
            value={isBroadcast}
            onValueChange={setIsBroadcast}
            trackColor={{ false: "#334155", true: "#0ea5e9" }}
            thumbColor={isBroadcast ? "#fff" : "#94a3b8"}
          />
        </View>

        {!isBroadcast && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Receiver ID</Text>
            <TextInput
              value={receiverId}
              onChangeText={setReceiverId}
              placeholder="Enter user UUID"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
            />
          </View>
        )}

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Institution ID (optional)</Text>
          <TextInput
            value={institutionId}
            onChangeText={setInstitutionId}
            placeholder="Enter institution UUID"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Message subject..."
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Message</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Type your message..."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={6}
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, textAlignVertical: "top", minHeight: 120, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={loading}
          style={{ backgroundColor: loading ? "#1e3a5f" : "#0ea5e9", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 32, flexDirection: "row", justifyContent: "center" }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>Send Message</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
