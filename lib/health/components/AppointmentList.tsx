"use client";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useAppointments } from "../hooks/useAppointments";
interface Props { userId: string; role: string; }
export function AppointmentList({ userId, role }: Props) {
  const { data: appointments, isLoading } = useAppointments(userId, role);
  if (isLoading) return <Text style={styles.loading}>Loading...</Text>;
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.type}>{item.appointment_type || item.type}</Text>
      <Text style={styles.date}>{item.scheduled_date || item.scheduled_at}</Text>
      <Text style={styles.provider}>{item.health_providers?.full_name || "Unknown"}</Text>
      <Text style={styles.patient}>{item.health_// STUB_REMOVED: "patients"?.first_name} {item.health_// STUB_REMOVED: "patients"?.last_name}</Text>
      {item.symptoms && <Text style={styles.symptoms}>Symptoms: {item.symptoms.join(", ")}</Text>}
    </View>
  );
  return (
    <FlatList data={appointments || []} renderItem={renderItem} keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>No appointments</Text>} />
  );
}
const styles = StyleSheet.create({
  loading: { color: "#9CA3AF", padding: 16 },
  card: { backgroundColor: "#1F1F1F", padding: 16, borderRadius: 12, marginBottom: 12 },
  type: { fontSize: 12, color: "#10b981", textTransform: "uppercase", marginBottom: 4 },
  date: { fontSize: 14, color: "#FFFFFF", marginBottom: 4 },
  provider: { fontSize: 14, color: "#9CA3AF" },
  patient: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
  symptoms: { fontSize: 12, color: "#ef4444", marginTop: 4 },
  empty: { color: "#9CA3AF", textAlign: "center", padding: 24 },
});
