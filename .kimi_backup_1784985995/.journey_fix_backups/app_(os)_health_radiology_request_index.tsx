import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

const MODALITIES = [
  { id: "xray", label: "X-Ray", icon: "scan-circle" },
  { id: "ct", label: "CT Scan", icon: "cube-scan" },
  { id: "mri", label: "MRI", icon: "magnet" },
  { id: "ultrasound", label: "Ultrasound", icon: "waves" },
  { id: "nuclear", label: "Nuclear Medicine", icon: "atom" },
  { id: "fluoroscopy", label: "Fluoroscopy", icon: "video" },
];

const BODY_PARTS = [
  "Head / Brain", "Neck", "Chest", "Abdomen", "Pelvis", "Spine", "Shoulder", "Arm", "Hand",
  "Hip", "Leg", "Knee", "Ankle", "Foot", "Whole Body",
];

const PRIORITIES = [
  { id: "routine", label: "Routine", color: "#6b7280" },
  { id: "urgent", label: "Urgent", color: "#f59e0b" },
  { id: "stat", label: "STAT", color: "#ef4444" },
];

export default function ImagingRequest() {
  const router = useRouter();
  const { createImagingRequest } = useHealthStore();

  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [selectedModality, setSelectedModality] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("routine");
  const [indication, setIndication] = useState("");
  const [contrastRequired, setContrastRequired] = useState(false);
  const [pregnancyCheck, setPregnancyCheck] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!patientId || !patientName || !selectedModality || !selectedBodyPart || !indication) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await createImagingRequest({
        patient_id: patientId,
        patient_name: patientName,
        modality: selectedModality,
        body_part: selectedBodyPart,
        priority: selectedPriority,
        clinical_indication: indication,
        contrast_required: contrastRequired,
        pregnancy_check: pregnancyCheck,
        notes,
      });
      Alert.alert("Success", "Imaging request submitted successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to submit imaging request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Imaging Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Patient */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Patient ID *"
            value={patientId}
            onChangeText={setPatientId}
            autoCapitalize="characters"
          />
          <TextInput
            style={styles.input}
            placeholder="Patient Name *"
            value={patientName}
            onChangeText={setPatientName}
          />
        </View>

        {/* Modality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modality *</Text>
          <View style={styles.grid}>
            {MODALITIES.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.gridItem, selectedModality === m.id && styles.gridItemActive]}
                onPress={() => setSelectedModality(m.id)}
              >
                <Ionicons
                  name={m.icon as any}
                  size={20}
                  color={selectedModality === m.id ? "#fff" : "#6b7280"}
                />
                <Text style={[styles.gridItemText, selectedModality === m.id && styles.gridItemTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Body Part */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Part / Region *</Text>
          <View style={styles.chipWrap}>
            {BODY_PARTS.map((part) => (
              <TouchableOpacity
                key={part}
                style={[styles.chip, selectedBodyPart === part && styles.chipActive]}
                onPress={() => setSelectedBodyPart(part)}
              >
                <Text style={[styles.chipText, selectedBodyPart === part && styles.chipTextActive]}>{part}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.priorityChip, selectedPriority === p.id && { backgroundColor: p.color + "20", borderColor: p.color }]}
                onPress={() => setSelectedPriority(p.id)}
              >
                <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                <Text style={[styles.priorityChipText, selectedPriority === p.id && { color: p.color, fontWeight: "700" }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Clinical Indication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Indication *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Reason for imaging, suspected diagnosis..."
            value={indication}
            onChangeText={setIndication}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Toggles */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setContrastRequired(!contrastRequired)}>
            <View style={[styles.toggle, contrastRequired && styles.toggleActive]}>
              {contrastRequired && <View style={styles.toggleKnob} />}
            </View>
            <Text style={styles.toggleLabel}>Contrast Required</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setPregnancyCheck(!pregnancyCheck)}>
            <View style={[styles.toggle, pregnancyCheck && styles.toggleActive]}>
              {pregnancyCheck && <View style={styles.toggleKnob} />}
            </View>
            <Text style={styles.toggleLabel}>Pregnancy Check Completed</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special instructions..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit Request"}</Text>
        </TouchableOpacity>
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 10 },
  input: {
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#111827", borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 10,
  },
  textArea: { height: 90, textAlignVertical: "top", paddingTop: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridItem: {
    width: "30%", backgroundColor: "#fff", borderRadius: 12, padding: 12,
    alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb", gap: 6,
  },
  gridItemActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  gridItemText: { fontSize: 11, color: "#6b7280", fontWeight: "600", textAlign: "center" },
  gridItemTextActive: { color: "#fff" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", flex: 1,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityChipText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: "#d1d5db",
    justifyContent: "center", paddingHorizontal: 2,
  },
  toggleActive: { backgroundColor: "#2563eb" },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  toggleLabel: { fontSize: 14, color: "#374151", fontWeight: "500" },
  submitBtn: {
    backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginTop: 8,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
