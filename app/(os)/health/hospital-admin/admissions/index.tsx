import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

const ADMISSION_TYPES = ["Elective", "Emergency", "Day Case", "Maternity", "Pediatric"];
const WARDS = ["General", "ICU", "Maternity", "Pediatric", "Isolation", "Surgery"];

export default function Admissions() {
  const router = useRouter();
  const { bedId } = useLocalSearchParams<{ bedId?: string }>();
  const { admitPatient } = useHealthStore();

  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [admissionType, setAdmissionType] = useState("Emergency");
  const [ward, setWard] = useState("General");
  const [bedNumber, setBedNumber] = useState(bedId || "");
  const [referringDoctor, setReferringDoctor] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdmit = async () => {
    if (!patientName || !patientId || !diagnosis) {
      Alert.alert("Missing Fields", "Please fill in patient name, ID, and diagnosis.");
      return;
    }
    setSubmitting(true);
    try {
      await admitPatient({
        patient_name: patientName,
        patient_id: patientId,
        dob,
        gender,
        admission_type: admissionType,
        ward,
        bed_number: bedNumber,
        referring_doctor: referringDoctor,
        diagnosis,
        insurance_provider: insuranceProvider,
        insurance_number: insuranceNumber,
        emergency_contact: emergencyContact,
      });
      Alert.alert("Success", "Patient admitted successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to admit patient.");
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
        <Text style={styles.headerTitle}>New Admission</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <TextInput style={styles.input} placeholder="Full Name *" value={patientName} onChangeText={setPatientName} />
          <TextInput style={styles.input} placeholder="Patient ID / MRN *" value={patientId} onChangeText={setPatientId} autoCapitalize="characters" />
          <TextInput style={styles.input} placeholder="Date of Birth (DD/MM/YYYY)" value={dob} onChangeText={setDob} />
          <View style={styles.genderRow}>
            {(["male", "female", "other"] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderChip, gender === g && styles.genderChipActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Admission Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admission Details</Text>
          <Text style={styles.label}>Admission Type</Text>
          <View style={styles.chipWrap}>
            {ADMISSION_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, admissionType === t && styles.chipActive]}
                onPress={() => setAdmissionType(t)}
              >
                <Text style={[styles.chipText, admissionType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 12 }]}>Ward</Text>
          <View style={styles.chipWrap}>
            {WARDS.map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.chip, ward === w && styles.chipActive]}
                onPress={() => setWard(w)}
              >
                <Text style={[styles.chipText, ward === w && styles.chipTextActive]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Bed Number" value={bedNumber} onChangeText={setBedNumber} />
          <TextInput style={styles.input} placeholder="Referring Doctor" value={referringDoctor} onChangeText={setReferringDoctor} />
        </View>

        {/* Clinical */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Information</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Primary Diagnosis / Reason for Admission *"
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Insurance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insurance</Text>
          <TextInput style={styles.input} placeholder="Insurance Provider" value={insuranceProvider} onChangeText={setInsuranceProvider} />
          <TextInput style={styles.input} placeholder="Policy / Card Number" value={insuranceNumber} onChangeText={setInsuranceNumber} />
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <TextInput style={styles.input} placeholder="Name & Phone Number" value={emergencyContact} onChangeText={setEmergencyContact} />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleAdmit}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? "Admitting..." : "Admit Patient"}</Text>
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
  label: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 8 },
  input: {
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#111827", borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 10,
  },
  textArea: { height: 80, textAlignVertical: "top", paddingTop: 12 },
  genderRow: { flexDirection: "row", gap: 10 },
  genderChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#fff",
    alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb",
  },
  genderChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  genderChipText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  genderChipTextActive: { color: "#fff" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#10b981", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginTop: 8,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
