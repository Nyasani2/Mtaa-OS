import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";

interface CameraDevice {
  id: string; name: string; type: string; status: string;
  battery: number; resolution: string; angle: string;
}

export default function MultiCameraScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cameras, setCameras] = useState<CameraDevice[]>([
    { id: "cam1", name: "Main Camera", type: "phone", status: "connected", battery: 87, resolution: "4K", angle: "Wide" },
    { id: "cam2", name: "Close-Up", type: "dslr", status: "connected", battery: 62, resolution: "1080p", angle: "Telephoto" },
    { id: "cam3", name: "Overhead", type: "action", status: "disconnected", battery: 0, resolution: "4K", angle: "Top-down" },
    { id: "cam4", name: "Side Angle", type: "tablet", status: "disconnected", battery: 0, resolution: "1080p", angle: "Profile" },
  ]);
  const [isPremium, setIsPremium] = useState(false);
  const [activeCamera, setActiveCamera] = useState("cam1");
  const [pipEnabled, setPipEnabled] = useState(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => { checkPremium(); }, []);

  async function checkPremium() {
    if (!user) return;
    const { data } = await supabase.from("studio_subscriptions").select("tier").eq("user_id", user.id).eq("status", "active").single();
    setIsPremium(data?.tier === "premium" || data?.tier === "pro");
  }

  function toggleCamera(camId: string) {
    setCameras(prev => prev.map(c => c.id === camId ? { ...c, status: c.status === "connected" ? "disconnected" : "connected" } : c));
  }

  function startRecording() {
    const connected = cameras.filter(c => c.status === "connected");
    if (connected.length === 0) { Alert.alert("No Cameras", "Connect at least one camera to start recording."); return; }
    setRecording(true);
    Alert.alert("Recording Started", `${connected.length} camera(s) recording simultaneously.`);
  }

  function stopRecording() {
    setRecording(false);
    Alert.alert("Recording Stopped", "All footage saved to your content library.");
  }

  const connectedCount = cameras.filter(c => c.status === "connected").length;
  const maxCameras = isPremium ? 4 : 1;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Multi-Camera</Text>
        <View style={styles.premiumBadge}><Text style={styles.premiumText}>{isPremium ? "PREMIUM" : "FREE"}</Text></View>
      </View>

      {!isPremium && (
        <View style={styles.upgradeBanner}>
          <Text style={styles.upgradeText}>Free tier: 1 camera. Upgrade to Premium for 4 cameras + director controls.</Text>
          <TouchableOpacity style={styles.upgradeBtn}><Text style={styles.upgradeBtnText}>10 KES/day</Text></TouchableOpacity>
        </View>
      )}

      <View style={styles.previewGrid}>
        {cameras.slice(0, maxCameras).map(cam => (
          <TouchableOpacity key={cam.id} style={[styles.previewBox, activeCamera === cam.id && styles.previewActive, cam.status === "disconnected" && styles.previewOffline]} onPress={() => setActiveCamera(cam.id)}>
            {cam.status === "connected" ? (
              <>
                <View style={styles.previewLabel}><Text style={styles.previewLabelText}>{cam.name}</Text></View>
                <View style={styles.previewMeta}>
                  <Text style={styles.previewMetaText}>{cam.resolution}</Text>
                  <Text style={styles.previewMetaText}>{cam.battery}% <Feather name="battery" size={10} color="#4CAF50" /></Text>
                </View>
                {recording && <View style={styles.recDot}><Text style={styles.recText}>REC</Text></View>}
              </>
            ) : (
              <View style={styles.offlineOverlay}>
                <Feather name="wifi-off" size={24} color="#666" />
                <Text style={styles.offlineText}>Offline</Text>
                <TouchableOpacity style={styles.connectBtn} onPress={() => toggleCamera(cam.id)}>
                  <Text style={styles.connectBtnText}>Connect</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Director Controls</Text>
        <View style={styles.controlRow}>
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Picture-in-Picture</Text>
            <Switch value={pipEnabled} onValueChange={setPipEnabled} trackColor={{ false: "#333", true: "#E53935" }} />
          </View>
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Auto Switch</Text>
            <Switch value={false} trackColor={{ false: "#333", true: "#E53935" }} />
          </View>
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Instant Replay</Text>
            <Switch value={false} trackColor={{ false: "#333", true: "#E53935" }} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Camera List</Text>
        {cameras.map(cam => (
          <View key={cam.id} style={styles.camRow}>
            <View style={[styles.camDot, { backgroundColor: cam.status === "connected" ? "#4CAF50" : "#666" }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.camName}>{cam.name}</Text>
              <Text style={styles.camMeta}>{cam.type.toUpperCase()} · {cam.resolution} · {cam.angle}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleCamera(cam.id)}>
              <Text style={{ color: cam.status === "connected" ? "#f44336" : "#4CAF50", fontWeight: "700", fontSize: 13 }}>
                {cam.status === "connected" ? "Disconnect" : "Connect"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={[styles.btnPrimary, recording && { backgroundColor: "#f44336" }]} onPress={recording ? stopRecording : startRecording}>
          <Text style={styles.btnPrimaryText}>{recording ? "● STOP RECORDING" : "START RECORDING"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  premiumBadge: { backgroundColor: "#E53935", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  premiumText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  upgradeBanner: { backgroundColor: "#1a1a1a", padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  upgradeText: { color: "#ccc", fontSize: 12, flex: 1, marginRight: 12 },
  upgradeBtn: { backgroundColor: "#E53935", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  upgradeBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  previewGrid: { flexDirection: "row", flexWrap: "wrap", padding: 8, backgroundColor: "#0a0a0a" },
  previewBox: { width: "48%", aspectRatio: 16 / 9, backgroundColor: "#141414", borderRadius: 8, margin: "1%", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#222" },
  previewActive: { borderColor: "#E53935" },
  previewOffline: { backgroundColor: "#0d0d0d" },
  previewLabel: { position: "absolute", top: 8, left: 8, backgroundColor: "#00000080", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  previewLabelText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  previewMeta: { position: "absolute", bottom: 8, right: 8, flexDirection: "row", gap: 8 },
  previewMetaText: { color: "#fff", fontSize: 10, backgroundColor: "#00000080", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  recDot: { position: "absolute", top: 8, right: 8, backgroundColor: "#f44336", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  recText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  offlineOverlay: { alignItems: "center", justifyContent: "center" },
  offlineText: { color: "#666", fontSize: 12, marginTop: 6 },
  connectBtn: { marginTop: 8, backgroundColor: "#E53935", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  connectBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  controlRow: { backgroundColor: "#141414", borderRadius: 12, padding: 14, marginBottom: 16 },
  controlItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  controlLabel: { color: "#ccc", fontSize: 14 },
  camRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#141414", borderRadius: 10, padding: 12, marginBottom: 8 },
  camDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  camName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  camMeta: { color: "#888", fontSize: 12, marginTop: 2 },
  btnPrimary: { backgroundColor: "#E53935", borderRadius: 10, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
