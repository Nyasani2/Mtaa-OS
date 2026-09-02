// @ts-nocheck
import { supabase } from '@/lib/supabase';
import React, { useEffect,  useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface RecentItem {
  id: string;
  type: "call" | "message" | "transaction" | "app";
  title: string;
  subtitle: string;
  time: string;
  icon: string;
  iconColor: string;
  route?: string;
}

const FALLBACK_RECENTS: RecentItem[] = [
  { id: "1", type: "call", title: "John Doe", subtitle: "Outgoing call • 2:34", time: "2 min ago", icon: "call", iconColor: "#22C55E" },
  { id: "2", type: "transaction", title: "Sent KSh 500", subtitle: "To Jane Smith", time: "15 min ago", icon: "wallet", iconColor: "#6366F1", route: "/wallet/history" },
  { id: "3", type: "message", title: "Jane Smith", subtitle: "Hey, are you coming?", time: "30 min ago", icon: "chatbubble", iconColor: "#3B82F6" },
  { id: "4", type: "app", title: "Opened MTaxi", subtitle: "Booked a ride to CBD", time: "1 hr ago", icon: "car", iconColor: "#F59E0B", route: "/mtaxi" },
  { id: "5", type: "transaction", title: "Received KSh 1,200", subtitle: "From Mike Brown", time: "3 hrs ago", icon: "wallet", iconColor: "#22C55E", route: "/wallet/history" },
];

export default function RecentsShell() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "calls" | "messages" | "transactions">("all");

  const [recents, setRecents] = useState(FALLBACK_RECENTS);
  useEffect(() => {
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10).then(({ data }) => {
      if (data && data.length > 0) setRecents(data.map((l: any) => ({ id: l.id, type: l.action_type || 'app', title: l.title || 'Activity', subtitle: l.description || '', time: 'now', icon: 'alert', iconColor: '#6366F1' })));
    });
  }, []);
  const filtered = filter === "all" ? recents : recents.filter((r) => {
    if (filter === "calls") return r.type === "call";
    if (filter === "messages") return r.type === "message";
    if (filter === "transactions") return r.type === "transaction";
    return true;
  });

  const handlePress = (item: RecentItem) => {
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const handleClear = () => {
    // In production, clear from storage
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recents</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {(["all", "calls", "messages", "transactions"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.recentRow} onPress={() => handlePress(item)}>
            <View style={[styles.iconWrap, { backgroundColor: item.iconColor + "20" }]}>
              <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle}>{item.title}</Text>
              <Text style={styles.recentSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.recentTime}>{item.time}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  clearText: { color: "#EF4444", fontSize: 14, fontWeight: "600" },
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterChip: { backgroundColor: "#1a1a1a", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  filterChipActive: { backgroundColor: "#6366F1" },
  filterText: { color: "#94A3B8", fontSize: 12 },
  filterTextActive: { color: "#fff", fontWeight: "600" },
  recentRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  recentInfo: { flex: 1, marginLeft: 12 },
  recentTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  recentSubtitle: { color: "#64748B", fontSize: 12, marginTop: 2 },
  recentTime: { color: "#64748B", fontSize: 12 },
});
