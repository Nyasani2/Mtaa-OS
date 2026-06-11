import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PATIENT_MODULES = [
  { id: "records", label: "My Records", icon: "document-text", route: "/(os)/health/records", color: "#2563eb" },
  { id: "appointments", label: "Appointments", icon: "calendar", route: "/(os)/health/appointments", color: "#8b5cf6" },
  { id: "prescriptions", label: "Prescriptions", icon: "medical", route: "/(os)/health/prescriptions", color: "#10b981" },
  { id: "lab-results", label: "Lab Results", icon: "flask", route: "/(os)/health/lab-results", color: "#f59e0b" },
  { id: "find-care", label: "Find Care", icon: "search", route: "/(os)/health/find-care", color: "#ec4899" },
  { id: "insurance", label: "Insurance", icon: "shield-checkmark", route: "/(os)/health/insurance", color: "#06b6d4" },
  { id: "wallet", label: "Health Wallet", icon: "wallet", route: "/(os)/health/wallet", color: "#14b8a6" },
  { id: "children", label: "Child Health", icon: "happy", route: "/(os)/health/children", color: "#f97316" },
];

const CLINICAL_MODULES = [
  { id: "doctor", label: "Doctor", icon: "stethoscope", route: "/(os)/health/doctor", color: "#2563eb" },
  { id: "nurse", label: "Nurse", icon: "heart-pulse", route: "/(os)/health/nurse", color: "#ec4899" },
  { id: "lab", label: "Laboratory", icon: "flask", route: "/(os)/health/lab", color: "#f59e0b" },
  { id: "pharmacy", label: "Pharmacy", icon: "medkit", route: "/(os)/health/pharmacy", color: "#10b981" },
  { id: "radiology", label: "Radiology", icon: "scan", route: "/(os)/health/radiology", color: "#8b5cf6" },
  { id: "telemedicine", label: "Telemedicine", icon: "videocam", route: "/(os)/health/telemedicine", color: "#06b6d4" },
];

const OPERATIONS_MODULES = [
  { id: "hospital-admin", label: "Hospital", icon: "business", route: "/(os)/health/hospital-admin", color: "#2563eb" },
  { id: "ambulance", label: "Ambulance", icon: "medical", route: "/(os)/health/ambulance", color: "#ef4444" },
];

const GOVERNMENT_MODULES = [
  { id: "government", label: "Ministry", icon: "shield", route: "/(os)/health/government", color: "#2563eb" },
  { id: "system", label: "System", icon: "settings", route: "/(os)/health/system/settings", color: "#6b7280" },
];

export default function HealthHome() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderModule = (mod: any) => (
    <TouchableOpacity
      key={mod.id}
      style={styles.moduleCard}
      onPress={() => router.push(mod.route as any)}
    >
      <View style={[styles.moduleIcon, { backgroundColor: mod.color + "15" }]}>
        <Ionicons name={mod.icon as any} size={24} color={mod.color} />
      </View>
      <Text style={styles.moduleLabel}>{mod.label}</Text>
    </TouchableOpacity>
  );

  const renderSection = (title: string, modules: any[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.moduleGrid}>
        {modules.map(renderModule)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>Health OS</Text>
        </View>
        <TouchableOpacity style={styles.emergencyBtn} onPress={() => router.push("/(os)/health/emergency")}>
          <Ionicons name="warning" size={20} color="#fff" />
          <Text style={styles.emergencyText}>SOS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Health Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <MaterialCommunityIcons name="heart-pulse" size={28} color="#ef4444" />
              <Text style={styles.statusValue}>72 BPM</Text>
              <Text style={styles.statusLabel}>Heart Rate</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <MaterialCommunityIcons name="thermometer" size={28} color="#f59e0b" />
              <Text style={styles.statusValue}>36.6°C</Text>
              <Text style={styles.statusLabel}>Temperature</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <MaterialCommunityIcons name="water-percent" size={28} color="#3b82f6" />
              <Text style={styles.statusValue}>98%</Text>
              <Text style={styles.statusLabel}>SpO2</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Appointment */}
        <TouchableOpacity style={styles.appointmentCard} onPress={() => router.push("/(os)/health/appointments")}>
          <View style={styles.appointmentHeader}>
            <Ionicons name="calendar" size={20} color="#2563eb" />
            <Text style={styles.appointmentTitle}>Upcoming Appointment</Text>
          </View>
          <Text style={styles.appointmentDoctor}>Dr. Sarah Kimani — General Checkup</Text>
          <Text style={styles.appointmentTime}>Today, 2:30 PM · Nairobi Hospital</Text>
        </TouchableOpacity>

        {/* Module Sections */}
        {renderSection("Patient", PATIENT_MODULES)}
        {renderSection("Clinical", CLINICAL_MODULES)}
        {renderSection("Operations", OPERATIONS_MODULES)}
        {renderSection("Government & System", GOVERNMENT_MODULES)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  greeting: { fontSize: 14, color: "#6b7280" },
  name: { fontSize: 20, fontWeight: "800", color: "#111827" },
  emergencyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#ef4444", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10,
  },
  emergencyText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  content: { padding: 12, paddingBottom: 24 },
  statusCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statusRow: { flexDirection: "row", justifyContent: "space-between" },
  statusItem: { flex: 1, alignItems: "center" },
  statusDivider: { width: 1, backgroundColor: "#e5e7eb" },
  statusValue: { fontSize: 16, fontWeight: "800", color: "#111827", marginTop: 6 },
  statusLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  appointmentCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: "#2563eb",
  },
  appointmentHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  appointmentTitle: { fontSize: 14, fontWeight: "700", color: "#2563eb" },
  appointmentDoctor: { fontSize: 15, fontWeight: "600", color: "#111827" },
  appointmentTime: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10, marginLeft: 4 },
  moduleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moduleCard: {
    width: "23%", backgroundColor: "#fff", borderRadius: 14, padding: 12,
    alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  moduleIcon: {
    width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 6,
  },
  moduleLabel: { fontSize: 10, fontWeight: "600", color: "#374151", textAlign: "center" },
});
