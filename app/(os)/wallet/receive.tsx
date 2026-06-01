"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, RefreshControl, Share,
} from "react-native";
import { useAuthStore } from "@/hooks/useAuthStore";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  ArrowLeft, DollarSign, QrCode, Share2, Copy, Clock,
  CheckCircle, XCircle, Plus, ChevronRight,
} from "lucide-react-native";

interface PaymentRequest {
  id: string;
  requester_id: string;
  payer_id: string | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "cancelled" | "expired";
  description: string;
  qr_code_id: string | null;
  created_at: string;
  paid_at: string | null;
}

export default function ReceiveMoneyScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  }, [fetchRequests]);

  const createRequest = async () => {
    if (!user?.id || !amount.trim()) {
      Alert.alert("Required", "Amount is required");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .insert({
          requester_id: user.id,
          amount: parseFloat(amount),
          currency: "KES",
          description: description || "Payment request",
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Generate QR for this request
      await supabase.functions.invoke("qr-generate", {
        body: {
          entity_type: "user",
          entity_id: user.id,
          owner_id: user.id,
          qr_name: `Payment Request ${data.id.slice(0, 8)}`,
          is_static: false,
          default_action: "pay",
          prefilled_amount: parseFloat(amount),
          prefilled_currency: "KES",
          prefilled_description: description || "Payment request",
          max_scans: null,
        },
      });

      Alert.alert("Created", "Payment request created. Share the QR or link.");
      setShowCreate(false);
      setAmount("");
      setDescription("");
      fetchRequests();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setCreating(false);
    }
  };

  const shareRequest = (req: PaymentRequest) => {
    Share.share({
      message: `Pay me KES ${req.amount} on MTAA. Request: ${req.description}`,
      title: "Payment Request",
    });
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "paid": return "#22c55e";
      case "pending": return "#f59e0b";
      case "cancelled": return "#ef4444";
      case "expired": return "#6b7280";
      default: return "#6b7280";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ padding: 16, paddingTop: 24, backgroundColor: "#1e293b", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#f8fafc" }}>Receive Money</Text>
        <TouchableOpacity onPress={() => setShowCreate(!showCreate)}>
          <Plus size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />} contentContainerStyle={{ padding: 16 }}>
        {showCreate && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#f1f5f9", marginBottom: 16 }}>Request Payment</Text>
            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Amount (KES)</Text>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#475569" style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 12 }} />
            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Description</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="What is this for?" placeholderTextColor="#475569" style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 16 }} />
            <TouchableOpacity onPress={createRequest} disabled={creating} style={{ backgroundColor: "#3b82f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Create Request</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={{ fontSize: 16, fontWeight: "600", color: "#94a3b8", marginBottom: 12 }}>My Payment Requests</Text>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : requests.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <DollarSign size={48} color="#334155" />
            <Text style={{ color: "#475569", marginTop: 16 }}>No payment requests</Text>
          </View>
        ) : (
          requests.map((req) => (
            <View key={req.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#f1f5f9" }}>KES {req.amount.toFixed(2)}</Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: getStatusColor(req.status) + "20" }}>
                  <Text style={{ fontSize: 11, color: getStatusColor(req.status), textTransform: "capitalize" }}>{req.status}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>{req.description}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {req.status === "pending" && (
                  <TouchableOpacity onPress={() => shareRequest(req)} style={{ backgroundColor: "#334155", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Share2 size={14} color="#3b82f6" />
                    <Text style={{ fontSize: 12, color: "#3b82f6" }}>Share</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
