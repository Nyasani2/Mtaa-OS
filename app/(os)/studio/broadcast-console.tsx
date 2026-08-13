import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";

interface Broadcaster {
  id: string; name: string; type: string; verified: boolean; logo_url: string | null;
  description: string | null; member_count: number; stream_count: number; created_at: string;
}

interface BroadcastMember {
  id: string; user_id: string; role: string; full_name: string; avatar_url: string | null; joined_at: string;
}

const BROADCASTER_TYPES = [
  { key: "tv", label: "Television Station", icon: "television" },
  { key: "radio", label: "Radio Station", icon: "radio" },
  { key: "university", label: "University", icon: "university" },
  { key: "school", label: "School", icon: "school" },
  { key: "church", label: "Church", icon: "church" },
  { key: "government", label: "Government Media", icon: "landmark" },
  { key: "sports", label: "Sports Broadcaster", icon: "futbol" },
  { key: "news", label: "News Agency", icon: "newspaper" },
  { key: "event", label: "Event Organizer", icon: "calendar-alt" },
  { key: "corporate", label: "Corporate Media", icon: "building" },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ["All permissions"],
  admin: ["Manage members", "Edit settings", "Schedule streams", "View analytics"],
  producer: ["Schedule streams", "Manage content", "View analytics"],
  presenter: ["Go live", "Manage own content"],
  camera: ["Operate cameras", "Switch feeds"],
  editor: ["Edit recordings", "Create clips", "Manage archives"],
  moderator: ["Moderate chat", "Ban users", "Flag content"],
};

export default function BroadcastConsoleScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"my-networks" | "discover" | "members" | "create">("my-networks");
  const [myNetworks, setMyNetworks] = useState<Broadcaster[]>([]);
  const [discoverNetworks, setDiscoverNetworks] = useState<Broadcaster[]>([]);
  const [members, setMembers] = useState<BroadcastMember[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<Broadcaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createForm, setCreateForm] = useState({ name: "", type: "tv" as string, description: "" });

  useEffect(() => { loadMyNetworks(); }, []);
  useEffect(() => { if (activeTab === "discover") loadDiscover(); }, [activeTab]);
  useEffect(() => { if (selectedNetwork) loadMembers(selectedNetwork.id); }, [selectedNetwork]);

  async function loadMyNetworks() {
    if (!user) return;
    setLoading(true);
    // Step 1: Get broadcaster IDs
    const { data: nodes } = await supabase
      .from("studio_camera_nodes")
      .select("broadcaster_id")
      .eq("user_id", user.id);
    // Step 2: Fetch broadcaster details separately
    const broadcasterIds = (nodes || []).map((r: any) => r.broadcaster_id).filter(Boolean);
    let networks: any[] = [];
    if (broadcasterIds.length > 0) {
      const { data: broadcasters } = await supabase
        .from("studio_broadcasters")
        .select("*")
        .in("id", broadcasterIds);
      networks = broadcasters || [];
    }
    setMyNetworks(networks);
    if (networks.length > 0 && !selectedNetwork) setSelectedNetwork(networks[0]);
    setLoading(false);
  }

  async function loadDiscover() {
    setLoading(true);
    const { data } = await supabase
      .from("studio_broadcasters")
      .select("*")
      .eq("verified", true)
      .order("member_count", { ascending: false })
      .limit(50);
    setDiscoverNetworks(data || []);
    setLoading(false);
  }

  async function loadMembers(networkId: string) {
    const { data } = await supabase
      .from("studio_camera_nodes")
      .select("id, user_id, role, joined_at, user_profiles(full_name, avatar_url)")
      .eq("broadcaster_id", networkId)
      .order("joined_at", { ascending: false });
    const mapped = (data || []).map((m: any) => ({
      id: m.id, user_id: m.user_id, role: m.role,
      full_name: m.user_profiles?.full_name || "Unknown",
      avatar_url: m.user_profiles?.avatar_url, joined_at: m.joined_at,
    }));
    setMembers(mapped);
  }

  async function createNetwork() {
    if (!createForm.name.trim() || !user) return;
    const { data, error } = await supabase
      .from("studio_broadcasters")
      .insert({ name: createForm.name, type: createForm.type, description: createForm.description, creator_id: user.id })
      .select().single();
    if (error) { Alert.alert("Error", error.message); return; }
    await supabase.from("studio_camera_nodes").insert({ broadcaster_id: data.id, user_id: user.id, role: "owner" });
    Alert.alert("Success", `${createForm.name} created!`);
    setCreateForm({ name: "", type: "tv", description: "" });
    setActiveTab("my-networks"); loadMyNetworks();
  }

  async function joinNetwork(networkId: string) {
    if (!user) return;
    const { error } = await supabase.from("studio_camera_nodes").insert({
      broadcaster_id: networkId, user_id: user.id, role: "moderator"
    });
    if (error) { Alert.alert("Error", error.message); return; }
    Alert.alert("Joined", "You are now a member of this network.");
    loadDiscover();
  }

  const filteredDiscover = discoverNetworks.filter((n: any) =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.type.includes(searchQuery.toLowerCase())
  );

  const typeIcon = (type: string) => BROADCASTER_TYPES.find((t: any) => t.key === type)?.icon || "broadcast-tower";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Broadcast Console</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabRow}>
        {(["my-networks", "discover", "members", "create"] as const).map((tab: any) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "my-networks" ? "My Networks" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "my-networks" && (
        loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#E53935" /> :
        <ScrollView contentContainerStyle={styles.scroll}>
          {myNetworks.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="broadcast" size={64} color="#555" />
              <Text style={styles.emptyText}>No broadcast networks yet.</Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => setActiveTab("create")}>
                <Text style={styles.btnPrimaryText}>Create Network</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myNetworks.map((net: any) => (
              <TouchableOpacity key={net.id} style={styles.networkCard} onPress={() => { setSelectedNetwork(net); setActiveTab("members"); }}>
                <View style={styles.networkHeader}>
                  <FontAwesome5 name={typeIcon(net.type)} size={28} color="#E53935" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.networkName}>{net.name} {net.verified && <Feather name="check-circle" size={14} color="#4CAF50" />}</Text>
                    <Text style={styles.networkMeta}>{BROADCASTER_TYPES.find((t: any) => t.key === net.type)?.label} · {net.member_count} members · {net.stream_count} streams</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#888" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === "discover" && (
        <>
          <TextInput style={styles.searchInput} placeholder="Search networks..." placeholderTextColor="#888" value={searchQuery} onChangeText={setSearchQuery} />
          {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#E53935" /> :
          <FlatList data={filteredDiscover} keyExtractor={item => item.id} contentContainerStyle={styles.scroll}
            renderItem={({ item }) => (
              <View style={styles.networkCard}>
                <View style={styles.networkHeader}>
                  <FontAwesome5 name={typeIcon(item.type)} size={28} color="#E53935" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.networkName}>{item.name} {item.verified && <Feather name="check-circle" size={14} color="#4CAF50" />}</Text>
                    <Text style={styles.networkMeta}>{BROADCASTER_TYPES.find((t: any) => t.key === item.type)?.label} · {item.member_count} members</Text>
                    <Text style={styles.networkDesc} numberOfLines={2}>{item.description}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.btnOutline} onPress={() => joinNetwork(item.id)}>
                  <Text style={styles.btnOutlineText}>Join Network</Text>
                </TouchableOpacity>
              </View>
            )}
          />}
        </>
      )}

      {activeTab === "members" && selectedNetwork && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>{selectedNetwork.name} — Members</Text>
          {members.map((m: any) => (
            <View key={m.id} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>{m.full_name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.full_name}</Text>
                <Text style={styles.memberRole}>{m.role.charAt(0).toUpperCase() + m.role.slice(1)}</Text>
                <Text style={styles.memberPerms}>{ROLE_PERMISSIONS[m.role]?.join(" · ")}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {activeTab === "create" && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>Create Broadcast Network</Text>
          <Text style={styles.label}>Network Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Kenya Broadcasting Network" placeholderTextColor="#888" value={createForm.name} onChangeText={t => setCreateForm(p => ({ ...p, name: t }))} />
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeGrid}>
            {BROADCASTER_TYPES.map((t: any) => (
              <TouchableOpacity key={t.key} style={[styles.typeChip, createForm.type === t.key && styles.typeChipActive]} onPress={() => setCreateForm(p => ({ ...p, type: t.key }))}>
                <FontAwesome5 name={t.icon} size={16} color={createForm.type === t.key ? "#fff" : "#ccc"} />
                <Text style={[styles.typeChipText, createForm.type === t.key && styles.typeChipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="What does your network broadcast?" placeholderTextColor="#888" value={createForm.description} onChangeText={t => setCreateForm(p => ({ ...p, description: t }))} />
          <TouchableOpacity style={styles.btnPrimary} onPress={createNetwork}>
            <Text style={styles.btnPrimaryText}>Create Network</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#E53935" },
  tabText: { color: "#888", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#E53935" },
  scroll: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#888", fontSize: 16, marginTop: 16, marginBottom: 24 },
  networkCard: { backgroundColor: "#141414", borderRadius: 12, padding: 16, marginBottom: 12 },
  networkHeader: { flexDirection: "row", alignItems: "center" },
  networkName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  networkMeta: { color: "#888", fontSize: 13, marginTop: 2 },
  networkDesc: { color: "#aaa", fontSize: 13, marginTop: 6 },
  searchInput: { backgroundColor: "#141414", color: "#fff", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, margin: 16, fontSize: 15 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  label: { color: "#aaa", fontSize: 13, fontWeight: "600", marginTop: 16, marginBottom: 6 },
  input: { backgroundColor: "#141414", color: "#fff", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, marginRight: 8 },
  typeChipActive: { backgroundColor: "#E53935" },
  typeChipText: { color: "#ccc", fontSize: 13, marginLeft: 8, fontWeight: "600" },
  typeChipTextActive: { color: "#fff" },
  memberRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#141414", borderRadius: 12, padding: 14, marginBottom: 10 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E53935", alignItems: "center", justifyContent: "center", marginRight: 12 },
  memberInitial: { color: "#fff", fontSize: 18, fontWeight: "700" },
  memberName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  memberRole: { color: "#E53935", fontSize: 12, fontWeight: "700", marginTop: 2, textTransform: "uppercase" },
  memberPerms: { color: "#888", fontSize: 12, marginTop: 2 },
  btnPrimary: { backgroundColor: "#E53935", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnOutline: { borderWidth: 1, borderColor: "#E53935", borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 12 },
  btnOutlineText: { color: "#E53935", fontSize: 14, fontWeight: "600" },
});
