// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/auth/store/auth.store";

interface Message {
  id: string; role: "user" | "asis"; text: string; timestamp: Date;
}

const QUICK_ACTIONS = [
  { icon: "cut", label: "Edit Suggestions" },
  { icon: "image", label: "Thumbnail Gen" },
  { icon: "text", label: "Title & Desc" },
  { icon: "closed-captioning", label: "Subtitles" },
  { icon: "language", label: "Translate" },
  { icon: "volume-high", label: "Audio Cleanup" },
  { icon: "musical-notes", label: "Beat Rec" },
  { icon: "document-text", label: "Summarize" },
  { icon: "calendar", label: "Schedule" },
  { icon: "trending-up", label: "Insights" },
];

export default function ASISAssistantScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "asis", text: "Hello! I'm ASIS, your MStudio AI assistant. I can help with editing, thumbnails, captions, translations, scheduling, and creator insights. What would you like to work on?", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [messages]);

  async function sendMessage(text?: string) {
    const msg = text || input;
    if (!msg.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const responses: Record<string, string> = {
        "thumbnail": "I've analyzed your latest video. Recommended thumbnail: high-contrast face close-up with bold text overlay. Would you like me to generate 3 options?",
        "title": "Based on trending keywords, here are 3 title suggestions:\n1. 'The Truth About...'\n2. 'What Nobody Tells You About...'\n3. 'How I Built... in 30 Days'",
        "subtitle": "I'll auto-generate subtitles in English, Swahili, and French. Processing time: ~2 minutes for a 10-minute video.",
        "translate": "I can dub your video into 10 languages or translate on-screen text. Which language do you want to target first?",
        "audio": "Detected background noise in your audio. I'll apply noise reduction + normalize levels. Preview will be ready in 30 seconds.",
        "beat": "Analyzed your video mood: upbeat/energetic. Recommended beats: Afrobeats (BPM 110-120) or Amapiano (BPM 115). Want me to search the beat marketplace?",
        "summarize": "Video summary: 3 key points identified. I'll create a 60-second highlight reel and a Twitter thread. Ready to export?",
        "schedule": "Optimal posting time for your audience: Tuesday 7 PM EAT (peak engagement). I'll schedule your video and notify subscribers.",
        "insights": "Your channel grew 12% this week. Top performing content: tutorials (avg 8min watch time). Recommendation: create a series on your top topic.",
        "edit": "I suggest trimming the first 15 seconds (hook delay), adding a B-roll at 2:30, and boosting audio at 4:15. Apply all suggestions?",
      };
      const lower = msg.toLowerCase();
      let reply = "I'm here to help! I can assist with editing suggestions, thumbnail generation, title writing, subtitle creation, translation, audio cleanup, beat recommendations, video summaries, content scheduling, and performance insights. What do you need?";
      for (const key of Object.keys(responses)) { if (lower.includes(key)) { reply = responses[key]; break; } }
      const asisMsg: Message = { id: (Date.now() + 1).toString(), role: "asis", text: reply, timestamp: new Date() };
      setMessages(prev => [...prev, asisMsg]);
      setLoading(false);
    }, 1200);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.asisDot}><Ionicons name="sparkles" size={14} color="#fff" /></View>
          <Text style={styles.headerTitle}>ASIS Studio Assistant</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        {messages.map((m: any) => (
          <View key={m.id} style={[styles.bubble, m.role === "user" ? styles.bubbleUser : styles.bubbleAsis]}>
            {m.role === "asis" && <View style={styles.asisAvatar}><Ionicons name="sparkles" size={14} color="#fff" /></View>}
            <View style={[styles.bubbleInner, m.role === "user" ? styles.bubbleInnerUser : styles.bubbleInnerAsis]}>
              <Text style={[styles.bubbleText, m.role === "user" && { color: "#fff" }]}>{m.text}</Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.bubble}>
            <View style={styles.asisAvatar}><Ionicons name="sparkles" size={14} color="#fff" /></View>
            <View style={[styles.bubbleInner, styles.bubbleInnerAsis]}>
              <ActivityIndicator size="small" color="#E53935" />
            </View>
          </View>
        )}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
        {QUICK_ACTIONS.map((action, i) => (
          <TouchableOpacity key={i} style={styles.quickChip} onPress={() => sendMessage(action.label.toLowerCase())}>
            <Ionicons name={action.icon as any} size={14} color="#E53935" />
            <Text style={styles.quickChipText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputBar}>
          <TextInput style={styles.input} placeholder="Ask ASIS anything..." placeholderTextColor="#888" value={input} onChangeText={setInput} multiline />
          <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage()} disabled={loading || !input.trim()}>
            <Feather name="send" size={20} color={input.trim() ? "#E53935" : "#555"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  headerCenter: { flexDirection: "row", alignItems: "center" },
  asisDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#E53935", alignItems: "center", justifyContent: "center", marginRight: 10 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 20 },
  bubble: { flexDirection: "row", alignItems: "flex-end", marginBottom: 14 },
  bubbleUser: { justifyContent: "flex-end" },
  asisAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#E53935", alignItems: "center", justifyContent: "center", marginRight: 10, marginBottom: 2 },
  bubbleInner: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleInnerUser: { backgroundColor: "#E53935", borderBottomRightRadius: 4 },
  bubbleInnerAsis: { backgroundColor: "#1a1a1a", borderBottomLeftRadius: 4 },
  bubbleText: { color: "#ddd", fontSize: 14, lineHeight: 20 },
  quickActions: { paddingHorizontal: 12, paddingVertical: 8 },
  quickChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: "#2a2a2a" },
  quickChipText: { color: "#ccc", fontSize: 12, fontWeight: "600", marginLeft: 6 },
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1a1a1a" },
  input: { flex: 1, backgroundColor: "#141414", color: "#fff", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, maxHeight: 100 },
  sendBtn: { marginLeft: 10, padding: 10 },
});
