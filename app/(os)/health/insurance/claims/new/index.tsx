// @ts-nocheck
import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

const SERVICE_TYPES = ["Inpatient", "Outpatient", "Surgery", "Laboratory", "Pharmacy", "Radiology", "Dental", "Optical", "Maternity"];

export default function NewClaim() {
  const router = useRouter();
  const { submitInsuranceClaim } = useHealthStore();

  const [policyNumber, setPolicyNumber] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [serviceType, setServiceType] = useState("Outpatient");
  const [provider, setProvider] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [items, setItems] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [documents, setDocuments] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!policyNumber || !patientName || !totalAmount) {
      Alert.alert("Missing Fields", "Please fill in policy number, patient name, and total amount.");
      return;
    }
    setSubmitting(true);
    try {
      await submitInsuranceClaim({
        policy_number: policyNumber,
        patient_name: patientName,
        patient_id: patientId,
        service_type: serviceType,
        provider,
        service_date: serviceDate,
        diagnosis,
        items,
        total_amount: parseFloat(totalAmount),
        documents,
        notes,
      });
      Alert.alert("Success", "Claim submitted successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to submit claim.");
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
        <Text style={styles.headerTitle}>New Claim</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Policy Information</Text>
          <TextInput style={styles.input} placeholder="Policy Number *" value={policyNumber} onChangeText={setPolicyNumber} />
          <TextInput style={styles.input} placeholder="Insurance Provider" value={provider} onChangeText={setProvider} />
        </View>

        {/* Patient */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <TextInput style={styles.input} placeholder="Patient Name *" value={patientName} onChangeText={setPatientName} />
          <TextInput style={styles.input} placeholder="Patient ID / MRN" value={patientId} onChangeText={setPatientId} />
        </View>

        {/* Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <Text style={styles.label}>Service Type</Text>
          <View style={styles.chipWrap}>
            {SERVICE_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, serviceType === t && styles.chipActive]}
                onPress={() => setServiceType(t)}
              >
                <Text style={[styles.chipText, serviceType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Service Date (DD/MM/YYYY)" value={serviceDate} onChangeText={setServiceDate} />
          <TextInput style={styles.input} placeholder="Primary Diagnosis" value={diagnosis} onChangeText={setDiagnosis} />
        </View>

        {/* Items & Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claim Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Itemized services (one per line)..."
            value={items}
            onChangeText={setItems}
            multiline
            numberOfLines={4}
          />
          <TextInput
            style={styles.input}
            placeholder="Total Amount (KSh) *"
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="numeric"
          />
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supporting Documents</Text>
          <TouchableOpacity style={styles.uploadBox}>
            <Ionicons name="cloud-upload-outline" size={28} color="#2563eb" />
            <Text style={styles.uploadText}>Tap to upload invoices, receipts, reports</Text>
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

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit Claim"}</Text>
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
  textArea: { height: 90, textAlignVertical: "top", paddingTop: 12 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  uploadBox: {
    backgroundColor: "#fff", borderRadius: 12, padding: 20,
    alignItems: "center", borderWidth: 2, borderColor: "#e5e7eb", borderStyle: "dashed",
  },
  uploadText: { fontSize: 13, color: "#6b7280", marginTop: 8 },
  submitBtn: {
    backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginTop: 8,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
