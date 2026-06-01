"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { useAuthStore } from "@/hooks/useAuthStore";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  ArrowLeft, MapPin, Phone, Star, DollarSign, ArrowDownLeft,
  ArrowUpRight, Shield, User, Search, ChevronRight,
} from "lucide-react-native";

interface Agent {
  id: string;
  business_name: string;
  agent_level: number;
  location: string;
  lat: number | null;
  lng: number | null;
  services: string[];
  phone: string;
  is_active: boolean;
  rating: number;
  cash_float: number;
}

export default function AgentBankingScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
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
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(50);
      if (error) throw error;
      setAgents(data || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAgents();
    setRefreshing(false);
  }, [fetchAgents]);

  const handleDeposit = async () => {
    if (!user?.id || !selectedAgent || !depositAmount.trim()) return;
    setDepositing(true);
    try {
      // Create wallet transaction
      const { error: txError } = await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "debit",
        amount: parseFloat(depositAmount),
        currency: "KES",
        status: "completed",
        description: `Agent deposit at ${selectedAgent.business_name}`,
        reference_id: selectedAgent.id,
        reference_type: "agent",
      });
      if (txError) throw txError;

      // Update agent float
      await supabase.from("agents").update({
        cash_float: selectedAgent.cash_float + parseFloat(depositAmount),
      }).eq("id", selectedAgent.id);

      Alert.alert("Success", `Deposited KES ${depositAmount} via ${selectedAgent.business_name}`);
      setShowDeposit(false);
      setDepositAmount("");
      setSelectedAgent(null);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setDepositing(false);
    }
  };

  const filtered = agents.filter(a =>
    a.business_name.toLowerCase().includes(search.toLowerCase()) ||
    a.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ padding: 16, paddingTop: 24, backgroundColor: "#1e293b", flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#f8fafc" }}>Agent Banking</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />} contentContainerStyle={{ padding: 16 }}>
        {/* Search */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1e293b", borderRadius: 12, paddingHorizontal: 14, marginBottom: 16 }}>
          <Search size={18} color="#64748b" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Find agent by name or location"
            placeholderTextColor="#475569"
            style={{ flex: 1, padding: 14, color: "#f1f5f9", fontSize: 14 }}
          />
        </View>

        {/* Deposit Modal */}
        {showDeposit && selectedAgent && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#f1f5f9", marginBottom: 12 }}>
              Deposit at {selectedAgent.business_name}
            </Text>
            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Amount (KES)</Text>
            <TextInput
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 16, marginBottom: 16 }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setShowDeposit(false)} style={{ flex: 1, backgroundColor: "#334155", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#cbd5e1" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeposit} disabled={depositing} style={{ flex: 1, backgroundColor: "#22c55e", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
                {depositing ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Deposit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Agent List */}
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#94a3b8", marginBottom: 12 }}>Nearby Agents</Text>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <MapPin size={48} color="#334155" />
            <Text style={{ color: "#475569", marginTop: 16 }}>No agents found</Text>
          </View>
        ) : (
          filtered.map((agent) => (
            <View key={agent.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#f1f5f9" }}>{agent.business_name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Star size={14} color="#f59e0b" />
                  <Text style={{ fontSize: 12, color: "#f59e0b" }}>{agent.rating.toFixed(1)}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <MapPin size={14} color="#64748b" />
                <Text style={{ fontSize: 13, color: "#94a3b8" }}>{agent.location}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Shield size={14} color="#22c55e" />
                <Text style={{ fontSize: 12, color: "#22c55e" }}>Level {agent.agent_level} Agent</Text>
                <Text style={{ fontSize: 12, color: "#64748b" }}>Float: KES {agent.cash_float.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => { setSelectedAgent(agent); setShowDeposit(true); }}
                  style={{ backgroundColor: "#22c55e", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <ArrowDownLeft size={14} color="#fff" />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>Deposit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: "#334155", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <ArrowUpRight size={14} color="#ef4444" />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#ef4444" }}>Withdraw</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: "#334155", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
                >
                  <Phone size={14} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
