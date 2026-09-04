import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts";
import { Ionicons } from '@expo/vector-icons';

interface ContactItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export default function ContactsShell() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Contacts access is needed to show your contacts");
      setLoading(false);
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
    });

    const items: ContactItem[] = data
      .filter((c) => c.id)
      .map((c) => ({
        id: c.id || `contact-${Math.random().toString(36).substring(2, 9)}`,
        name: c.name || "Unknown",
        phone: c.phoneNumbers?.[0]?.number,
        email: c.emails?.[0]?.email,
      }));

    setContacts(items);
    setLoading(false);
  };

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = (contact: ContactItem) => {
    router.push({
      pathname: "/communication/chat",
      params: { contactId: contact.id, name: contact.name, phone: contact.phone },
    } as any);
  };

  const handleAddToMTAA = (contact: ContactItem) => {
    Alert.alert("Add to MTAA", `Invite ${contact.name} to join MTAA?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Invite", onPress: () => {
        Alert.alert("Sent", "Invitation sent via SMS");
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.contactRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone || item.email || ""}</Text>
            </View>
            <View style={styles.actions}>
              {item.phone && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(item.phone!)}>
                  <Ionicons name="call-outline" size={18} color="#22C55E" />
                </TouchableOpacity>
              )}
              {item.phone && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleMessage(item)}>
                  <Ionicons name="chatbubble-outline" size={18} color="#6366F1" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleAddToMTAA(item)}>
                <Ionicons name="person-add-outline" size={18} color="#F59E0B" />
              </TouchableOpacity>
            </View>
          </View>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a1a", marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, color: "#fff", fontSize: 15, marginLeft: 8 },
  contactRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#334155", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  contactPhone: { color: "#64748B", fontSize: 13, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#64748B", textAlign: "center", marginTop: 40, fontSize: 15 },
});
