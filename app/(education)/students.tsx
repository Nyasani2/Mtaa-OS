import { useState } from 'react';
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from '@expo/vector-icons';

export default function StudentsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await EducationService.getStudents();
      setStudents(data);
    } catch (err: any) {
      setError(err.message || "Failed to load students");
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
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>Students</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Student directory</Text>
      </View>
      {error && (
        <View style={{ backgroundColor: "#7f1d1d", marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 8 }}>
          <Text style={{ color: "#fecaca" }}>{error}</Text>
        </View>
      )}
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#38bdf8" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/student/${item.id}` as any)}
            style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center" }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#10b981", justifyContent: "center", alignItems: "center" }}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "700" }}>{item.enrollment_number || "Student"}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>Grade: {item.grade_level || "N/A"}</Text>
              <View style={{ flexDirection: "row", marginTop: 6 }}>
                <View style={{ backgroundColor: item.status === "active" ? "#064e3b" : "#451a03", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: item.status === "active" ? "#6ee7b7" : "#fcd34d", fontSize: 11, fontWeight: "600" }}>{item.status}</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons name="people-outline" size={48} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 12 }}>No students found</Text>
          </View>
        }
      />
    </View>
  );
}
