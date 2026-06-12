// app/(os)/pulse/events.tsx
// MTAA Pulse — Events Screen

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { pulseService } from "@/domains/pulse/services/pulseService";
import type { PulseEvent } from "@/domains/pulse/types";
import { Calendar, MapPin, Clock, Filter } from "lucide-react-native";

export default function PulseEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await pulseService.getEvents({ limit: 50 });
      setEvents(data);
    } catch (e: any) {
      console.error("Failed to load events:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filtered = filter === "all" ? events : events.filter((e) => e.source === filter);
  const sources = ["all", ...Array.from(new Set(events.map((e) => e.source)))];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Calendar size={22} color="#FF6B35" />
        <Text style={styles.headerTitle}>Events</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {sources.map((s) => (
          <TouchableOpacity key={s} style={[styles.filterBtn, filter === s && styles.filterBtnActive]} onPress={() => setFilter(s)}>
            <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>{s === "all" ? "All" : s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && events.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEvents} tintColor="#FF6B35" />}>
          {filtered.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={[styles.severityDot, { backgroundColor: getSeverityColor(event.severity) }]} />
              <View style={styles.eventContent}>
                <Text style={styles.eventType}>{event.event_type}</Text>
                <Text style={styles.eventSource}>{event.source} • {event.entity_type}</Text>
                {event.region && (
                  <View style={styles.metaRow}>
                    <MapPin size={12} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.metaText}>{event.region}{event.county ? `, ${event.county}` : ""}</Text>
                  </View>
                )}
                <View style={styles.metaRow}>
                  <Clock size={12} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.metaText}>{new Date(event.created_at).toLocaleString()}</Text>
                </View>
              </View>
            </View>
          ))}
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Calendar size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No events</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function getSeverityColor(s: string) {
  switch (s) {
    case "critical": return "#FF3B30";
    case "warning": return "#FBBF24";
    default: return "#60A5FA";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  filterBar: { maxHeight: 44, paddingHorizontal: 12, paddingVertical: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", marginRight: 8 },
  filterBtnActive: { backgroundColor: "#FF6B35" },
  filterText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  eventCard: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  severityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12, marginTop: 6 },
  eventContent: { flex: 1 },
  eventType: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  eventSource: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  metaText: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: 14, marginTop: 12 },
});
