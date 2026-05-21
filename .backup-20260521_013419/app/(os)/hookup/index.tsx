import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

const actions: QuickAction[] = [
  { id: "chat", label: "Chat", icon: "chatbubble", route: "/(hookup)/chat", color: "#6366F1" },
  { id: "discover", label: "Discover", icon: "compass", route: "/(hookup)/discover", color: "#EC4899" },
  { id: "rooms", label: "Rooms", icon: "people", route: "/(hookup)/rooms", color: "#10B981" },
  { id: "profile", label: "Profile", icon: "person", route: "/(hookup)/profile", color: "#F59E0B" },
];

export default function HookupHome() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hookup</Text>
        <Text style={styles.subtitle}>Connect. Chat. Discover.</Text>
      </View>

      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.card, { borderColor: action.color + "40" }]}
            onPress={() => router.push(action.route as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: action.color + "20" }]}>
              <Ionicons name={action.icon} size={28} color={action.color} />
            </View>
            <Text style={styles.cardLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Rooms</Text>
        <TouchableOpacity style={styles.roomCard} onPress={() => router.push("/(hookup)/rooms" as any)}>
          <View style={styles.roomIcon}>
            <Ionicons name="people" size={20} color="#10B981" />
          </View>
          <View style={styles.roomInfo}>
            <Text style={styles.roomName}>General Lobby</Text>
            <Text style={styles.roomMeta}>124 online • Public</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Chats</Text>
        <TouchableOpacity style={styles.chatCard} onPress={() => router.push("/(hookup)/chat" as any)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.chatInfo}>
            <Text style={styles.chatName}>Alex</Text>
            <Text style={styles.chatPreview}>Hey, are you joining the room?</Text>
          </View>
          <Text style={styles.chatTime}>2m</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: "47%",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
  },
  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  roomIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#10B98120",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  roomMeta: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 2,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  chatPreview: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 2,
  },
  chatTime: {
    color: "#64748B",
    fontSize: 12,
  },
});
