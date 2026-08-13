import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Shield, Eye, Fingerprint, Moon, Globe, ChevronRight } from "lucide-react-native";
import { useAuthStore } from "@/lib/auth/store/auth.store";

export default function WalletSettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);

  const settingsItems = [
    { icon: Bell, label: "Notifications", value: notifications, onToggle: setNotifications },
    { icon: Shield, label: "Security & PIN", action: () => router.push("/(os)/settings/security" as any) },
    { icon: Eye, label: "Hide Balance", value: hideBalance, onToggle: setHideBalance },
    { icon: Fingerprint, label: "Biometric Auth", value: biometric, onToggle: setBiometric },
    { icon: Moon, label: "Dark Mode", value: darkMode, onToggle: setDarkMode },
    { icon: Globe, label: "Currency", value: "KES", action: () => Alert.alert("Currency", "Currently set to Kenyan Shilling (KES)") },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#f8fafc"/></TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet Settings</Text>
        <View style={{width:24}}/>
      </View>
      <ScrollView>
        <View style={styles.section}>
          {settingsItems.map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.row} onPress={item.action || (() => {})} disabled={!!item.onToggle}>
              <View style={styles.rowLeft}><item.icon size={20} color="#94a3b8"/><Text style={styles.rowLabel}>{item.label}</Text></View>
              {item.onToggle ? <Switch value={item.value} onValueChange={item.onToggle} trackColor={{false:"#334155",true:"#10b981"}} thumbColor={item.value?"#fff":"#94a3b8"}/> : <View style={styles.rowRight}><Text style={styles.rowValue}>{item.value}</Text><ChevronRight size={16} color="#64748b"/></View>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#f8fafc" },
  section: { marginTop: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: 15, color: "#f8fafc", fontWeight: "500" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowValue: { fontSize: 14, color: "#94a3b8" },
});
