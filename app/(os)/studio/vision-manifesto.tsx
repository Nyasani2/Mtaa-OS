import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';

const VISION_POINTS = [
  { icon: "user", label: "Individual Creators", desc: "Empowering every African storyteller" },
  { icon: "music", label: "Musicians", desc: "Full ownership of sound and earnings" },
  { icon: "graduation-cap", label: "Teachers", desc: "Education reaches every classroom" },
  { icon: "school", label: "Schools", desc: "Digital learning infrastructure" },
  { icon: "university", label: "Universities", desc: "Research and knowledge broadcast" },
  { icon: "tv", label: "Television Stations", desc: "24/7 broadcast channels on MTAA" },
  { icon: "radio", label: "Radio Stations", desc: "Audio-first community connection" },
  { icon: "church", label: "Churches", desc: "Faith and worship livestreaming" },
  { icon: "landmark", label: "Governments", desc: "Transparent public communication" },
  { icon: "building", label: "Businesses", desc: "Brand storytelling and commerce" },
  { icon: "newspaper", label: "Journalists", desc: "Independent press and reporting" },
  { icon: "film", label: "Filmmakers", desc: "Cinema-quality production tools" },
  { icon: "futbol", label: "Sports Organizations", desc: "Live sports and event coverage" },
  { icon: "broadcast-tower", label: "Broadcasters", desc: "Professional media infrastructure" },
];

const ECOSYSTEM_PILLARS = [
  { label: "Creation", desc: "Camera, editing, music, broadcast tools" },
  { label: "Distribution", desc: "Feed, search, recommendations, sharing" },
  { label: "Monetization", desc: "Ads, memberships, sales, tips, events" },
  { label: "Analytics", desc: "Audience, retention, revenue insights" },
  { label: "Commerce", desc: "Marketplace, merch, digital products" },
  { label: "Finance", desc: "Transparent revenue, wallet, payouts" },
];

export default function MStudioVisionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>MStudio Vision</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Manifesto */}
        <View style={styles.manifestoCard}>
          <Ionicons name="sparkles" size={40} color="#E53935" />
          <Text style={styles.manifestoTitle}>Built for African Creators</Text>
          <Text style={styles.manifestoText}>
            MStudio is the media production and distribution backbone of MTAA OS. 
            It combines creation, editing, broadcasting, monetization, analytics, 
            commerce, and transparent financial management in one integrated 
            creator ecosystem — designed by Africans, for Africans.
          </Text>
        </View>

        {/* Ecosystem Pillars */}
        <Text style={styles.sectionTitle}>Integrated Ecosystem</Text>
        {ECOSYSTEM_PILLARS.map((p, i) => (
          <View key={i} style={styles.pillarCard}>
            <Text style={styles.pillarLabel}>{p.label}</Text>
            <Text style={styles.pillarDesc}>{p.desc}</Text>
          </View>
        ))}

        {/* Who We Serve */}
        <Text style={styles.sectionTitle}>Who We Serve</Text>
        <View style={styles.serveGrid}>
          {VISION_POINTS.map((vp, i) => (
            <View key={i} style={styles.serveItem}>
              <FontAwesome5 name={vp.icon} size={20} color="#E53935" />
              <Text style={styles.serveLabel}>{vp.label}</Text>
              <Text style={styles.serveDesc}>{vp.desc}</Text>
            </View>
          ))}
        </View>

        {/* Completion Badge */}
        <View style={styles.badgeCard}>
          <Text style={styles.badgeTitle}>MStudio 100% Complete</Text>
          <Text style={styles.badgeText}>
            All 30 sections built. Production-ready. Ready for Africa.
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push("/studio/unified-studio" as any)}>
            <Text style={styles.btnPrimaryText}>Enter Creator Studio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 40 },
  manifestoCard: { backgroundColor: "#141414", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 24, borderWidth: 1, borderColor: "#E5393530" },
  manifestoTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 14, textAlign: "center" },
  manifestoText: { color: "#aaa", fontSize: 14, textAlign: "center", marginTop: 10, lineHeight: 22 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  pillarCard: { backgroundColor: "#141414", borderRadius: 10, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: "#E53935" },
  pillarLabel: { color: "#fff", fontSize: 14, fontWeight: "700" },
  pillarDesc: { color: "#888", fontSize: 13, marginTop: 2 },
  serveGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  serveItem: { width: "48%", backgroundColor: "#141414", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 10 },
  serveLabel: { color: "#fff", fontSize: 12, fontWeight: "700", marginTop: 8, textAlign: "center" },
  serveDesc: { color: "#888", fontSize: 11, marginTop: 2, textAlign: "center" },
  badgeCard: { backgroundColor: "#E5393515", borderRadius: 16, padding: 24, alignItems: "center", marginTop: 20, borderWidth: 1, borderColor: "#E5393540" },
  badgeTitle: { color: "#E53935", fontSize: 18, fontWeight: "800" },
  badgeText: { color: "#ccc", fontSize: 13, textAlign: "center", marginTop: 8, marginBottom: 16 },
  btnPrimary: { backgroundColor: "#E53935", borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32, alignItems: "center" },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
