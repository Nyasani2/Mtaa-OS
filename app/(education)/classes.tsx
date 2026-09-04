import { useState } from 'react';
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from '@expo/vector-icons';

export default function ClassesScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await EducationService.getClasses();
      setClasses(data);
    } catch (err: any) {
      setError(err.message || "Failed to load classes");
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
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>Classes</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>All classes & sections</Text>
      </View>
      {error && (
        <View style={{ backgroundColor: "#7f1d1d", marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 8 }}>
          <Text style={{ color: "#fecaca" }}>{error}</Text>
        </View>
      )}
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#38bdf8" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/class/${item.id}` as any)}
            style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#f8fafc", fontSize: 17, fontWeight: "700" }}>{item.name}</Text>
              <View style={{ backgroundColor: "#0f172a", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: "#38bdf8", fontSize: 12, fontWeight: "600" }}>{item.grade_level || "N/A"}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
                <Ionicons name="people-outline" size={14} color="#64748b" />
                <Text style={{ color: "#64748b", fontSize: 13, marginLeft: 4 }}>Cap: {item.capacity || "N/A"}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="business-outline" size={14} color="#64748b" />
                <Text style={{ color: "#64748b", fontSize: 13, marginLeft: 4 }}>Room: {item.room_number || "N/A"}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <View style={{ backgroundColor: item.status === "active" ? "#064e3b" : "#451a03", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: item.status === "active" ? "#6ee7b7" : "#fcd34d", fontSize: 11, fontWeight: "600" }}>{item.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons name="easel-outline" size={48} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 12 }}>No classes found</Text>
          </View>
        }
      />
    </View>
  );
}
