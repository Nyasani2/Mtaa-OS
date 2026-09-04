import { useState } from 'react';
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from "@expo/vector-icons";

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await EducationService.getEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || "Failed to load events");
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
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>Events</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>School events & activities</Text>
      </View>
      {error && (
        <View style={{ backgroundColor: "#7f1d1d", marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 8 }}>
          <Text style={{ color: "#fecaca" }}>{error}</Text>
        </View>
      )}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#38bdf8" />}
        renderItem={({ item }) => {
          const start = item.start_date ? new Date(item.start_date) : null;
          const end = item.end_date ? new Date(item.end_date) : null;
          return (
            <TouchableOpacity
              onPress={() => router.push(`/events/${item.id}` as any)}
              style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "700", flex: 1 }}>{item.title}</Text>
                <View style={{ backgroundColor: "#0f172a", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                  <Text style={{ color: "#38bdf8", fontSize: 11, fontWeight: "600" }}>{item.event_type || "Event"}</Text>
                </View>
              </View>
              {item.description && (
                <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 6 }} numberOfLines={2}>{item.description}</Text>
              )}
              <View style={{ flexDirection: "row", marginTop: 10, alignItems: "center" }}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={{ color: "#64748b", fontSize: 12, marginLeft: 4 }}>
                  {start ? start.toLocaleDateString() : "TBD"}
                  {end ? ` - ${end.toLocaleDateString()}` : ""}
                </Text>
              </View>
              {item.location && (
                <View style={{ flexDirection: "row", marginTop: 4, alignItems: "center" }}>
                  <Ionicons name="location-outline" size={14} color="#64748b" />
                  <Text style={{ color: "#64748b", fontSize: 12, marginLeft: 4 }}>{item.location}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons name="calendar-outline" size={48} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 12 }}>No events scheduled</Text>
          </View>
        }
      />
    </View>
  );
}
