// @ts-nocheck
"use client";

import { View, Text, FlatList, StyleSheet } from "react-native";
import { useAppointments } from "../hooks/useAppointments";

interface Props {
  userId: string;
  role: string;
}

export function UpcomingAppointments({ userId, role }: Props) {
  const { data: appointments, isLoading } = useAppointments(userId);

  if (isLoading) return <Text style={styles.loading}>Loading...</Text>;

  const upcoming = (appointments || []).filter(
    (a: any) => a.status === "scheduled" && new Date(a.scheduled_date || a.scheduled_at) >= new Date()
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.date}>{item.scheduled_date || item.scheduled_at}</Text>
      <Text style={styles.type}>{item.appointment_type || item.type}</Text>
      <Text style={styles.provider}>{item.health_providers?.full_name || "Unknown Provider"}</Text>
    </View>
  );

  return (
    <View>
      <Text style={styles.title}>Upcoming Appointments</Text>
      <FlatList
        data={upcoming}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No upcoming appointments</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { color: "#9CA3AF", padding: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginBottom: 12 },
  card: { backgroundColor: "#1F1F1F", padding: 16, borderRadius: 12, marginBottom: 8 },
  date: { color: "#10b981", fontSize: 14, marginBottom: 4 },
  type: { color: "#FFFFFF", fontSize: 16, fontWeight: "600", marginBottom: 4 },
  provider: { color: "#9CA3AF", fontSize: 14 },
  empty: { color: "#9CA3AF", textAlign: "center", padding: 24 },
});
