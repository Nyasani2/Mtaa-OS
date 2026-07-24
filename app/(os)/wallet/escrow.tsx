"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useIdentity } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Lock,
  Unlock,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Shield,
  QrCode,
  Plus,
  ChevronRight,
} from "lucide-react-native";

interface EscrowTransaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: "pending" | "funded" | "held" | "released" | "disputed" | "refunded";
  description: string;
  goods_description: string | null;
  qr_code_id: string | null;
  created_at: string;
  funded_at: string | null;
  released_at: string | null;
  released_by: string | null;
}

export default function EscrowScreen() {
  const { user } = useIdentity();
  const router = useRouter();
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form
  const [sellerId, setSellerId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [goodsDesc, setGoodsDesc] = useState("");

  const fetchEscrows = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("escrow_transactions")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEscrows(data || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEscrows();
  }, [fetchEscrows]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEscrows();
    setRefreshing(false);
  }, [fetchEscrows]);

  const createEscrow = async () => {
    if (!user?.id || !sellerId.trim() || !amount.trim()) {
      Alert.alert("Required", "Seller ID and amount are required");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("escrow_transactions")
        .insert({
          buyer_id: user.id,
          seller_id: sellerId.trim(),
          amount: parseFloat(amount),
          currency: "KES",
          status: "pending",
          description: description || "Escrow transaction",
          goods_description: goodsDesc || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate QR for this escrow
      await supabase.functions.invoke("qr-generate", {
        body: {
          entity_type: "escrow",
          entity_id: data.id,
          owner_id: user.id,
          qr_name: `Escrow #${data.id.slice(0, 8)}`,
          is_static: false,
          default_action: "release",
          prefilled_amount: parseFloat(amount),
          prefilled_currency: "KES",
          prefilled_description: goodsDesc || "Escrow release",
          max_scans: 1,
        },
      });

      Alert.alert("Success", "Escrow created. Fund it to activate.");
      setShowCreate(false);
      setSellerId("");
      setAmount("");
      setDescription("");
      setGoodsDesc("");
      fetchEscrows();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setCreating(false);
    }
  };

  const releaseEscrow = async (escrow: EscrowTransaction) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from("escrow_transactions")
        .update({
          status: "released",
          released_at: new Date().toISOString(),
          released_by: user.id,
        })
        .eq("id", escrow.id)
        .eq("status", "held");

      if (error) throw error;

      // Create wallet transaction for seller
      await supabase.from("wallet_transactions").insert({
        user_id: escrow.seller_id,
        type: "credit",
        amount: escrow.amount,
        currency: escrow.currency,
        status: "completed",
        description: `Escrow released: ${escrow.description}`,
        reference_id: escrow.id,
        reference_type: "escrow",
      });

      Alert.alert("Released", "Funds transferred to seller");
      fetchEscrows();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "released": return "#22c55e";
      case "held": return "#3b82f6";
      case "funded": return "#f59e0b";
      case "pending": return "#6b7280";
      case "disputed": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "released": return <CheckCircle size={18} color="#22c55e" />;
      case "held": return <Lock size={18} color="#3b82f6" />;
      case "funded": return <DollarSign size={18} color="#f59e0b" />;
      case "pending": return <Clock size={18} color="#6b7280" />;
      case "disputed": return <XCircle size={18} color="#ef4444" />;
      default: return <Clock size={18} color="#6b7280" />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Header */}
      <View style={{ padding: 16, paddingTop: 24, backgroundColor: "#1e293b", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#f8fafc" }}>Escrow</Text>
        <TouchableOpacity onPress={() => setShowCreate(!showCreate)}>
          <Plus size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Create Form */}
        {showCreate && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#f1f5f9", marginBottom: 16 }}>Create Escrow</Text>

            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Seller ID (UUID)</Text>
            <TextInput
              value={sellerId}
              onChangeText={setSellerId}
              placeholder="Enter seller's user ID"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 12 }}
            />

            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Amount (KES)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 12 }}
            />

            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What is this for?"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 12 }}
            />

            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Goods Description</Text>
            <TextInput
              value={goodsDesc}
              onChangeText={setGoodsDesc}
              placeholder="Describe the goods/services"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 16 }}
            />

            <TouchableOpacity
              onPress={createEscrow}
              disabled={creating}
              style={{ backgroundColor: "#3b82f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
            >
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Create Escrow</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Escrow List */}
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#94a3b8", marginBottom: 12 }}>My Escrow Transactions</Text>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : escrows.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Shield size={48} color="#334155" />
            <Text style={{ color: "#475569", marginTop: 16, fontSize: 14 }}>No escrow transactions</Text>
            <Text style={{ color: "#334155", marginTop: 4, fontSize: 12 }}>Create one to get started</Text>
          </View>
        ) : (
          escrows.map((escrow) => (
            <View key={escrow.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {getStatusIcon(escrow.status)}
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#f1f5f9" }}>
                    Escrow #{escrow.id.slice(0, 8)}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: getStatusColor(escrow.status) + "20" }}>
                  <Text style={{ fontSize: 11, color: getStatusColor(escrow.status), textTransform: "capitalize" }}>
                    {escrow.status}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>{escrow.description}</Text>
              {escrow.goods_description && (
                <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Goods: {escrow.goods_description}</Text>
              )}

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#f1f5f9" }}>
                  {escrow.currency} {escrow.amount.toFixed(2)}
                </Text>

                {escrow.status === "held" && escrow.buyer_id === user?.id && (
                  <TouchableOpacity
                    onPress={() => releaseEscrow(escrow)}
                    style={{ backgroundColor: "#22c55e", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 6 }}
                  >
                    <Unlock size={14} color="#fff" />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>Release</Text>
                  </TouchableOpacity>
                )}

                {escrow.qr_code_id && (
                  <TouchableOpacity
                    onPress={() => router.push(`/(os)/wallet/qr?escrow=${escrow.id}`)}
                    style={{ backgroundColor: "#334155", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 6 }}
                  >
                    <QrCode size={14} color="#3b82f6" />
                    <Text style={{ fontSize: 12, color: "#3b82f6" }}>QR</Text>
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
