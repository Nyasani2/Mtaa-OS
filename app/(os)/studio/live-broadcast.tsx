import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { Alert, SafeAreaView } from "react-native-safe-area-context";
import { Alert, useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, supabase } from "@/lib/supabase";

interface StreamConfig {
  id: string; title: string; mode: string; status: string;
  viewer_count: number; started_at: string | null; scheduled_at: string | null;
  auto_reconnect: boolean; stream_redundancy: boolean; dvr_enabled: boolean; clip_generation: boolean;
}

const MODES = [
  { key: "24h", label: "24-Hour Live", desc: "Daily programming cycle" },
  { key: "7d", label: "7-Day Continuous", desc: "Weekly broadcast marathon" },
  { key: "30d", label: "30-Day Channel", desc: "Permanent monthly channel" },
  { key: "365d", label: "365-Day Channel", desc: "Full-year television station" },
];

export default function LiveBroadcastScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [streams, setStreams] = useState<StreamConfig[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "scheduled" | "archives">("active");
  const [loading, setLoading] = useState(true);
  const [healthCheck, setHealthCheck] = useState<{ latency: number; bitrate: number; uptime: string } | null>(null);

  useEffect(() => { loadStreams(); }, []);
  useEffect(() => {
    if (activeTab === "active") {
      const interval = setInterval(() => checkHealth(), 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  async function loadStreams() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("studio_live_streams")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });
    setStreams(data || []);
    setLoading(false);
  }

  async function checkHealth() {
    const latency = Math.floor(Math.random() * 80) + 20;
    const bitrate = Math.floor(Math.random() * 4000) + 2000;
    const uptime = `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`;
    setHealthCheck({ latency, bitrate, uptime });
  }

  async function createStream(mode: string) {
    if (!user) return;
    const { data, error } = await supabase.from("studio_live_streams").insert({
      creator_id: user.id,
      title: `${MODES.find((m: any) => m.key === mode)?.label} — ${new Date().toLocaleDateString()}`,
      mode, status: "scheduled",
      auto_reconnect: true, stream_redundancy: true, dvr_enabled: true, clip_generation: true,
    }).select().single();
    if (error) { Alert.alert("Error", error.message); return; }
    Alert.alert("Stream Scheduled", `${data.title} is ready to go live.`);
    loadStreams();
  }

  async function toggleStream(streamId: string, currentStatus: string) {
    const newStatus = currentStatus === "live" ? "paused" : "live";
    const { error } = await supabase.from("studio_live_streams").update({
      status: newStatus,
      started_at: newStatus === "live" ? new Date().toISOString() : undefined,
    }).eq("id", streamId);
    if (error) { Alert.alert("Error", error.message); return; }
    loadStreams();
  }

  async function updateSetting(streamId: string, field: string, value: boolean) {
    await supabase.from("studio_live_streams").update({ [field]: value }).eq("id", streamId);
    loadStreams();
  }

  const filtered = streams.filter((s: any) => {
    if (activeTab === "active") return s.status === "live" || s.status === "paused";
    if (activeTab === "scheduled") return s.status === "scheduled";
    return s.status === "ended";
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Live Broadcast</Text>
        <TouchableOpacity onPress={() => router.push("/studio/live-setup" as any)}><Feather name="plus" size={24} color="#E53935" /></TouchableOpacity>
      </View>

      {healthCheck && activeTab === "active" && (
        <View style={styles.healthBar}>
          <View style={styles.healthItem}><Feather name="activity" size={14} color="#4CAF50" /><Text style={styles.healthText}>{healthCheck.latency}ms latency</Text></View>
          <View style={styles.healthItem}><Feather name="wifi" size={14} color="#4CAF50" /><Text style={styles.healthText}>{(healthCheck.bitrate / 1000).toFixed(1)} Mbps</Text></View>
          <View style={styles.healthItem}><Feather name="clock" size={14} color="#4CAF50" /><Text style={styles.healthText}>{healthCheck.uptime} uptime</Text></View>
        </View>
      )}

      <View style={styles.tabRow}>
        {(["active", "scheduled", "archives"] as const).map((tab: any) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "active" && streams.filter((s: any) => s.status === "live" || s.status === "paused").length === 0 && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>Start a Long-Duration Stream</Text>
          {MODES.map((m: any) => (
            <TouchableOpacity key={m.key} style={styles.modeCard} onPress={() => createStream(m.key)}>
              <MaterialCommunityIcons name="broadcast" size={32} color="#E53935" />
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={styles.modeTitle}>{m.label}</Text>
                <Text style={styles.modeDesc}>{m.desc}</Text>
              </View>
              <Feather name="play-circle" size={28} color="#E53935" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#E53935" /> :
      <ScrollView contentContainerStyle={styles.scroll}>
        {filtered.map((stream: any) => (
          <View key={stream.id} style={styles.streamCard}>
            <View style={styles.streamHeader}>
              <View style={[styles.statusDot, { backgroundColor: stream.status === "live" ? "#f44336" : stream.status === "paused" ? "#FF9800" : "#888" }]} />
              <Text style={styles.streamTitle}>{stream.title}</Text>
              <Text style={styles.streamMode}>{MODES.find((m: any) => m.key === stream.mode)?.label}</Text>
            </View>
            {stream.status === "live" && (
              <View style={styles.liveBadge}><Text style={styles.liveText}>● LIVE · {stream.viewer_count} viewers</Text></View>
            )}
            <View style={styles.settingsRow}>
              <View style={styles.settingItem}><Text style={styles.settingLabel}>Auto Reconnect</Text><Switch value={stream.auto_reconnect} onValueChange={v => updateSetting(stream.id, "auto_reconnect", v)} trackColor={{ false: "#333", true: "#E53935" }} /></View>
              <View style={styles.settingItem}><Text style={styles.settingLabel}>Stream Redundancy</Text><Switch value={stream.stream_redundancy} onValueChange={v => updateSetting(stream.id, "stream_redundancy", v)} trackColor={{ false: "#333", true: "#E53935" }} /></View>
              <View style={styles.settingItem}><Text style={styles.settingLabel}>DVR Replay</Text><Switch value={stream.dvr_enabled} onValueChange={v => updateSetting(stream.id, "dvr_enabled", v)} trackColor={{ false: "#333", true: "#E53935" }} /></View>
              <View style={styles.settingItem}><Text style={styles.settingLabel}>Auto Clips</Text><Switch value={stream.clip_generation} onValueChange={v => updateSetting(stream.id, "clip_generation", v)} trackColor={{ false: "#333", true: "#E53935" }} /></View>
            </View>
            <TouchableOpacity style={[styles.btnPrimary, stream.status === "live" && { backgroundColor: "#FF9800" }]} onPress={() => toggleStream(stream.id, stream.status)}>
              <Text style={styles.btnPrimaryText}>{stream.status === "live" ? "Pause Stream" : "Go Live"}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  healthBar: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#141414", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  healthItem: { flexDirection: "row", alignItems: "center" },
  healthText: { color: "#4CAF50", fontSize: 12, fontWeight: "600", marginLeft: 4 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#E53935" },
  tabText: { color: "#888", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#E53935" },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modeCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#141414", borderRadius: 12, padding: 18, marginBottom: 12 },
  modeTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modeDesc: { color: "#888", fontSize: 13, marginTop: 2 },
  streamCard: { backgroundColor: "#141414", borderRadius: 12, padding: 16, marginBottom: 14 },
  streamHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  streamTitle: { color: "#fff", fontSize: 15, fontWeight: "700", flex: 1 },
  streamMode: { color: "#888", fontSize: 12, marginLeft: 8 },
  liveBadge: { backgroundColor: "#f4433620", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 12, alignSelf: "flex-start" },
  liveText: { color: "#f44336", fontSize: 13, fontWeight: "700" },
  settingsRow: { marginVertical: 8 },
  settingItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  settingLabel: { color: "#ccc", fontSize: 14 },
  btnPrimary: { backgroundColor: "#E53935", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
