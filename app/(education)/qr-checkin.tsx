import { useState } from 'react';
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from "@expo/vector-icons";

export default function QRCheckinScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await EducationService.getQRCheckins(user?.id);
      setCheckins(data);
    } catch (err: any) {
      setError(err.message || "Failed to load check-ins");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#0f172a", borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>QR Check-in</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Attendance verification log</Text>
      </View>
      {error && (
        <View style={{ backgroundColor: "#7f1d1d", marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 8 }}>
          <Text style={{ color: "#fecaca" }}>{error}</Text>
        </View>
      )}
      <FlatList
        data={checkins}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#38bdf8" />}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "700" }}>{item.checkin_type}</Text>
              <View style={{ backgroundColor: item.verified_at ? "#064e3b" : "#451a03", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: item.verified_at ? "#6ee7b7" : "#fcd34d", fontSize: 11, fontWeight: "600" }}>{item.verified_at ? "Verified" : "Pending"}</Text>
              </View>
            </View>
            {item.qr_code && <Text style={{ color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>Code: {item.qr_code}</Text>}
            {item.latitude && item.longitude && (
              <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>
                Location: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </Text>
            )}
            <Text style={{ color: "#64748b", fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons name="qr-code-outline" size={48} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 12 }}>No check-ins yet</Text>
          </View>
        }
      />
      <TouchableOpacity
        onPress={() => router.push("/(education as any)/qr-scan" as any)}
        style={{ position: "absolute", right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#0ea5e9", justifyContent: "center", alignItems: "center", elevation: 6 }}
      >
        <Ionicons name="scan" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
