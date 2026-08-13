import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts";
import { Ionicons } from "@expo/vector-icons";

interface ContactItem {
  id: string;
  name: string;
  phone?: string;
  image?: string;
}

export default function MessagesShell() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [smsPermission, setSmsPermission] = useState(false);

  useEffect(() => {
    loadContacts();
    checkSmsPermission();
  }, []);

  const loadContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      setLoading(false);
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
    });

    const items: ContactItem[] = data
      .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0 && c.id)
      .map((c) => ({
        id: c.id || `contact-${Math.random().toString(36).substring(2, 9)}`,
        name: c.name || "Unknown",
        phone: c.phoneNumbers?.[0]?.number,
        image: c.image?.uri,
      }));

    setContacts(items);
    setLoading(false);
  };

  const checkSmsPermission = async () => {
    // expo-sms doesn't have inbox reading — this is a placeholder for custom module
    setSmsPermission(false);
  };

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const handleNewMessage = () => {
    router.push("/communication/new-message" as any);
  };

  const handleContactPress = (contact: ContactItem) => {
    router.push({
      pathname: "/communication/chat" as any,
      params: { contactId: contact.id, name: contact.name, phone: contact.phone },
    });
  };

  const handleEnableSms = () => {
    Alert.alert(
      "Enable SMS Inbox",
      "To read your Android SMS history, enable SMS permissions in Settings > Apps > MTAA > Permissions",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newBtn} onPress={handleNewMessage}>
          <Ionicons name="create-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {!smsPermission && Platform.OS === "android" && (
        <TouchableOpacity style={styles.banner} onPress={handleEnableSms}>
          <Ionicons name="chatbubble-outline" size={18} color="#6366F1" />
          <Text style={styles.bannerText}>Enable SMS inbox to see message history</Text>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.contactRow} onPress={() => handleContactPress(item)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>Loading contacts...</Text>
          ) : (
            <Text style={styles.emptyText}>No contacts found</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  newBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a1a", marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, color: "#fff", fontSize: 15, marginLeft: 8 },
  banner: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E1B4B", marginHorizontal: 16, padding: 12, borderRadius: 12, marginBottom: 12, gap: 8 },
  bannerText: { flex: 1, color: "#6366F1", fontSize: 13, fontWeight: "600" },
  contactRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#334155", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  contactPhone: { color: "#64748B", fontSize: 13, marginTop: 2 },
  emptyText: { color: "#64748B", textAlign: "center", marginTop: 40, fontSize: 15 },
});

