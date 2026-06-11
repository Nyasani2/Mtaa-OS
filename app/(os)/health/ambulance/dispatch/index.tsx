import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

const PRIORITIES = [
  { id: "routine", label: "Routine", color: "#6b7280" },
  { id: "urgent", label: "Urgent", color: "#f59e0b" },
  { id: "emergency", label: "Emergency", color: "#ef4444" },
];

const CALL_TYPES = ["Medical Emergency", "Trauma", "Maternity", "Pediatric", "Cardiac", "Respiratory", "Stroke", "Other"];

export default function AmbulanceDispatch() {
  const router = useRouter();
  const { dispatchAmbulance } = useHealthStore();

  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [location, setLocation] = useState("");
  const [landmark, setLandmark] = useState("");
  const [priority, setPriority] = useState("emergency");
  const [callType, setCallType] = useState("Medical Emergency");
  const [complaint, setComplaint] = useState("");
  const [conscious, setConscious] = useState(true);
  const [breathing, setBreathing] = useState(true);
  const [bleeding, setBleeding] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleDispatch = async () => {
    if (!callerPhone || !location || !complaint) {
      Alert.alert("Missing Fields", "Please fill in caller phone, location, and chief complaint.");
      return;
    }
    setSubmitting(true);
    try {
      await dispatchAmbulance({
        caller_name: callerName,
        caller_phone: callerPhone,
        patient_name: patientName,
        patient_age: patientAge,
        location,
        landmark,
        priority,
        call_type: callType,
        chief_complaint: complaint,
        conscious,
        breathing,
        bleeding,
        notes,
      });
      Alert.alert("Dispatched", "Ambulance dispatched successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to dispatch ambulance.");
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
        <Text style={styles.headerTitle}>New Dispatch</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Caller Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caller Information</Text>
          <TextInput style={styles.input} placeholder="Caller Name" value={callerName} onChangeText={setCallerName} />
          <TextInput style={styles.input} placeholder="Caller Phone *" value={callerPhone} onChangeText={setCallerPhone} keyboardType="phone-pad" />
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <TextInput style={styles.input} placeholder="Patient Name (if known)" value={patientName} onChangeText={setPatientName} />
          <TextInput style={styles.input} placeholder="Age" value={patientAge} onChangeText={setPatientAge} keyboardType="numeric" />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TextInput style={styles.input} placeholder="Address / Location *" value={location} onChangeText={setLocation} />
          <TextInput style={styles.input} placeholder="Nearby Landmark" value={landmark} onChangeText={setLandmark} />
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.priorityChip, priority === p.id && { backgroundColor: p.color + "20", borderColor: p.color }]}
                onPress={() => setPriority(p.id)}
              >
                <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                <Text style={[styles.priorityChipText, priority === p.id && { color: p.color, fontWeight: "700" }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Call Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call Type</Text>
          <View style={styles.chipWrap}>
            {CALL_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, callType === t && styles.chipActive]}
                onPress={() => setCallType(t)}
              >
                <Text style={[styles.chipText, callType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chief Complaint */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chief Complaint *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the emergency situation..."
            value={complaint}
            onChangeText={setComplaint}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Vitals Check */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Assessment</Text>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setConscious(!conscious)}>
            <View style={[styles.toggle, conscious && styles.toggleActive]}>
              {conscious && <View style={styles.toggleKnob} />}
            </View>
            <Text style={styles.toggleLabel}>Patient Conscious</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setBreathing(!breathing)}>
            <View style={[styles.toggle, breathing && styles.toggleActive]}>
              {breathing && <View style={styles.toggleKnob} />}
            </View>
            <Text style={styles.toggleLabel}>Patient Breathing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setBleeding(!bleeding)}>
            <View style={[styles.toggle, bleeding && styles.toggleActive]}>
              {bleeding && <View style={styles.toggleKnob} />}
            </View>
            <Text style={styles.toggleLabel}>Active Bleeding</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any hazards, access issues, special instructions..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.dispatchBtn, submitting && { opacity: 0.6 }]}
          onPress={handleDispatch}
          disabled={submitting}
        >
          <Ionicons name="navigate" size={20} color="#fff" />
          <Text style={styles.dispatchBtnText}>{submitting ? "Dispatching..." : "Dispatch Ambulance"}</Text>
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
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", flex: 1,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityChipText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  chipText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: "#d1d5db",
    justifyContent: "center", paddingHorizontal: 2,
  },
  toggleActive: { backgroundColor: "#ef4444" },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  toggleLabel: { fontSize: 14, color: "#374151", fontWeight: "500" },
  dispatchBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#ef4444", borderRadius: 14, paddingVertical: 16, marginTop: 8,
  },
  dispatchBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
