// components/shop/CustomerChat.tsx
import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { useShopMessages } from "@/lib/shop/hooks/useMarketplace";

interface CustomerChatProps {
  shopId: string;
  customerId: string;
  productId?: string;
  orderId?: string;
}

export default function CustomerChat({ shopId, customerId, productId, orderId }: CustomerChatProps) {
  const { messages, loading, sendMessage } = useShopMessages(shopId, customerId);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { if (messages.length > 0) flatListRef.current?.scrollToEnd({ animated: true }); }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage(text, "customer", productId, orderId);
    setText("");
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[styles.messageBubble, item.sender_type === "customer" ? styles.customerBubble : styles.shopBubble]}>
      <Text style={[styles.messageText, item.sender_type === "customer" ? styles.customerText : styles.shopText]}>{item.message}</Text>
      <Text style={styles.messageTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={(item) => item.id} contentContainerStyle={styles.messageList} ListEmptyComponent={<Text style={styles.empty}>Start a conversation...</Text>} />
      <View style={styles.inputBar}>
        <TextInput style={styles.input} placeholder="Type a message..." placeholderTextColor="#64748b" value={text} onChangeText={setText} multiline />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}><Text style={styles.sendBtnText}>➤</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  messageList: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  customerBubble: { alignSelf: "flex-end", backgroundColor: "#3b82f6" },
  shopBubble: { alignSelf: "flex-start", backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155" },
  messageText: { fontSize: 15, lineHeight: 20 },
  customerText: { color: "#fff" },
  shopText: { color: "#e2e8f0" },
  messageTime: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4, alignSelf: "flex-end" },
  empty: { color: "#64748b", textAlign: "center", marginTop: 40 },
  inputBar: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "#1e293b", gap: 8 },
  input: { flex: 1, backgroundColor: "#1e293b", color: "#f8fafc", padding: 12, borderRadius: 20, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, backgroundColor: "#3b82f6", borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sendBtnText: { color: "#fff", fontSize: 18 },
});
