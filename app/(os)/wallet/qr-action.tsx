"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useIdentity } from "@/lib/auth/useAuthStore";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  User,
  Store,
  Bus,
  Heart,
  CreditCard,
  Calendar,
  MapPin,
  Shield,
  Package,
  Unlock,
  Eye,
  AlertCircle,
  Send,
  DollarSign,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react-native";

interface QrActionData {
  qr_code: {
    id: string;
    entity_type: string;
    deep_link: string;
    prefilled_amount: number | null;
    prefilled_currency: string;
    prefilled_description: string | null;
    owner_id: string;
  };
  entity: any;
  actions: Array<{
    id: string;
    label: string;
    icon: string;
    description: string;
    prefilled?: {
      amount: number;
      currency: string;
      description: string;
    };
  }>;
}

export default function QrActionScreen() {
  const { user } = useIdentity();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [data, setData] = useState<QrActionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDesc, setPayDesc] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const qrParam = params.qr as string;
    if (qrParam) {
      try {
        setData(JSON.parse(qrParam));
      } catch (e) {
        console.error("Failed to parse QR data");
      }
    }
    setLoading(false);
  }, [params.qr]);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "user": return <User size={32} color="#3b82f6" />;
      case "shop": return <Store size={32} color="#22c55e" />;
      case "agent": return <Shield size={32} color="#f59e0b" />;
      case "matatu": return <Bus size={32} color="#8b5cf6" />;
      case "hospital": return <Heart size={32} color="#ef4444" />;
      case "escrow": return <Package size={32} color="#06b6d4" />;
      case "goods": return <Package size={32} color="#ec4899" />;
      default: return <CreditCard size={32} color="#64748b" />;
    }
  };

  const getEntityTitle = () => {
    if (!data) return "Unknown";
    const e = data.entity;
    switch (data.qr_code.entity_type) {
      case "user": return e?.full_name || "MTAA User";
      case "shop": return e?.name || "Shop";
      case "agent": return e?.business_name || "Agent";
      case "matatu": return e?.route_name || "Matatu";
      case "hospital": return e?.name || "Hospital";
      case "escrow": return `Escrow #${e?.id?.slice(0, 8)}`;
      case "goods": return e?.title || "Goods";
      default: return data.qr_code.entity_type;
    }
  };

  const getEntitySubtitle = () => {
    if (!data) return "";
    const e = data.entity;
    switch (data.qr_code.entity_type) {
      case "user": return e?.phone || "Personal Account";
      case "shop": return e?.description || "Merchant";
      case "agent": return `Level ${e?.agent_level || 1} Agent`;
      case "matatu": return e?.route || "Public Transport";
      case "hospital": return e?.type || "Medical Facility";
      case "escrow": return `Status: ${e?.status || "Unknown"}`;
      case "goods": return `${e?.currency || "KES"} ${e?.price || 0}`;
      default: return data.qr_code.entity_type;
    }
  };

  const executeAction = async (actionId: string) => {
    if (!data || !user?.id) return;
    setExecuting(true);
    setSelectedAction(actionId);

    try {
      const payload: any = {
        qr_code_id: data.qr_code.id,
        action: actionId,
        scanner_id: user.id,
      };

      if (actionId.startsWith("pay")) {
        const amount = payAmount || data.qr_code.prefilled_amount?.toString() || "";
        if (!amount) {
          Alert.alert("Amount Required", "Please enter an amount to pay.");
          setExecuting(false);
          return;
        }
        payload.amount = parseFloat(amount);
        payload.currency = data.qr_code.prefilled_currency || "KES";
        payload.description = payDesc || data.qr_code.prefilled_description || `Payment to ${getEntityTitle()}`;
      }

      const { data: execData, error } = await supabase.functions.invoke("qr-execute", {
        body: payload,
      });

      if (error) throw error;
      setResult(execData);

      if (actionId === "follow" || actionId === "profile" || actionId === "view") {
        setTimeout(() => router.back(), 1500);
      }
    } catch (err: any) {
      Alert.alert("Action Failed", err.message || "Could not complete action");
    } finally {
      setExecuting(false);
    }
  };

  const getActionIcon = (iconName: string) => {
    const props = { size: 20, color: "#f1f5f9" };
    switch (iconName) {
      case "send": return <Send {...props} />;
      case "credit-card": return <CreditCard {...props} />;
      case "request": return <DollarSign {...props} />;
      case "user-plus": return <User {...props} />;
      case "user": return <User {...props} />;
      case "list": return <Eye {...props} />;
      case "calendar": return <Calendar {...props} />;
      case "heart": return <Heart {...props} />;
      case "arrow-down": return <DollarSign {...props} />;
      case "arrow-up": return <DollarSign {...props} />;
      case "shield": return <Shield {...props} />;
      case "map-pin": return <MapPin {...props} />;
      case "bus": return <Bus {...props} />;
      case "map": return <MapPin {...props} />;
      case "navigation": return <MapPin {...props} />;
      case "activity": return <Eye {...props} />;
      case "file-text": return <CreditCard {...props} />;
      case "dollar-sign": return <DollarSign {...props} />;
      case "grid": return <Eye {...props} />;
      case "unlock": return <Unlock {...props} />;
      case "eye": return <Eye {...props} />;
      case "alert-circle": return <AlertCircle {...props} />;
      case "package": return <Package {...props} />;
      case "check-circle": return <CheckCircle {...props} />;
      case "truck": return <MapPin {...props} />;
      case "edit": return <Eye {...props} />;
      case "bar-chart": return <Eye {...props} />;
      default: return <ChevronRight {...props} />;
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <XCircle size={48} color="#ef4444" />
        <Text style={{ color: "#f87171", marginTop: 16, fontSize: 16 }}>Invalid QR Data</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text style={{ color: "#3b82f6", fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Header */}
      <View style={{ padding: 16, paddingTop: 24, backgroundColor: "#1e293b", flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#f8fafc" }}>
          QR Scan Result
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Entity Card */}
        <View
          style={{
            backgroundColor: "#1e293b",
            borderRadius: 16,
            padding: 20,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#0f172a",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            {getEntityIcon(data.qr_code.entity_type)}
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#f1f5f9" }}>
            {getEntityTitle()}
          </Text>
          <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
            {getEntitySubtitle()}
          </Text>
          <View
            style={{
              marginTop: 8,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: "#0f172a",
            }}
          >
            <Text style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>
              {data.qr_code.entity_type}
            </Text>
          </View>
        </View>

        {/* Result Display */}
        {result && (
          <View
            style={{
              backgroundColor: result.success ? "#064e3b" : "#7f1d1d",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            {result.success ? (
              <CheckCircle size={24} color="#22c55e" />
            ) : (
              <XCircle size={24} color="#ef4444" />
            )}
            <Text style={{ color: result.success ? "#86efac" : "#fca5a5", fontSize: 14, flex: 1 }}>
              {result.result?.message || (result.success ? "Action completed" : "Action failed")}
            </Text>
          </View>
        )}

        {/* Payment Input */}
        {selectedAction?.startsWith("pay") && !result && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#f1f5f9", marginBottom: 12 }}>
              Payment Details
            </Text>
            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Amount ({data.qr_code.prefilled_currency || "KES"})</Text>
            <TextInput
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="decimal-pad"
              placeholder={data.qr_code.prefilled_amount?.toString() || "0.00"}
              placeholderTextColor="#475569"
              style={{
                backgroundColor: "#0f172a",
                borderRadius: 10,
                padding: 14,
                color: "#f1f5f9",
                fontSize: 16,
                marginBottom: 12,
              }}
            />
            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Description</Text>
            <TextInput
              value={payDesc}
              onChangeText={setPayDesc}
              placeholder={data.qr_code.prefilled_description || "Payment description"}
              placeholderTextColor="#475569"
              style={{
                backgroundColor: "#0f172a",
                borderRadius: 10,
                padding: 14,
                color: "#f1f5f9",
                fontSize: 14,
                marginBottom: 16,
              }}
            />
            <TouchableOpacity
              onPress={() => executeAction(selectedAction)}
              disabled={executing}
              style={{
                backgroundColor: "#3b82f6",
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              {executing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                  Confirm Payment
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Actions List */}
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#94a3b8", marginBottom: 12, marginLeft: 4 }}>
          Available Actions
        </Text>

        {data.actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => {
              if (action.id.startsWith("pay") && !action.prefilled) {
                setSelectedAction(action.id);
              } else {
                executeAction(action.id);
              }
            }}
            disabled={executing}
            style={{
              backgroundColor: selectedAction === action.id ? "#1e3a5f" : "#1e293b",
              borderRadius: 12,
              padding: 16,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              borderWidth: selectedAction === action.id ? 1 : 0,
              borderColor: "#3b82f6",
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#0f172a",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {getActionIcon(action.icon)}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#f1f5f9" }}>
                {action.label}
              </Text>
              <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {action.description}
              </Text>
              {action.prefilled && (
                <Text style={{ fontSize: 12, color: "#3b82f6", marginTop: 2 }}>
                  {action.prefilled.currency} {action.prefilled.amount}
                </Text>
              )}
            </View>
            <ChevronRight size={18} color="#475569" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
