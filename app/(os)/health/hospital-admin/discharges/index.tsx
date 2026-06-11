import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

const DISCHARGE_TYPES = ["Home", "Transfer", "AMA", "Deceased", "Rehabilitation"];

export default function Discharges() {
  const router = useRouter();
  const { bedId } = useLocalSearchParams<{ bedId?: string }>();
  const { dischargePatient } = useHealthStore();

  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [dischargeType, setDischargeType] = useState("Home");
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState("");
  const [medications, setMedications] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpDepartment, setFollowUpDepartment] = useState("");
  const [dischargeNotes, setDischargeNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleDischarge = async () => {
    if (!patientId || !patientName || !dischargeDiagnosis) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await dischargePatient({
        patient_id: patientId,
        patient_name: patientName,
        admission_date: admissionDate,
        discharge_type: dischargeType,
        discharge_diagnosis: dischargeDiagnosis,
        medications_on_discharge: medications,
        follow_up_date: followUpDate,
        follow_up_department: followUpDepartment,
        discharge_notes: dischargeNotes,
        bed_id: bedId,
      });
      Alert.alert("Success", "Patient discharged successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to discharge patient.");
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
        <Text style={styles.headerTitle}>Discharge Patient</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <TextInput style={styles.input} placeholder="Patient ID / MRN *" value={patientId} onChangeText={setPatientId} />
          <TextInput style={styles.input} placeholder="Patient Name *" value={patientName} onChangeText={setPatientName} />
          <TextInput style={styles.input} placeholder="Admission Date (DD/MM/YYYY)" value={admissionDate} onChangeText={setAdmissionDate} />
        </View>

        {/* Discharge Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discharge Type</Text>
          <View style={styles.chipWrap}>
            {DISCHARGE_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, dischargeType === t && styles.chipActive]}
                onPress={() => setDischargeType(t)}
              >
                <Text style={[styles.chipText, dischargeType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Clinical */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Summary</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Discharge Diagnosis / Final Diagnosis *"
            value={dischargeDiagnosis}
            onChangeText={setDischargeDiagnosis}
            multiline
            numberOfLines={3}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Medications on Discharge (one per line)"
            value={medications}
            onChangeText={setMedications}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Follow-up */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow-up Plan</Text>
          <TextInput style={styles.input} placeholder="Follow-up Date (DD/MM/YYYY)" value={followUpDate} onChangeText={setFollowUpDate} />
          <TextInput style={styles.input} placeholder="Follow-up Department / Clinic" value={followUpDepartment} onChangeText={setFollowUpDepartment} />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discharge Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional instructions or notes..."
            value={dischargeNotes}
            onChangeText={setDischargeNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleDischarge}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? "Processing..." : "Complete Discharge"}</Text>
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
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#f59e0b", borderColor: "#f59e0b" },
  chipText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#f59e0b", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginTop: 8,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
