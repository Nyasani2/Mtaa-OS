import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWalletStore } from "@/lib/modules/wallet/store";
import { ArrowLeft, Shield, Bell, Eye, Lock, Fingerprint, ChevronRight, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function WalletSettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, linkedBanks, linkedCards, removeLinkedBank, removeLinkedCard } = useWalletStore();

  const [biometric, setBiometric] = useState(settings.biometricEnabled);
  const [notifications, setNotifications] = useState(settings.notificationsEnabled);
  const [hideBalance, setHideBalance] = useState(settings.hideBalance);
  const [autoRepay, setAutoRepay] = useState(settings.autoRepayGoFund);

  const handleToggle = (key: string, value: boolean) => {
    switch (key) {
      case "biometric": setBiometric(value); updateSettings({ biometricEnabled: value }); break;
      case "notifications": setNotifications(value); updateSettings({ notificationsEnabled: value }); break;
      case "hideBalance": setHideBalance(value); updateSettings({ hideBalance: value }); break;
      case "autoRepay": setAutoRepay(value); updateSettings({ autoRepayGoFund: value }); break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIcon}><Shield size={18} color="#3B82F6" /></View>
              <Text style={styles.rowText}>Biometric Login</Text>
              <Switch value={biometric} onValueChange={(v) => handleToggle("biometric", v)} />
            </View>
            <View style={styles.row}>
              <View style={styles.rowIcon}><Lock size={18} color="#8B5CF6" /></View>
              <Text style={styles.rowText}>Hide Balance</Text>
              <Switch value={hideBalance} onValueChange={(v) => handleToggle("hideBalance", v)} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIcon}><Bell size={18} color="#F59E0B" /></View>
              <Text style={styles.rowText}>Notifications</Text>
              <Switch value={notifications} onValueChange={(v) => handleToggle("notifications", v)} />
            </View>
            <View style={styles.row}>
              <View style={styles.rowIcon}><Eye size={18} color="#10B981" /></View>
              <Text style={styles.rowText}>Auto-Repay GoFund</Text>
              <Switch value={autoRepay} onValueChange={(v) => handleToggle("autoRepay", v)} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Linked Banks</Text>
          <View style={styles.card}>
            {linkedBanks.length === 0 ? (
              <Text style={styles.emptyText}>No linked banks</Text>
            ) : (
              linkedBanks.map((bank) => (
                <View key={bank.id} style={styles.linkedRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.linkedName}>{bank.name}</Text>
                    <Text style={styles.linkedDetail}>{bank.bankName} - {bank.accountName} - {bank.accountNumber}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeLinkedBank(bank.id)}>
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Linked Cards</Text>
          <View style={styles.card}>
            {linkedCards.length === 0 ? (
              <Text style={styles.emptyText}>No linked cards</Text>
            ) : (
              linkedCards.map((card) => (
                <View key={card.id} style={styles.linkedRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.linkedName}>{card.brand} {card.cardType}</Text>
                    <Text style={styles.linkedDetail}>**** {card.last4} | Exp {card.expiryMonth}/{card.expiryYear}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeLinkedCard(card.id)}>
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#6B7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { backgroundColor: "#FFF", borderRadius: 16, padding: 4 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1F2937" },
  linkedRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  linkedName: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  linkedDetail: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  emptyText: { fontSize: 14, color: "#9CA3AF", padding: 16, textAlign: "center" },
});
