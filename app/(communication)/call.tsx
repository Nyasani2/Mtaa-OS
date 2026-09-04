import React, { useState, useEffect } from "react";
import { Alert, View, Text, TouchableOpacity, StyleSheet, FlatList, Linking, Alert, Platform } from "react-native";
import { Alert, useLocalSearchParams, useRouter } from "expo-router";
import * as Contacts from "expo-contacts";
import { Alert, Ionicons } from "@expo/vector-icons";

interface CallLogItem {
  id: string;
  name: string;
  phone: string;
  type: "incoming" | "outgoing" | "missed";
  timestamp: string;
  duration?: string;
}

export default function CallScreen() {
  const router = useRouter();
  const { phone: dialPhone } = useLocalSearchParams<{ phone?: string }>();
  const [display, setDisplay] = useState(dialPhone || "");
  const [callLogs, setCallLogs] = useState<CallLogItem[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [showLogs, setShowLogs] = useState(true);

  useEffect(() => {
    loadContacts();
    // Call logs require custom native module — show placeholder
    setCallLogs([
      { id: "1", name: "Enable Call Logs", phone: "", type: "missed", timestamp: "Tap to enable", duration: "" },
    ]);
  }, []);

  const loadContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") return;
    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
    const items = data
      .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0 && c.id)
      .map((c) => ({
        id: c.id || `contact-${Math.random().toString(36).substring(2, 9)}`,
        name: c.name || "Unknown",
        phone: c.phoneNumbers?.[0]?.number || "",
      }));
    setContacts(items);
  };

  const handleDial = (digit: string) => {
    setDisplay((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setDisplay((prev) => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (!display) return;
    const cleanPhone = display.replace(/\s/g, "");
    const url = `tel:${cleanPhone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Cannot open dialer");
    }
  };

  const handleContactCall = (phone: string) => {
    setDisplay(phone);
    setShowLogs(false);
  };

  const handleEnableCallLogs = () => {
    Alert.alert(
      "Enable Call Logs",
      "To read your Android call history, install the call log module in Settings > Apps > MTAA > Permissions",
      [{ text: "OK" }]
    );
  };

  const dialPad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phone</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.displayWrap}>
        <Text style={styles.display}>{display}</Text>
        {display.length > 0 && (
          <TouchableOpacity onPress={handleBackspace}>
            <Ionicons name="backspace-outline" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.dialPad}>
        {dialPad.map((row, i) => (
          <View key={i} style={styles.dialRow}>
            {row.map((digit) => (
              <TouchableOpacity key={digit} style={styles.dialBtn} onPress={() => handleDial(digit)}>
                <Text style={styles.dialText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
        <Ionicons name="call" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, showLogs && styles.tabActive]} onPress={() => setShowLogs(true)}>
          <Text style={[styles.tabText, showLogs && styles.tabTextActive]}>Recent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, !showLogs && styles.tabActive]} onPress={() => setShowLogs(false)}>
          <Text style={[styles.tabText, !showLogs && styles.tabTextActive]}>Contacts</Text>
        </TouchableOpacity>
      </View>

      {showLogs ? (
        <FlatList
          data={callLogs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.logRow} onPress={handleEnableCallLogs}>
              <Ionicons name="time-outline" size={20} color="#64748B" />
              <View style={styles.logInfo}>
                <Text style={styles.logName}>{item.name}</Text>
                <Text style={styles.logTime}>{item.timestamp}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.contactRow} onPress={() => handleContactCall(item.phone)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactPhone}>{item.phone}</Text>
              </View>
              <Ionicons name="call-outline" size={18} color="#6366F1" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No contacts</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  displayWrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingVertical: 20, gap: 12 },
  display: { color: "#fff", fontSize: 32, fontWeight: "300", flex: 1, textAlign: "center" },
  dialPad: { paddingHorizontal: 40, gap: 12 },
  dialRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  dialBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center" },
  dialText: { color: "#fff", fontSize: 24, fontWeight: "600" },
  callBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center", alignSelf: "center", marginVertical: 16 },
  tabs: { flexDirection: "row", justifyContent: "center", gap: 24, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#1a1a1a" },
  tab: { paddingHorizontal: 16, paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#6366F1" },
  tabText: { color: "#64748B", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#6366F1" },
  logRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a", gap: 12 },
  logInfo: { flex: 1 },
  logName: { color: "#fff", fontSize: 15 },
  logTime: { color: "#64748B", fontSize: 12, marginTop: 2 },
  contactRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#334155", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  contactPhone: { color: "#64748B", fontSize: 13 },
  emptyText: { color: "#64748B", textAlign: "center", marginTop: 40 },
});
