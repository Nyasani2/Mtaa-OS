import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function FeedCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("general");

  const postTypes = ["general", "announcement", "achievement", "question", "resource"];

  const createPost = async () => {
    if (!content.trim()) { Alert.alert("Missing", "Write something first"); return; }
    try {
      setLoading(true);
      const { error } = await supabase.from("education_feed_posts").insert({
        content: content.trim(), post_type: postType,
        author_id: user?.id, created_at: new Date().toISOString(),
        likes_count: 0, comments_count: 0,
      });
      if (error) throw error;
      Alert.alert("Posted", "Your post is live");
      router.back();
    } catch (err) { Alert.alert("Error", err.message || "Failed to post"); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", flex: 1 }}>New Post</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 8, textTransform: "uppercase" }}>Post Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {postTypes.map((t) => (
            <TouchableOpacity key={t} onPress={() => setPostType(t)} style={{ backgroundColor: postType === t ? "#3b82f6" : "#1e293b", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: postType === t ? "#3b82f6" : "#334155" }}>
              <Text style={{ color: postType === t ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600", textTransform: "capitalize" }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Content</Text>
        <TextInput value={content} onChangeText={setContent} placeholder="What's on your mind?" placeholderTextColor="#475569" multiline numberOfLines={8} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 14, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155", marginBottom: 20, textAlignVertical: "top", minHeight: 150 }} />

        <TouchableOpacity onPress={createPost} disabled={loading} style={{ backgroundColor: "#3b82f6", borderRadius: 12, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
          {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="paper-plane" size={18} color="#fff" />}
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{loading ? "Posting..." : "Post to Feed"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
