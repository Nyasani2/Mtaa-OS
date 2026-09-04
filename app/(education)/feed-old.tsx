import { useState } from 'react';
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from '@expo/vector-icons';

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const [a, e] = await Promise.all([
        EducationService.getAnnouncements(),
        EducationService.getEvents(),
      ]);
      setAnnouncements(a);
      setEvents(e);
    } catch (err: any) {
      setError(err.message || "Failed to load feed");
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

  const renderItem = ({ item, section }: { item: any; section: string }) => (
    <TouchableOpacity
      onPress={() => section === "events" && router.push(`/events/${item.id}` as any)}
      style={{
        backgroundColor: "#1e293b",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: section === "announcements" ? "#f59e0b" : "#8b5cf6",
      }}
    >
      <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "700" }}>{item.title}</Text>
      {item.description && (
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 6 }} numberOfLines={2}>{item.description}</Text>
      )}
      <Text style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
        {new Date(item.created_at || item.start_date).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const data = [
    ...announcements.map((a) => ({ ...a, _section: "announcements" })),
    ...events.map((e) => ({ ...e, _section: "events" })),
  ].sort((a, b) => new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime());

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#0f172a", borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>Education Feed</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Announcements & Events</Text>
      </View>
      {error && (
        <View style={{ backgroundColor: "#7f1d1d", marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 8 }}>
          <Text style={{ color: "#fecaca" }}>{error}</Text>
        </View>
      )}
      <FlatList
        data={data}
        keyExtractor={(item) => `${item._section}-${item.id}`}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#38bdf8" />}
        renderItem={({ item }) => renderItem({ item, section: item._section })}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons name="newspaper-outline" size={48} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 12 }}>No announcements or events yet</Text>
          </View>
        }
      />
    </View>
  );
}
