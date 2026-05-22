"use client";

import { useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useTribes } from "../hooks/useTribes";
import type { TribePost } from "../types";

interface Props {
  tribeId: string;
}

export function TribeFeed({ tribeId }: Props) {
  const { posts, loading, fetchPosts, createPost } = useTribes();
  const [content, setContent] = useState("");

  const handlePost = async () => {
    if (!content.trim()) return;
    await createPost(tribeId, content);
    setContent("");
    fetchPosts(tribeId);
  };

  const renderPost = ({ item }: { item: TribePost }) => (
    <View style={styles.postCard}>
      <Text style={styles.postContent}>{item.content}</Text>
      <Text style={styles.postMeta}>Likes: {item.likes_count || 0}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="Write a post..."
        />
        <TouchableOpacity onPress={handlePost} style={styles.button}>
          <Text style={styles.buttonText}>Post</Text>
        </TouchableOpacity>
      </View>
      {loading && <Text>Loading...</Text>}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  inputRow: { flexDirection: "row", marginBottom: 16, gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  button: { backgroundColor: "#2563eb", padding: 12, borderRadius: 8, justifyContent: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  postCard: { backgroundColor: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 12 },
  postContent: { fontSize: 14, color: "#1e293b" },
  postMeta: { fontSize: 12, color: "#64748b", marginTop: 8 },
});
