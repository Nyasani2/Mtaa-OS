// lib/settings/components/SettingsShell.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

interface SettingsSection {
  title: string;
  items: { label: string; action: () => void }[];
}

export default function SettingsShell() {
  const sections: SettingsSection[] = [
    {
      title: "Account",
      items: [
        { label: "Profile", action: () => {} },
        { label: "Security", action: () => {} },
        { label: "Notifications", action: () => {} },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Display", action: () => {} },
        { label: "Language", action: () => {} },
        { label: "Storage", action: () => {} },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      {sections.map((section, i) => (
        <View key={i} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, j) => (
            <TouchableOpacity key={j} style={styles.item} onPress={item.action}>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { fontSize: 24, fontWeight: "bold", color: "#fff", padding: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#888", paddingHorizontal: 16, marginBottom: 8, textTransform: "uppercase" },
  item: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#222" },
  itemLabel: { fontSize: 16, color: "#fff" },
});
