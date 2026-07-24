import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, TextInput, Modal, Alert
} from "react-native";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  MapPin, Phone, Star, Search, X, CheckCircle, UserPlus, DollarSign, ArrowLeft
} from "lucide-react-native";

interface Agent {
  id: string;
  user_id: string;
  business_name: string;
  location: string;
  phone: string;
  rating: number;
  commission_rate: number;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
}

export default function AgentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showDeposit, setShowDeposit] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      // FIXED: agents -> cashpoint_agents (per schema)
      const { data, error } = await supabase
        .from("cashpoint_agents")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(50);

      if (error) throw error;
      setAgents(data || []);
    } catch (err) {
      console.error("Fetch agents error:", err);
      Alert.alert("Error", "Failed to load agents");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const onRefresh = () => { setRefreshing(true); fetchAgents(); };

  const handleDeposit = async () => {
    if (!selectedAgent || !depositAmount || !user?.id) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    setDepositing(true);
    try {
      // Create transaction
      const { error: txError } = await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        amount,
        type: "debit",
        status: "completed",
        description: `Deposit via agent ${selectedAgent.business_name}`,
        reference_type: "agent_deposit",
        reference_id: selectedAgent.id,
      });

      if (txError) throw txError;

      // Update agent stats
      await supabase.from("cashpoint_agents").update({
        total_transactions: supabase.rpc("increment", { x: 1 }),
        total_volume: supabase.rpc("increment", { x: amount }),
      }).eq("id", selectedAgent.id);

      Alert.alert("Success", `KSh ${amount.toLocaleString()} deposited successfully`);
      setShowDeposit(false);
      setDepositAmount("");
      setSelectedAgent(null);
    } catch (err: any) {
      Alert.alert("Deposit Failed", err.message || "Please try again");
    } finally {
      setDepositing(false);
    }
  };

  const filteredAgents = agents.filter(a =>
    a.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.location?.toLowerCase().includes(search.toLowerCase())
  );

  const renderAgent = (agent: Agent) => (
    <TouchableOpacity
      key={agent.id}
      style={styles.agentCard}
      onPress={() => { setSelectedAgent(agent); setShowDeposit(true); }}
    >
      <View style={styles.agentHeader}>
        <View style={styles.agentIcon}>
          <UserPlus size={20} color="#fff" />
        </View>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{agent.business_name}</Text>
          <View style={styles.agentMeta}>
            <MapPin size={12} color="#64748b" />
            <Text style={styles.agentLocation}>{agent.location}</Text>
          </View>
        </View>
        <View style={styles.agentRating}>
          <Star size={12} color="#f59e0b" fill="#f59e0b" />
          <Text style={styles.ratingText}>{agent.rating?.toFixed(1) || "0.0"}</Text>
        </View>
      </View>
      <View style={styles.agentFooter}>
        <View style={styles.agentDetail}>
          <Phone size={12} color="#64748b" />
          <Text style={styles.detailText}>{agent.phone}</Text>
        </View>
        <View style={styles.agentDetail}>
          <DollarSign size={12} color="#10b981" />
          <Text style={styles.detailText}>{agent.commission_rate}% fee</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CashPoint Agents</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        <View style={styles.searchContainer}>
          <Search size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search agents by name or location..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.becomeAgentCard}>
          <Text style={styles.becomeAgentTitle}>Become an Agent</Text>
          <Text style={styles.becomeAgentDesc}>
            Register as an MTAA agent, offer financial services, and earn commission on every transaction.
          </Text>
          <TouchableOpacity style={styles.applyBtn} onPress={() => router.push("/(os)/wallet/agent-register")}>
            <Text style={styles.applyBtnText}>Apply Now</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>NEARBY AGENTS</Text>

        {loading && !refreshing ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#10b981" />
        ) : filteredAgents.length === 0 ? (
          <View style={styles.empty}>
            <MapPin size={40} color="#475569" />
            <Text style={styles.emptyText}>No agents found</Text>
            <Text style={styles.emptySub}>Try a different search or check back later</Text>
          </View>
        ) : (
          filteredAgents.map(renderAgent)
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Deposit Modal */}
      <Modal visible={showDeposit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deposit via {selectedAgent?.business_name}</Text>
              <TouchableOpacity onPress={() => setShowDeposit(false)}>
                <X size={24} color="#f8fafc" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Amount (KSh)</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#64748b"
              value={depositAmount}
              onChangeText={setDepositAmount}
            />
            <TouchableOpacity
              style={[styles.depositBtn, depositing && styles.depositBtnDisabled]}
              onPress={handleDeposit}
              disabled={depositing}
            >
              {depositing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.depositBtnText}>Confirm Deposit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#f8fafc" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#1e293b", margin: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: "#334155" },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 14 },
  becomeAgentCard: { margin: 16, marginTop: 0, padding: 20, backgroundColor: "#1e293b", borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  becomeAgentTitle: { fontSize: 16, fontWeight: "700", color: "#f8fafc" },
  becomeAgentDesc: { fontSize: 13, color: "#94a3b8", textAlign: "center", marginTop: 8, lineHeight: 20 },
  applyBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#10b981", borderRadius: 10 },
  applyBtnText: { color: "#0f172a", fontWeight: "700", fontSize: 14 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#94a3b8", marginHorizontal: 16, marginTop: 8, marginBottom: 12, letterSpacing: 0.5 },
  agentCard: { backgroundColor: "#1e293b", marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "#334155" },
  agentHeader: { flexDirection: "row", alignItems: "center" },
  agentIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#10b981", justifyContent: "center", alignItems: "center", marginRight: 12 },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 15, fontWeight: "600", color: "#f8fafc" },
  agentMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  agentLocation: { fontSize: 12, color: "#64748b" },
  agentRating: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f59e0b15", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: "600", color: "#f59e0b" },
  agentFooter: { flexDirection: "row", gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#334155" },
  agentDetail: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 12, color: "#94a3b8" },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#94a3b8", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "#000000aa", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#1e293b", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#f8fafc", flex: 1 },
  modalLabel: { fontSize: 13, color: "#94a3b8", marginBottom: 8 },
  amountInput: { backgroundColor: "#0f172a", borderRadius: 12, padding: 16, color: "#f8fafc", fontSize: 24, fontWeight: "700", textAlign: "center", borderWidth: 1, borderColor: "#334155" },
  depositBtn: { marginTop: 20, padding: 16, backgroundColor: "#10b981", borderRadius: 12, alignItems: "center" },
  depositBtnDisabled: { backgroundColor: "#334155" },
  depositBtnText: { color: "#0f172a", fontSize: 16, fontWeight: "700" },
});
