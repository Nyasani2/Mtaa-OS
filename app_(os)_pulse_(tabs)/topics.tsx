// app/(os)/pulse/(tabs)/topics.tsx
// MTAA Pulse — Topics Tab

import React, { useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from "react-native";
import { usePulseTopics } from "@/domains/pulse/hooks/usePulseHome";
import { usePulseStore } from "@/domains/pulse/state/store";
import { Hash, Users, Check, Plus } from "lucide-react-native";

const CATEGORIES = [
  "all", "business", "technology", "culture", "politics",
  "sports", "education", "health", "entertainment", "science", "general"
] as const;

export default function PulseTopicsScreen() {
  const { topics, isLoading, loadTopics, follow, unfollow } = usePulseTopics();
  const [category, setCategory] = React.useState<string>("all");

  useEffect(() => {
    loadTopics(category === "all" ? {} : { category });
  }, [category]);

  const filtered = category === "all" ? topics : topics.filter((t) => t.category === category);

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catBar}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, category === cat && styles.catBtnActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && topics.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => loadTopics()} tintColor="#FF6B35" />}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((topic) => (
            <View key={topic.id} style={styles.topicRow}>
              <View style={styles.topicIcon}>
                <Hash size={20} color="#34D399" />
              </View>
              <View style={styles.topicInfo}>
                <Text style={styles.topicName}>#{topic.name}</Text>
                <Text style={styles.topicMeta}>{topic.category} • {topic.follower_count.toLocaleString()} followers • {topic.post_count.toLocaleString()} posts</Text>
                {topic.description && (
                  <Text style={styles.topicDesc} numberOfLines={2}>{topic.description}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.followBtn, topic.is_following && styles.followBtnActive]}
                onPress={() => topic.is_following ? unfollow(topic.id) : follow(topic.id)}
              >
                {topic.is_following ? (
                  <Check size={14} color="#fff" />
                ) : (
                  <Plus size={14} color="#FF6B35" />
                )}
                <Text style={[styles.followText, topic.is_following && styles.followTextActive]}>
                  {topic.is_following ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Hash size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No topics in this category</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  catBar: { maxHeight: 50, paddingHorizontal: 12, paddingVertical: 8 },
  catBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)",
    marginRight: 8,
  },
  catBtnActive: { backgroundColor: "#FF6B35" },
  catText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  catTextActive: { color: "#fff" },

  topicRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)",
  },
  topicIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(52,211,153,0.15)",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  topicInfo: { flex: 1 },
  topicName: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  topicMeta: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 4 },
  topicDesc: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  followBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: "#FF6B35",
  },
  followBtnActive: { backgroundColor: "#34D399", borderColor: "#34D399" },
  followText: { color: "#FF6B35", fontSize: 12, fontWeight: "600" },
  followTextActive: { color: "#fff" },

  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: 14, marginTop: 12 },
});
