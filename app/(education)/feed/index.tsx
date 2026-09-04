import { useState } from 'react';
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { Ionicons } from '@expo/vector-icons';

export default function EducationFeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const { supabase } = await import("@/lib/supabase");
      const { data: p, error: pe } = await supabase
        .from("education_posts")
        .select("*, author:author_id(full_name, avatar_url), likes:education_post_likes(count)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (pe) throw pe;
      setPosts(p || []);

      const { data: s, error: se } = await supabase
        .from("education_stories")
        .select("*, author:author_id(full_name, avatar_url)")
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(20);
      if (se) throw se;
      setStories(s || []);
    } catch (err: any) {
      setError(err.message || "Failed to load feed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const likePost = async (postId: string) => {
    if (!user?.id) return;
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_post_likes").insert({ post_id: postId, user_id: user.id });
      if (error && !error.message.includes("duplicate")) throw error;
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, liked: true, likes: [{ count: (p.likes?.[0]?.count || 0) + 1 }] } : p));
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#0f172a", borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800" }}>Education Feed</Text>
        <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>Updates from your school community</Text>
      </View>

      {error && (
        <View style={{ backgroundColor: "#7f1d1d", marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 8 }}>
          <Text style={{ color: "#fecaca" }}>{error}</Text>
        </View>
      )}

      {stories.length > 0 && (
        <FlatList
          horizontal
          data={stories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={{ marginRight: 12, alignItems: "center" }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: "#0ea5e9", padding: 2 }}>
                <Image source={{ uri: item.author?.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.author?.full_name || "User") }} style={{ width: 56, height: 56, borderRadius: 28 }} />
              </View>
              <Text style={{ color: "#f8fafc", fontSize: 11, marginTop: 6, maxWidth: 64 }} numberOfLines={1}>{item.author?.full_name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#38bdf8" />}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 16, marginBottom: 16, overflow: "hidden" }}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
              <Image source={{ uri: item.author?.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.author?.full_name || "U") }} style={{ width: 40, height: 40, borderRadius: 20 }} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{item.author?.full_name || "Anonymous"}</Text>
                <Text style={{ color: "#64748b", fontSize: 11 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
            {item.media_url && (
              <Image source={{ uri: item.media_url }} style={{ width: "100%", height: 240 }} resizeMode="cover" />
            )}
            <View style={{ padding: 14 }}>
              <Text style={{ color: "#f8fafc", fontSize: 14, lineHeight: 20 }}>{item.content}</Text>
              <View style={{ flexDirection: "row", marginTop: 12, gap: 20 }}>
                <TouchableOpacity onPress={() => likePost(item.id)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name={item.liked ? "heart" : "heart-outline"} size={20} color={item.liked ? "#ef4444" : "#94a3b8"} />
                  <Text style={{ color: "#94a3b8", fontSize: 13 }}>{item.likes?.[0]?.count || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="chatbubble-outline" size={20} color="#94a3b8" />
                  <Text style={{ color: "#94a3b8", fontSize: 13 }}>{item.comment_count || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="share-outline" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons name="newspaper-outline" size={48} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 12, fontSize: 14 }}>No posts yet</Text>
            <Text style={{ color: "#475569", marginTop: 4, fontSize: 12 }}>Be the first to share something!</Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={() => router.push("/(education as any)/feed/create" as any)}
        style={{ position: "absolute", right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#0ea5e9", justifyContent: "center", alignItems: "center", elevation: 6 }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
