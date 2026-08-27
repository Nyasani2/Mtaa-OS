import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from "@expo/vector-icons";

interface SettingsItem {
  label: string;
  icon: string;
  route?: string;
  toggle?: boolean;
  value?: boolean;
  onToggle?: (val: boolean) => void;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export default function SettingsShell() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login" as any);
  };

  const sections: SettingsSection[] = [
    {
      title: "Account",
      items: [
        { label: "Profile", icon: "person-outline", route: "/settings/profile" },
        { label: "Security", icon: "shield-checkmark-outline", route: "/settings/security" },
        { label: "Notifications", icon: "notifications-outline", route: "/settings/notifications" },
        { label: "Wallet", icon: "wallet-outline", route: "/wallet" },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Display & Language", icon: "tv-outline", route: "/settings/display" },
        { label: "Storage", icon: "server-outline", route: "/settings/storage" },
        { label: "AppStore", icon: "apps-outline", route: "/appstore" },
      ],
    },
    {
      title: "About",
      items: [
        { label: "Version", icon: "information-circle-outline" },
        { label: "Terms of Service", icon: "document-text-outline" },
        { label: "Privacy Policy", icon: "lock-closed-outline" },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || "?"}</Text>
        </View>
        <Text style={styles.name}>{user?.user_metadata?.full_name || user?.email || "User"}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>
      </View>

      {sections.map((section, i) => (
        <View key={i} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, j) => (
            <TouchableOpacity
              key={j}
              style={styles.item}
              onPress={() => {
                if (item.route) router.push(item.route as any);
              }}
              disabled={!item.route}
            >
              <View style={styles.itemLeft}>
                <Ionicons name={item.icon as any} size={20} color="#6366F1" />
                <Text style={styles.itemLabel}>{item.label}</Text>
              </View>
              {item.route && <Ionicons name="chevron-forward" size={16} color="#64748B" />}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>MTAA OS v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { alignItems: "center", paddingVertical: 32, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { color: "#fff", fontSize: 18, fontWeight: "600" },
  email: { color: "#94A3B8", fontSize: 14, marginTop: 4 },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#64748B", paddingHorizontal: 16, paddingVertical: 8, textTransform: "uppercase", letterSpacing: 1 },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#1a1a1a", marginHorizontal: 12, marginBottom: 1, borderRadius: 8 },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemLabel: { color: "#fff", fontSize: 15 },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 24, marginBottom: 16, padding: 14, backgroundColor: "#1a1a1a", borderRadius: 12 },
  signOutText: { color: "#EF4444", fontSize: 16, fontWeight: "600" },
  version: { textAlign: "center", color: "#64748B", fontSize: 12, marginBottom: 32 },
});
