"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Share,
  Alert,
  Image,
} from "react-native";
import { useAuthStore } from "@/hooks/useAuthStore";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  QrCode,
  Copy,
  Share2,
  RefreshCw,
  Clock,
  DollarSign,
  ChevronDown,
  X,
  Check,
  ArrowLeft,
} from "lucide-react-native";

interface QrCodeData {
  id: string;
  entity_type: string;
  deep_link: string;
  qr_name: string | null;
  is_static: boolean;
  prefilled_amount: number | null;
  prefilled_currency: string;
  prefilled_description: string | null;
  expires_at: string | null;
  scan_count: number;
  created_at: string;
}

export default function QrDisplayScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [qrCode, setQrCode] = useState<QrCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showDynamicForm, setShowDynamicForm] = useState(false);
  const [dynamicAmount, setDynamicAmount] = useState("");
  const [dynamicDesc, setDynamicDesc] = useState("");
  const [activeTab, setActiveTab] = useState<"static" | "dynamic">("static");

  const fetchQrCode = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("owner_id", user.id)
        .eq("entity_type", "user")
        .eq("is_static", activeTab === "static")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setQrCode(data || null);
    } catch (err: any) {
      console.error("Fetch QR error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    fetchQrCode();
  }, [fetchQrCode]);

  const generateQr = async () => {
    if (!user?.id) return;
    setGenerating(true);
    try {
      const payload: any = {
        entity_type: "user",
        entity_id: user.id,
        owner_id: user.id,
        qr_name: activeTab === "static" ? "My Payment QR" : `Payment Request ${new Date().toLocaleDateString()}`,
        is_static: activeTab === "static",
      };

      if (activeTab === "dynamic") {
        payload.prefilled_amount = parseFloat(dynamicAmount) || 0;
        payload.prefilled_currency = "KES";
        payload.prefilled_description = dynamicDesc || "Payment request";
        payload.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        payload.max_scans = 1;
      }

      const { data, error } = await supabase.functions.invoke("qr-generate", {
        body: payload,
      });

      if (error) throw error;
      setQrCode(data.qr_code);
      setShowDynamicForm(false);
      setDynamicAmount("");
      setDynamicDesc("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to generate QR");
    } finally {
      setGenerating(false);
    }
  };

  const shareQr = async () => {
    if (!qrCode) return;
    try {
      await Share.share({
        message: `Pay me on MTAA: ${qrCode.deep_link}`,
        title: "My MTAA QR Code",
      });
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  const copyLink = () => {
    if (!qrCode) return;
    Share.share({ message: qrCode.deep_link });
  };

  const qrImageUrl = qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrCode.deep_link)}`
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Header */}
      <View style={{ padding: 16, paddingTop: 24, backgroundColor: "#1e293b", flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#f8fafc" }}>
            My QR Code
          </Text>
          <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
            Scan to pay, follow, or connect
          </Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={{ flexDirection: "row", padding: 12, backgroundColor: "#1e293b", gap: 8 }}>
        <TouchableOpacity
          onPress={() => setActiveTab("static")}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: activeTab === "static" ? "#3b82f6" : "#334155",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: activeTab === "static" ? "#fff" : "#cbd5e1" }}>
            My QR
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("dynamic")}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: activeTab === "dynamic" ? "#3b82f6" : "#334155",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: activeTab === "dynamic" ? "#fff" : "#cbd5e1" }}>
            Request Payment
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, alignItems: "center" }}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 60 }} />
        ) : qrCode ? (
          <>
            {/* QR Card */}
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 24,
                alignItems: "center",
                width: "100%",
                maxWidth: 340,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              {/* QR Image - using React Native Image */}
              {qrImageUrl && (
                <View style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16, backgroundColor: "#fff" }}>
                  <Image
                    source={{ uri: qrImageUrl }}
                    style={{ width: 240, height: 240 }}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Entity Info */}
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 4 }}>
                {qrCode.qr_name || "MTAA User"}
              </Text>

              {qrCode.prefilled_amount && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <DollarSign size={16} color="#3b82f6" />
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#3b82f6", marginLeft: 4 }}>
                    {qrCode.prefilled_currency} {qrCode.prefilled_amount}
                  </Text>
                </View>
              )}

              {qrCode.prefilled_description && (
                <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 8 }}>
                  {qrCode.prefilled_description}
                </Text>
              )}

              {/* Meta */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <QrCode size={14} color="#94a3b8" />
                  <Text style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>
                    {qrCode.scan_count} scans
                  </Text>
                </View>
                {qrCode.expires_at && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Clock size={14} color="#f59e0b" />
                    <Text style={{ fontSize: 11, color: "#f59e0b", marginLeft: 4 }}>
                      Expires {new Date(qrCode.expires_at).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24, width: "100%", maxWidth: 340 }}>
              <TouchableOpacity
                onPress={shareQr}
                style={{
                  flex: 1,
                  backgroundColor: "#3b82f6",
                  paddingVertical: 14,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Share2 size={18} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={copyLink}
                style={{
                  flex: 1,
                  backgroundColor: "#334155",
                  paddingVertical: 14,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Copy size={18} color="#cbd5e1" />
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#cbd5e1" }}>Copy Link</Text>
              </TouchableOpacity>
            </View>

            {/* Regenerate */}
            <TouchableOpacity
              onPress={fetchQrCode}
              style={{
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={14} color="#64748b" />
              <Text style={{ fontSize: 12, color: "#64748b" }}>Refresh QR Code</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* No QR — Show Generate Button or Dynamic Form */
          <View style={{ alignItems: "center", marginTop: 40, width: "100%", maxWidth: 340 }}>
            {activeTab === "static" ? (
              <>
                <QrCode size={64} color="#475569" />
                <Text style={{ fontSize: 16, color: "#94a3b8", marginTop: 16, textAlign: "center" }}>
                  No QR code yet. Generate your personal payment QR.
                </Text>
                <TouchableOpacity
                  onPress={generateQr}
                  disabled={generating}
                  style={{
                    marginTop: 20,
                    backgroundColor: "#3b82f6",
                    paddingVertical: 14,
                    paddingHorizontal: 32,
                    borderRadius: 12,
                  }}
                >
                  {generating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                      Generate My QR
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* Dynamic QR Form */
              <>
                {!showDynamicForm ? (
                  <>
                    <DollarSign size={64} color="#475569" />
                    <Text style={{ fontSize: 16, color: "#94a3b8", marginTop: 16, textAlign: "center" }}>
                      Create a one-time payment request QR.
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowDynamicForm(true)}
                      style={{
                        marginTop: 20,
                        backgroundColor: "#3b82f6",
                        paddingVertical: 14,
                        paddingHorizontal: 32,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                        Create Request
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={{ width: "100%", backgroundColor: "#1e293b", borderRadius: 16, padding: 20 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "#f1f5f9" }}>
                        Payment Request
                      </Text>
                      <TouchableOpacity onPress={() => setShowDynamicForm(false)}>
                        <X size={20} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>

                    <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Amount (KES)</Text>
                    <TextInput
                      value={dynamicAmount}
                      onChangeText={setDynamicAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="#475569"
                      style={{
                        backgroundColor: "#0f172a",
                        borderRadius: 10,
                        padding: 14,
                        color: "#f1f5f9",
                        fontSize: 16,
                        marginBottom: 16,
                      }}
                    />

                    <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Description</Text>
                    <TextInput
                      value={dynamicDesc}
                      onChangeText={setDynamicDesc}
                      placeholder="What is this for?"
                      placeholderTextColor="#475569"
                      style={{
                        backgroundColor: "#0f172a",
                        borderRadius: 10,
                        padding: 14,
                        color: "#f1f5f9",
                        fontSize: 14,
                        marginBottom: 20,
                      }}
                    />

                    <TouchableOpacity
                      onPress={generateQr}
                      disabled={generating || !dynamicAmount}
                      style={{
                        backgroundColor: !dynamicAmount ? "#334155" : "#3b82f6",
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: "center",
                      }}
                    >
                      {generating ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                          Generate Payment QR
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
