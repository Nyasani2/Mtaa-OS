import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLabSamples, useCreateSample } from "@/lib/health/hooks/useLab";

const STATUSES = ["collected", "in_progress", "completed", "rejected"];
const FILTERS = ["all", "collected", "in_progress", "completed", "rejected"];

export default function LabSamplesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [sampleType, setSampleType] = useState("blood");
  const [barcode, setBarcode] = useState("");

  const { data: samples, isLoading, refetch } = useLabSamples(filter);
  const createSample = useCreateSample();

  const onCreate = () => {
    if (!patientId.trim() || !sampleType.trim()) {
      Alert.alert("Validation", "Patient ID and sample type are required.");
      return;
    }
    createSample.mutate({
      patient_id: patientId.trim(),
      sample_type: sampleType,
      barcode: barcode.trim() || undefined,
      status: "collected",
      collected_at: new Date().toISOString(),
    }, {
      onSuccess: () => { setModalOpen(false); setPatientId(""); setSampleType("blood"); setBarcode(""); refetch(); },
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{item.sample_type?.toUpperCase()}</Text>
        <View style={[styles.badge,
          item.status === "completed" ? styles.badgeGreen :
          item.status === "rejected" ? styles.badgeRed :
          item.status === "in_progress" ? styles.badgeYellow : styles.badgeBlue]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.meta}>Barcode: {item.barcode || "N/A"}</Text>
      <Text style={styles.meta}>Patient: {item.patient_id?.slice(0, 8)}…</Text>
      <Text style={styles.meta}>Collected: {new Date(item.collected_at).toLocaleString()}</Text>
      {item.completed_at && <Text style={styles.meta}>Completed: {new Date(item.completed_at).toLocaleString()}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Samples</Text>
        <TouchableOpacity onPress={() => setModalOpen(true)}><Ionicons name="add" size={24} color="#fff"/></TouchableOpacity>
      </View>
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={samples} keyExtractor={(i) => i.id} renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Collect New Sample</Text>
            <Text style={styles.label}>Patient ID</Text>
            <TextInput style={styles.input} value={patientId} onChangeText={setPatientId} placeholder="Patient UUID" />
            <Text style={styles.label}>Sample Type</Text>
            <TextInput style={styles.input} value={sampleType} onChangeText={setSampleType} placeholder="blood, urine, tissue…" />
            <Text style={styles.label}>Barcode (optional)</Text>
            <TextInput style={styles.input} value={barcode} onChangeText={setBarcode} placeholder="Scan or enter barcode" />
            <TouchableOpacity style={styles.submitBtn} onPress={onCreate}>
              <Text style={styles.submitBtnText}>{createSample.isPending ? "Saving…" : "Save Sample"}</Text>
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
  badgeGreen: { backgroundColor: "#065F46" },
  badgeRed: { backgroundColor: "#7F1D1D" },
  badgeYellow: { backgroundColor: "#78350F" },
  badgeBlue: { backgroundColor: "#1E3A8A" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  meta: { color: "#D1D5DB", fontSize: 13, marginTop: 4 },
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
