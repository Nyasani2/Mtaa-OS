// app/(os)/coming-soon.tsx — Reusable Coming Soon Screen
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Clock, Sparkles } from "lucide-react-native";

export default function ComingSoonScreen() {
  const router = useRouter();
  const { appName } = useLocalSearchParams<{ appName?: string }>();
  const name = appName || "This Feature";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Clock size={48} color="#FFD700" />
        </View>
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          {name} is under development and will be available in the next MTAA OS update.
        </Text>
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Sparkles size={16} color="#4ECDC4" />
            <Text style={styles.featureText}>Built by ASIS AI</Text>
          </View>
          <View style={styles.featureItem}>
            <Sparkles size={16} color="#4ECDC4" />
            <Text style={styles.featureText}>Community tested</Text>
          </View>
          <View style={styles.featureItem}>
            <Sparkles size={16} color="#4ECDC4" />
            <Text style={styles.featureText}>Secure by design</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,215,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(255,215,0,0.3)",
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFF", marginBottom: 12 },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  features: { gap: 12, marginBottom: 40 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  backButton: {
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  backButtonText: { color: "#FFD700", fontSize: 16, fontWeight: "600" },
});
