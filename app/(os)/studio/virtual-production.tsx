import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, FontAwesome5 } from "@expo/vector-icons";

const VIDEO_TOOLS = [
  { icon: "layer-group", label: "Multi-Track Timeline", desc: "Video, audio, text, effects layers" },
  { icon: "video", label: "Multi-Camera Edit", desc: "Sync and cut between camera angles" },
  { icon: "image", label: "Green Screen", desc: "Chroma key compositing" },
  { icon: "shapes", label: "Motion Graphics", desc: "Animated titles and lower-thirds" },
  { icon: "palette", label: "Color Grading", desc: "LUTs, curves, exposure correction" },
  { icon: "volume-up", label: "Audio Mixing", desc: "Multi-track mixer with effects rack" },
  { icon: "closed-captioning", label: "AI Captions", desc: "Auto-generate and translate subtitles" },
  { icon: "language", label: "AI Translation", desc: "Dub voice and translate on-screen text" },
];

const MUSIC_TOOLS = [
  { icon: "microphone", label: "Multi-Track Recording", desc: "Record up to 32 simultaneous tracks" },
  { icon: "sliders-h", label: "Mixer", desc: "Per-track EQ, pan, gain, sends" },
  { icon: "wave-square", label: "Equalizer", desc: "Parametric EQ with spectrum analyzer" },
  { icon: "magic", label: "Effects Rack", desc: "Reverb, delay, compression, distortion" },
  { icon: "headphones", label: "Noise Reduction", desc: "AI-powered audio cleanup" },
  { icon: "bullseye", label: "Mastering", desc: "Auto-loudness, limiting, stereo width" },
  { icon: "file-audio", label: "Lyrics Editor", desc: "Time-synced lyrics with export" },
  { icon: "image", label: "Album Artwork", desc: "Built-in cover art designer" },
];

const BROADCAST_TOOLS = [
  { icon: "desktop", label: "Virtual Control Room", desc: "Director dashboard with preview/program" },
  { icon: "exchange-alt", label: "Scene Switching", desc: "Transition between scenes instantly" },
  { icon: "font", label: "Lower-Thirds", desc: "Name plates, titles, chyrons" },
  { icon: "newspaper", label: "News Tickers", desc: "Scrolling headlines and breaking news" },
  { icon: "cloud-sun", label: "Weather Overlays", desc: "Live weather maps and graphics" },
  { icon: "users", label: "Remote Contributors", desc: "Bring in guests via video link" },
  { icon: "chart-bar", label: "Live Graphics", desc: "Scoreboards, polls, real-time data" },
];

export default function VirtualProductionScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"video" | "music" | "broadcast">("video");
  const tools = activeTab === "video" ? VIDEO_TOOLS : activeTab === "music" ? MUSIC_TOOLS : BROADCAST_TOOLS;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Virtual Production</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabRow}>
        {(["video", "music", "broadcast"] as const).map((tab: any) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Production Tools</Text>
        {tools.map((tool, i) => (
          <View key={i} style={styles.toolCard}>
            <View style={styles.toolIcon}><FontAwesome5 name={tool.icon} size={22} color="#E53935" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toolLabel}>{tool.label}</Text>
              <Text style={styles.toolDesc}>{tool.desc}</Text>
            </View>
            <TouchableOpacity style={styles.toolBtn}><Text style={styles.toolBtnText}>Open</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#E53935" },
  tabText: { color: "#888", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#E53935" },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  toolCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#141414", borderRadius: 12, padding: 16, marginBottom: 10 },
  toolIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center", marginRight: 14 },
  toolLabel: { color: "#fff", fontSize: 15, fontWeight: "700" },
  toolDesc: { color: "#888", fontSize: 13, marginTop: 2 },
  toolBtn: { backgroundColor: "#E53935", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  toolBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
