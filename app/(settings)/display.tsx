import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Theme = "dark" | "light" | "auto";
type FontSize = "small" | "medium" | "large";

export default function DisplayScreen() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [language, setLanguage] = useState("English");
  const [animations, setAnimations] = useState(true);

  const languages = ["English", "Swahili", "French"];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Display & Language</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <View style={styles.options}>
          {(["dark", "light", "auto"] as Theme[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.optionBtn, theme === t && styles.optionBtnActive]}
              onPress={() => setTheme(t)}
            >
              <Ionicons
                name={t === "dark" ? "moon-outline" : t === "light" ? "sunny-outline" : "contrast-outline"}
                size={18}
                color={theme === t ? "#fff" : "#94A3B8"}
              />
              <Text style={[styles.optionText, theme === t && styles.optionTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Font Size</Text>
        <View style={styles.options}>
          {(["small", "medium", "large"] as FontSize[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.optionBtn, fontSize === f && styles.optionBtnActive]}
              onPress={() => setFontSize(f)}
            >
              <Text style={[styles.optionText, fontSize === f && styles.optionTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language</Text>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[styles.langRow, language === lang && styles.langRowActive]}
            onPress={() => setLanguage(lang)}
          >
            <Text style={[styles.langText, language === lang && styles.langTextActive]}>{lang}</Text>
            {language === lang && <Ionicons name="checkmark" size={18} color="#6366F1" />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessibility</Text>
        <TouchableOpacity style={styles.toggleRow} onPress={() => setAnimations(!animations)}>
          <Text style={styles.toggleLabel}>Animations</Text>
          <View style={[styles.toggleDot, animations && styles.toggleDotActive]} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#64748B", paddingHorizontal: 16, paddingVertical: 8, textTransform: "uppercase", letterSpacing: 1 },
  options: { flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  optionBtn: { flex: 1, backgroundColor: "#1a1a1a", padding: 12, borderRadius: 12, alignItems: "center", gap: 6 },
  optionBtnActive: { backgroundColor: "#6366F1" },
  optionText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  optionTextActive: { color: "#fff" },
  langRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#1a1a1a", marginHorizontal: 16, marginBottom: 1 },
  langRowActive: { backgroundColor: "#1E1B4B" },
  langText: { color: "#fff", fontSize: 15 },
  langTextActive: { color: "#6366F1", fontWeight: "600" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#1a1a1a", marginHorizontal: 16 },
  toggleLabel: { color: "#fff", fontSize: 15 },
  toggleDot: { width: 48, height: 28, borderRadius: 14, backgroundColor: "#334155", justifyContent: "center", paddingHorizontal: 4 },
  toggleDotActive: { backgroundColor: "#6366F1" },
});
