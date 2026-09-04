import React, { useState } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from "react-native";
import { Alert, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, Ionicons } from "@expo/vector-icons";

export default function FeedCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [postType, setPostType] = useState<"general" | "announcement" | "achievement">("general");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) { Alert.alert("Required", "Please write something before posting."); return; }
    if (!user?.id) { Alert.alert("Error", "You must be logged in to post."); return; }

    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_posts").insert({
        content: content.trim(),
        media_url: mediaUrl.trim() || null,
        post_type: postType,
        author_id: user.id,
        institution_id: null,
      });
      if (error) throw error;
      Alert.alert("Posted!", "Your update has been shared with the community.");
      router.back();
    } catch (err: any) {
      Alert.alert("Post Failed", err.message || "Could not create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#000" }} contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 12, flex: 1 }}>New Post</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={{ backgroundColor: "#0ea5e9", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, opacity: loading ? 0.6 : 1 }}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Post</Text>}
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {(["general", "announcement", "achievement"] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setPostType(t)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: postType === t ? "#0ea5e9" : "#1e293b", borderWidth: 1, borderColor: postType === t ? "#0ea5e9" : "#334155" }}>
            <Text style={{ color: postType === t ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="What's happening in your school?"
        placeholderTextColor="#475569"
        multiline
        style={{ color: "#fff", fontSize: 16, lineHeight: 22, minHeight: 120, textAlignVertical: "top", marginBottom: 16 }}
      />

      <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Media URL (optional)</Text>
      <TextInput
        value={mediaUrl}
        onChangeText={setMediaUrl}
        placeholder="https://..."
        placeholderTextColor="#475569"
        style={{ color: "#fff", fontSize: 14, backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 16 }}
        autoCapitalize="none"
        keyboardType="url"
      />
      {mediaUrl ? (
        <Image source={{ uri: mediaUrl }} style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 16 }} resizeMode="cover" />
      ) : null}
    </ScrollView>
  );
}
