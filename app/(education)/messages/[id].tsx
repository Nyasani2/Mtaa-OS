import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { Ionicons } from "@expo/vector-icons";

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const messageId = typeof id === "string" ? id : "";
  const [message, setMessage] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!messageId) return;
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data, error: err } = await supabase
          .from("education_messages")
          .select("*")
          .eq("id", messageId)
          .maybeSingle();
        if (err) throw err;
        setMessage(data);
        // Mark as read if receiver
        if (data.receiver_id === user?.id && !data.read_at) {
          await supabase.from("education_messages").update({ read_at: new Date().toISOString() }).eq("id", messageId);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load message");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [messageId, user?.id]);

  const handleReply = async () => {
    if (!reply.trim() || !message) return;
    try {
      setSending(true);
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_messages").insert({
        sender_id: user?.id,
        receiver_id: message.sender_id,
        institution_id: message.institution_id,
        subject: `Re: ${message.subject || "(No subject)"}`,
        body: reply.trim(),
        message_type: "reply",
      });
      if (error) throw error;
      Alert.alert("Sent", "Reply sent successfully");
      setReply("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  if (error || !message) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ color: "#f87171", marginTop: 12, fontSize: 16 }}>{error || "Message not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, backgroundColor: "#1e293b", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
          <Text style={{ color: "#38bdf8", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#0f172a", borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#f8fafc", fontSize: 20, fontWeight: "800" }} numberOfLines={1}>{message.subject || "(No subject)"}</Text>
        <View style={{ flexDirection: "row", marginTop: 6, alignItems: "center" }}>
          <Ionicons name="person-outline" size={12} color="#64748b" />
          <Text style={{ color: "#64748b", fontSize: 12, marginLeft: 4 }}>From: {message.sender_id.slice(0, 8)}...</Text>
          <Text style={{ color: "#475569", marginHorizontal: 8 }}>|</Text>
          <Text style={{ color: "#64748b", fontSize: 12 }}>{new Date(message.created_at).toLocaleString()}</Text>
          {message.is_broadcast && (
            <>
              <Text style={{ color: "#475569", marginHorizontal: 8 }}>|</Text>
              <View style={{ backgroundColor: "#451a03", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 }}>
                <Text style={{ color: "#fcd34d", fontSize: 10, fontWeight: "600" }}>BROADCAST</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ color: "#e2e8f0", fontSize: 15, lineHeight: 22 }}>{message.body}</Text>
        </View>
      </ScrollView>

      {/* Reply Input */}
      {!message.is_broadcast && (
        <View style={{ padding: 12, backgroundColor: "#1e293b", borderTopWidth: 1, borderTopColor: "#334155" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Reply..."
              placeholderTextColor="#475569"
              multiline
              style={{
                flex: 1,
                backgroundColor: "#0f172a",
                borderRadius: 10,
                padding: 12,
                color: "#f8fafc",
                fontSize: 15,
                borderWidth: 1,
                borderColor: "#334155",
                maxHeight: 100,
              }}
            />
            <TouchableOpacity
              onPress={handleReply}
              disabled={sending || !reply.trim()}
              style={{
                marginLeft: 10,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: sending || !reply.trim() ? "#1e3a5f" : "#0ea5e9",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}