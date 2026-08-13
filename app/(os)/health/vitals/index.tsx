// @ts-nocheck
import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useVitalsRecords, useCreateVitalsRecord } from "@/lib/health/hooks/useVitals";
import { useAuthStore } from "@/lib/auth/store/auth.store";

const FILTERS = ["all", "normal", "abnormal", "critical"];

export default function VitalsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [weight, setWeight] = useState("");

  const { data: vitals, isLoading, refetch } = useVitalsRecords(filter);
  const createRecord = useCreateVitalsRecord();

  const onCreate = () => {
    if (!patientId.trim() || !bpSystolic.trim() || !heartRate.trim()) {
      Alert.alert("Validation", "Patient ID, BP systolic, and heart rate are required.");
      return;
    }
    createRecord.mutate({
      recorded_by: user!.id,
      patient_id: patientId.trim(),
      bp_systolic: parseInt(bpSystolic),
      bp_diastolic: bpDiastolic ? parseInt(bpDiastolic) : undefined,
      heart_rate: parseInt(heartRate),
      temperature: temperature ? parseFloat(temperature) : undefined,
      oxygen_saturation: oxygenSaturation ? parseInt(oxygenSaturation) : undefined,
      respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      recorded_at: new Date().toISOString(),
    }, {
      onSuccess: () => {
        setModalOpen(false);
        setPatientId(""); setBpSystolic(""); setBpDiastolic(""); setHeartRate("");
        setTemperature(""); setOxygenSaturation(""); setRespiratoryRate(""); setWeight("");
        refetch();
      },
    });
  };

  const getFlag = (item: any) => {
    if (item.bp_systolic > 180 || item.heart_rate > 120 || item.oxygen_saturation < 90) return "critical";
    if (item.bp_systolic > 140 || item.heart_rate > 100 || item.temperature > 38) return "abnormal";
    return "normal";
  };

  const flagColor = (flag: string) => ({ normal: "#065F46", abnormal: "#78350F", critical: "#7F1D1D" }[flag] || "#1F2937");

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>Vitals Record</Text>
        <View style={[styles.badge, { backgroundColor: flagColor(getFlag(item)) }]}>
          <Text style={styles.badgeText}>{getFlag(item)}</Text>
        </View>
      </View>
      <Text style={styles.meta}>BP: {item.bp_systolic}/{item.bp_diastolic || "—"} mmHg</Text>
      <Text style={styles.meta}>HR: {item.heart_rate} bpm</Text>
      {item.temperature && <Text style={styles.meta}>Temp: {item.temperature}°C</Text>}
      {item.oxygen_saturation && <Text style={styles.meta}>SpO2: {item.oxygen_saturation}%</Text>}
      {item.respiratory_rate && <Text style={styles.meta}>RR: {item.respiratory_rate}/min</Text>}
      {item.weight && <Text style={styles.meta}>Weight: {item.weight} kg</Text>}
      <Text style={styles.meta}>Patient: {item.patient_id?.slice(0, 8)}…</Text>
      <Text style={styles.date}>{new Date(item.recorded_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={styles.headerTitle}>Vitals</Text>
        <TouchableOpacity onPress={() => setModalOpen(true)}><Ionicons name="add" size={24} color="#fff"/></TouchableOpacity>
      </View>
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={vitals} keyExtractor={(i) => i.id} renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Record Vitals</Text>
            <Text style={styles.label}>Patient ID</Text>
            <TextInput style={styles.input} value={patientId} onChangeText={setPatientId} placeholder="Patient UUID" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>BP Systolic</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={bpSystolic} onChangeText={setBpSystolic} placeholder="120" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>BP Diastolic</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={bpDiastolic} onChangeText={setBpDiastolic} placeholder="80" />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Heart Rate</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={heartRate} onChangeText={setHeartRate} placeholder="72" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Temp °C</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={temperature} onChangeText={setTemperature} placeholder="36.5" />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>SpO2 %</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={oxygenSaturation} onChangeText={setOxygenSaturation} placeholder="98" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>RR /min</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={respiratoryRate} onChangeText={setRespiratoryRate} placeholder="16" />
              </View>
            </View>
            <Text style={styles.label}>Weight kg</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} placeholder="70" />
            <TouchableOpacity style={styles.submitBtn} onPress={onCreate}>
              <Text style={styles.submitBtnText}>{createRecord.isPending ? "Saving…" : "Save Vitals"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F19" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: "#111827" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  chipRow: { flexDirection: "row", paddingHorizontal: 12, marginBottom: 8, flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: "#1F2937", marginBottom: 6 },
  chipActive: { backgroundColor: "#00D09C" },
  chipText: { color: "#9CA3AF", fontSize: 11 },
  chipTextActive: { color: "#000", fontWeight: "600" },
  card: { backgroundColor: "#1F2937", marginHorizontal: 12, marginBottom: 10, borderRadius: 12, padding: 14 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  meta: { color: "#D1D5DB", fontSize: 13, marginTop: 4 },
  date: { color: "#6B7280", fontSize: 11, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: "#1F2937", borderRadius: 16, padding: 20 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  label: { color: "#9CA3AF", fontSize: 12, marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: "#111827", color: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  submitBtn: { backgroundColor: "#00D09C", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 16 },
  submitBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
  cancelBtn: { backgroundColor: "#374151", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  cancelBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
