import React, { useState } from 'react';
import { Alert, View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function QRScanScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [qrCode, setQrCode] = useState("");
  const [checkinType, setCheckinType] = useState("attendance");
  const [loading, setLoading] = useState(false);

  const TYPES = [
    { key: "attendance", label: "Attendance", icon: "clipboard" },
    { key: "library", label: "Library", icon: "library" },
    { key: "event", label: "Event", icon: "calendar" },
    { key: "transport", label: "Transport", icon: "bus" },
  ];

  const handleCheckin = async () => {
    if (!qrCode.trim()) {
      Alert.alert("Error", "Please enter a QR code value");
      return;
    }
    try {
      setLoading(true);
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_qr_checkins").insert({
        user_id: user?.id,
        checkin_type: checkinType,
        qr_code: qrCode.trim(),
        verified_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert("Success", `${checkinType} check-in verified`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>QR Check-in</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Scan or enter QR code</Text>
      </View>

      {/* Camera Placeholder */}
      <View style={{ marginHorizontal: 16, backgroundColor: "#1e293b", borderRadius: 16, height: 220, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#334155", borderStyle: "dashed" }}>
        <Ionicons name="scan-outline" size={48} color="#475569" />
        <Text style={{ color: "#64748b", marginTop: 12, fontSize: 14 }}>Camera integration placeholder</Text>
        <Text style={{ color: "#475569", marginTop: 4, fontSize: 12 }}>Use manual entry below</Text>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
        {/* Check-in Type */}
        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 10, textTransform: "uppercase" }}>Check-in Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setCheckinType(t.key)}
              style={{
                backgroundColor: checkinType === t.key ? "#0ea5e9" : "#1e293b",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                margin: 4,
                borderWidth: 1,
                borderColor: checkinType === t.key ? "#0ea5e9" : "#334155",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name={t.icon as any} size={14} color={checkinType === t.key ? "#fff" : "#94a3b8"} />
              <Text style={{ color: checkinType === t.key ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600", marginLeft: 6 }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* QR Input */}
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>QR Code Value</Text>
          <TextInput
            value={qrCode}
            onChangeText={setQrCode}
            placeholder="Enter scanned QR code..."
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <TouchableOpacity
          onPress={handleCheckin}
          disabled={loading}
          style={{ backgroundColor: loading ? "#1e3a5f" : "#0ea5e9", borderRadius: 12, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center" }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>Verify Check-in</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
