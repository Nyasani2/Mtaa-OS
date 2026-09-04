"use client";
import { View, Text, StyleSheet } from 'react-native';
interface Props {
  stats: { totalAppointments: number; totalRecords: number; pendingLabs: number; unreadNotifications: number };
}
export function DashboardStats({ stats }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.card}><Text style={styles.value}>{stats.totalAppointments}</Text><Text style={styles.label}>Appointments</Text></View>
      <View style={styles.card}><Text style={styles.value}>{stats.totalRecords}</Text><Text style={styles.label}>Records</Text></View>
      <View style={styles.card}><Text style={styles.value}>{stats.pendingLabs}</Text><Text style={styles.label}>Pending Labs</Text></View>
      <View style={styles.card}><Text style={styles.value}>{stats.unreadNotifications}</Text><Text style={styles.label}>Notifications</Text></View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 16 },
  card: { backgroundColor: "#1F1F1F", padding: 16, borderRadius: 12, width: "47%", alignItems: "center" },
  value: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  label: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
});
