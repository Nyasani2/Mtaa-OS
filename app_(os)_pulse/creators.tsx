// app/(os)/pulse/creators.tsx
// MTAA Pulse — Top Creators Screen

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from "react-native";
import { pulseService } from "@/domains/pulse/services/pulseService";
import type { PulseCreatorScore } from "@/domains/pulse/types";
import { Users, TrendingUp, Eye, Heart, DollarSign, Award } from "lucide-react-native";

export default function PulseCreatorsScreen() {
  const [creators, setCreators] = useState<PulseCreatorScore[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCreators = async () => {
    setLoading(true);
    try {
      const data = await pulseService.getCreatorScores({ limit: 50 });
      setCreators(data);
    } catch (e: any) {
      console.error("Failed to load creators:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreators();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Award size={22} color="#F472B6" />
        <Text style={styles.headerTitle}>Top Creators</Text>
      </View>

      {loading && creators.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCreators} tintColor="#FF6B35" />}>
          {creators.map((c, i) => (
            <View key={c.id} style={styles.creatorRow}>
              <View style={[styles.rankBadge, i < 3 && styles.rankBadgeTop]}>
                <Text style={[styles.rankText, i < 3 && styles.rankTextTop]}>#{i + 1}</Text>
              </View>
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarText}>{c.creator_id.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.creatorInfo}>
                <Text style={styles.creatorName}>{c.creator_id}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.stat}><Users size={12} color="rgba(255,255,255,0.4)" /><Text style={styles.statText}>{c.follower_count.toLocaleString()}</Text></View>
                  <View style={styles.stat}><Eye size={12} color="rgba(255,255,255,0.4)" /><Text style={styles.statText}>{c.total_views.toLocaleString()}</Text></View>
                  <View style={styles.stat}><Heart size={12} color="rgba(255,255,255,0.4)" /><Text style={styles.statText}>{c.total_engagement.toLocaleString()}</Text></View>
                </View>
              </View>
              <View style={styles.scoreWrap}>
                <Text style={styles.scoreValue}>{c.overall_score.toFixed(1)}</Text>
                <Text style={styles.scoreLabel}>Score</Text>
              </View>
            </View>
          ))}
          {creators.length === 0 && (
            <View style={styles.empty}>
              <Users size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No creators yet</Text>
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
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  creatorRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  rankBadge: { width: 32, alignItems: "center" },
  rankBadgeTop: {},
  rankText: { color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: "700" },
  rankTextTop: { color: "#FF6B35", fontSize: 14, fontWeight: "800" },
  creatorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F472B6", justifyContent: "center", alignItems: "center", marginRight: 12 },
  creatorAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  creatorInfo: { flex: 1 },
  creatorName: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 6 },
  statsRow: { flexDirection: "row", gap: 12 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  scoreWrap: { alignItems: "center" },
  scoreValue: { color: "#FF6B35", fontSize: 18, fontWeight: "800" },
  scoreLabel: { color: "rgba(255,255,255,0.3)", fontSize: 10 },
  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: 14, marginTop: 12 },
});
