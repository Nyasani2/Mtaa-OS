// app/(os)/pulse/communities.tsx
// MTAA Pulse — Communities Screen

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Users, UserPlus, MessageCircle, ChevronRight } from "lucide-react-native";

const MOCK_COMMUNITIES = [
  { id: "1", name: "Nairobi Tech Hub", members: 1247, posts: 342, category: "Technology" },
  { id: "2", name: "Mombasa Entrepreneurs", members: 892, posts: 156, category: "Business" },
  { id: "3", name: "African Creators", members: 3401, posts: 890, category: "Creative" },
];

export default function PulseCommunitiesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Users size={22} color="#34D399" />
        <Text style={styles.headerTitle}>Communities</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {MOCK_COMMUNITIES.map((comm) => (
          <TouchableOpacity key={comm.id} style={styles.commCard}>
            <View style={styles.commIcon}>
              <Users size={20} color="#34D399" />
            </View>
            <View style={styles.commInfo}>
              <Text style={styles.commName}>{comm.name}</Text>
              <Text style={styles.commMeta}>{comm.category}</Text>
              <View style={styles.commStats}>
                <View style={styles.stat}><UserPlus size={12} color="rgba(255,255,255,0.4)" /><Text style={styles.statText}>{comm.members.toLocaleString()} members</Text></View>
                <View style={styles.stat}><MessageCircle size={12} color="rgba(255,255,255,0.4)" /><Text style={styles.statText}>{comm.posts.toLocaleString()} posts</Text></View>
              </View>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        ))}
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Communities powered by Tribes</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  commCard: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  commIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(52,211,153,0.15)", justifyContent: "center", alignItems: "center", marginRight: 12 },
  commInfo: { flex: 1 },
  commName: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  commMeta: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 6 },
  commStats: { flexDirection: "row", gap: 12 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: 13 },
});
