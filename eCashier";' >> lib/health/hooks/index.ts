import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRadiologyRequests, useCreateRadiologyRequest } from "@/lib/health/hooks/useRadiology";
import { useAuthStore } from "@/lib/auth/store/auth.store";

const EXAM_TYPES = ["xray", "ct", "mri", "ultrasound", "mammography", "fluoroscopy"];
const URGENCIES = ["routine", "urgent", "stat"];
const FILTERS = ["all", "pending", "scheduled", "completed", "cancelled"];

export default function RadiologyRequestScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [examType, setExamType] = useState("xray");
  const [urgency, setUrgency] = useState("routine");
  const [clinicalNotes, setClinicalNotes] = useState("");

  const { data: requests, isLoading, refetch } = useRadiologyRequests(filter);
  const createRequest = useCreateRadiologyRequest();

  const onCreate = () => {
    if (!patientId.trim() || !examType) {
      Alert.alert("Validation", "Patient ID and exam type are required.");
      return;
    }
    createRequest.mutate({
      requester_id: user!.id,
      patient_id: patientId.trim(),
      exam_type: examType,
      urgency,
      clinical_notes: clinicalNotes.trim() || undefined,
      status: "pending",
      requested_at: new Date().toISOString(),
    }, {
      onSuccess: () => { setModalOpen(false); setPatientId(""); setExamType("xray"); setUrgency("routine"); setClinicalNotes(""); refetch(); },
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{item.exam_type?.toUpperCase()}</Text>
        <View style={[styles.badge,
          item.status === "completed" ? styles.badgeGreen :
          item.status === "cancelled" ? styles.badgeRed :
          item.status === "scheduled" ? styles.badgeBlue : styles.badgeYellow]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.meta}>Urgency: <Text style={{ color: item.urgency === "stat" ? "#EF4444" : "#D1D5DB" }}>{item.urgency}</Text></Text>
      <Text style={styles.meta}>Patient: {item.patient_id?.slice(0, 8)}…</Text>
      {item.clinical_notes && <Text style={styles.content} numberOfLines={2}>{item.clinical_notes}</Text>}
      <Text style={styles.date}>{new Date(item.requested_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={styles.headerTitle}>Radiology Requests</Text>
        <TouchableOpacity onPress={() => setModalOpen(true)}><Ionicons name="add" size={24} color="#fff"/></TouchableOpacity>
      </View>
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={requests} keyExtractor={(i) => i.id} renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Radiology Request</Text>
            <Text style={styles.label}>Patient ID</Text>
            <TextInput style={styles.input} value={patientId} onChangeText={setPatientId} placeholder="Patient UUID" />
            <Text style={styles.label}>Exam Type</Text>
            <View style={styles.typeRow}>
              {EXAM_TYPES.map((t) => (
                <TouchableOpacity key={t} style={[styles.typeChip, examType === t && styles.typeChipActive]} onPress={() => setExamType(t)}>
                  <Text style={[styles.typeChipText, examType === t && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Urgency</Text>
            <View style={styles.typeRow}>
              {URGENCIES.map((u) => (
                <TouchableOpacity key={u} style={[styles.typeChip, urgency === u && styles.typeChipActive]} onPress={() => setUrgency(u)}>
                  <Text style={[styles.typeChipText, urgency === u && styles.typeChipTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Clinical Notes</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} multiline value={clinicalNotes} onChangeText={setClinicalNotes} placeholder="Reason for exam…" />
            <TouchableOpacity style={styles.submitBtn} onPress={onCreate}>
              <Text style={styles.submitBtnText}>{createRequest.isPending ? "Submitting…" : "Submit Request"}</Text>
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
  badgeBlue: { backgroundColor: "#1E3A8A" },
  badgeYellow: { backgroundColor: "#78350F" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  meta: { color: "#D1D5DB", fontSize: 13, marginTop: 4 },
  content: { color: "#9CA3AF", fontSize: 12, marginTop: 4, lineHeight: 18 },
  date: { color: "#6B7280", fontSize: 11, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: "#1F2937", borderRadius: 16, padding: 20 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  label: { color: "#9CA3AF", fontSize: 12, marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: "#111827", color: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: "#111827" },
  typeChipActive: { backgroundColor: "#00D09C" },
  typeChipText: { color: "#9CA3AF", fontSize: 11 },
  typeChipTextActive: { color: "#000", fontWeight: "600" },
  submitBtn: { backgroundColor: "#00D09C", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 16 },
  submitBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
  cancelBtn: { backgroundColor: "#374151", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  cancelBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
