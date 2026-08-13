import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SMS from "expo-sms";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  id: string;
  text: string;
  sent: boolean;
  timestamp: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { name, phone } = useLocalSearchParams<{ name: string; phone: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !phone) return;

    const text = input.trim();
    setInput("");

    // Add to local UI immediately
    const localMsg: Message = {
      id: Date.now().toString(),
      text,
      sent: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, localMsg]);

    // Send via expo-sms
    setSending(true);
    const { result } = await SMS.sendSMSAsync([phone], text);
    setSending(false);

    if (result === "cancelled") {
      Alert.alert("Cancelled", "Message was not sent");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{name || "Unknown"}</Text>
          <Text style={styles.headerPhone}>{phone || ""}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push({ pathname: "/communication/call" as any, params: { phone } })}>
          <Ionicons name="call-outline" size={22} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.sent ? styles.sentBubble : styles.receivedBubble]}>
            <Text style={item.sent ? styles.sentText : styles.receivedText}>{item.text}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color="#334155" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySub}>Send a message to start the conversation</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#64748B"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]} onPress={handleSend} disabled={!input.trim() || sending}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  headerPhone: { color: "#64748B", fontSize: 12, marginTop: 2 },
  messageBubble: { maxWidth: "75%", padding: 12, borderRadius: 16, marginBottom: 8 },
  sentBubble: { alignSelf: "flex-end", backgroundColor: "#6366F1", borderBottomRightRadius: 4 },
  receivedBubble: { alignSelf: "flex-start", backgroundColor: "#1a1a1a", borderBottomLeftRadius: 4 },
  sentText: { color: "#fff", fontSize: 15 },
  receivedText: { color: "#fff", fontSize: 15 },
  timestamp: { color: "#94A3B8", fontSize: 11, marginTop: 4, alignSelf: "flex-end" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#94A3B8", fontSize: 16, marginTop: 16 },
  emptySub: { color: "#64748B", fontSize: 13, marginTop: 4 },
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#1a1a1a" },
  input: { flex: 1, backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: "#fff", fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", marginLeft: 8 },
  sendBtnDisabled: { backgroundColor: "#334155" },
});

