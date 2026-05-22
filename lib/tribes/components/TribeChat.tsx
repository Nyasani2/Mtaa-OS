"use client";

import { useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useTribeChat } from "../hooks/useTribes";

interface Props {
  tribeId: string;
}

export function TribeChat({ tribeId }: Props) {
  const { messages, loading, sendMessage } = useTribeChat(tribeId);
  const [content, setContent] = useState("");

  const handleSend = async () => {
    if (!content.trim()) return;
    await sendMessage(content);
    setContent("");
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[styles.message, item.sender === "me" ? styles.myMessage : styles.otherMessage]}>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList data={messages} renderItem={renderMessage} keyExtractor={(item) => String(item.id)} />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={content} onChangeText={setContent} placeholder="Message..." />
        <TouchableOpacity onPress={handleSend} style={styles.button}>
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  message: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: "80%" },
  myMessage: { backgroundColor: "#2563eb", alignSelf: "flex-end" },
  otherMessage: { backgroundColor: "#f1f5f9", alignSelf: "flex-start" },
  messageText: { color: "#1e293b" },
  inputRow: { flexDirection: "row", gap: 8, paddingTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  button: { backgroundColor: "#2563eb", padding: 12, borderRadius: 8, justifyContent: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
});
