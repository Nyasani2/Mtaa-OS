// app/(os)/pulse/businesses.tsx
// MTAA Pulse — Businesses Screen

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Briefcase, TrendingUp, MapPin, Star, ChevronRight } from "lucide-react-native";

const MOCK_BUSINESSES = [
  { id: "1", name: "Mama Njoro Shop", category: "Retail", rating: 4.8, location: "Nairobi", trend: "+12%" },
  { id: "2", name: "TechHub Africa", category: "Technology", rating: 4.5, location: "Nairobi", trend: "+8%" },
  { id: "3", name: "Greenfield Academy", category: "Education", rating: 4.9, location: "Mombasa", trend: "+15%" },
];

export default function PulseBusinessesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Briefcase size={22} color="#60A5FA" />
        <Text style={styles.headerTitle}>Businesses</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {MOCK_BUSINESSES.map((biz) => (
          <TouchableOpacity key={biz.id} style={styles.bizCard}>
            <View style={styles.bizIcon}>
              <Briefcase size={20} color="#60A5FA" />
            </View>
            <View style={styles.bizInfo}>
              <Text style={styles.bizName}>{biz.name}</Text>
              <Text style={styles.bizMeta}>{biz.category} • {biz.location}</Text>
              <View style={styles.bizStats}>
                <View style={styles.stat}><Star size={12} color="#FBBF24" /><Text style={styles.statText}>{biz.rating}</Text></View>
                <View style={styles.stat}><TrendingUp size={12} color="#34D399" /><Text style={[styles.statText, { color: "#34D399" }]}>{biz.trend}</Text></View>
              </View>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        ))}
        <View style={styles.empty}>
          <Text style={styles.emptyText}>More businesses coming from Marketplace</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  bizCard: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  bizIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(96,165,250,0.15)", justifyContent: "center", alignItems: "center", marginRight: 12 },
  bizInfo: { flex: 1 },
  bizName: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  bizMeta: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 6 },
  bizStats: { flexDirection: "row", gap: 12 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: 13 },
});
