// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Alert,
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from "react-native";
import { Alert, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Alert, SafeAreaView } from "react-native-safe-area-context";
import { Alert, useHealthStore } from "@/domains/health/state/healthStore";

interface HandoverData {
  call_id: string;
  patient_name: string;
  patient_age: string;
  chief_complaint: string;
  scene_vitals: {
    bp: string;
    hr: string;
    rr: string;
    spo2: string;
    gcs: string;
  };
  treatments_given: string;
  medications_given: string;
  allergies: string;
  events_en_route: string;
}

export default function CrewHandover() {
  const router = useRouter();
  const { unitId } = useLocalSearchParams<{ unitId?: string }>();
  const { getDispatchDetails, completeHandover } = useHealthStore();

  const [data, setData] = useState<HandoverData | null>(null);
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  const [rr, setRr] = useState("");
  const [spo2, setSpo2] = useState("");
  const [gcs, setGcs] = useState("");
  const [treatments, setTreatments] = useState("");
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [events, setEvents] = useState("");
  const [receivingNurse, setReceivingNurse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (unitId) {
      getDispatchDetails(unitId).then((d) => {
        if (d) {
          setData(d);
          setBp(d.scene_vitals?.bp || "");
          setHr(d.scene_vitals?.hr || "");
          setRr(d.scene_vitals?.rr || "");
          setSpo2(d.scene_vitals?.spo2 || "");
          setGcs(d.scene_vitals?.gcs || "");
          setTreatments(d.treatments_given || "");
          setMedications(d.medications_given || "");
          setAllergies(d.allergies || "");
          setEvents(d.events_en_route || "");
        }
      });
    }
  }, [unitId]);

  const handleHandover = async () => {
    if (!receivingNurse) {
      Alert.alert("Missing", "Please enter receiving nurse/doctor name.");
      return;
    }
    setSubmitting(true);
    try {
      await completeHandover({
        call_id: data?.call_id,
        unit_id: unitId,
        vitals: { bp, hr, rr, spo2, gcs },
        treatments_given: treatments,
        medications_given: medications,
        allergies,
        events_en_route: events,
        receiving_nurse: receivingNurse,
      });
      Alert.alert("Handover Complete", "Patient successfully handed over to ED.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (_e) {
      Alert.alert("Error", "Failed to complete handover.");
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
        <Text style={styles.headerTitle}>Crew Handover</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Call Summary */}
        {data && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="person" size={20} color="#2563eb" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.summaryName}>{data.patient_name}</Text>
                <Text style={styles.summaryMeta}>Age: {data.patient_age} · {data.chief_complaint}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Vitals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scene Vitals</Text>
          <View style={styles.vitalsGrid}>
            <View style={styles.vitalInput}>
              <Text style={styles.vitalLabel}>BP</Text>
              <TextInput style={styles.vitalField} placeholder="120/80" value={bp} onChangeText={setBp} />
            </View>
            <View style={styles.vitalInput}>
              <Text style={styles.vitalLabel}>HR</Text>
              <TextInput style={styles.vitalField} placeholder="72" value={hr} onChangeText={setHr} keyboardType="numeric" />
            </View>
            <View style={styles.vitalInput}>
              <Text style={styles.vitalLabel}>RR</Text>
              <TextInput style={styles.vitalField} placeholder="16" value={rr} onChangeText={setRr} keyboardType="numeric" />
            </View>
            <View style={styles.vitalInput}>
              <Text style={styles.vitalLabel}>SpO2</Text>
              <TextInput style={styles.vitalField} placeholder="98%" value={spo2} onChangeText={setSpo2} />
            </View>
            <View style={styles.vitalInput}>
              <Text style={styles.vitalLabel}>GCS</Text>
              <TextInput style={styles.vitalField} placeholder="15" value={gcs} onChangeText={setGcs} keyboardType="numeric" />
            </View>
          </View>
        </View>

        {/* Treatments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Treatments Given</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Oxygen, IV fluids, splinting, etc."
            value={treatments}
            onChangeText={setTreatments}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications Given</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Drug name, dose, route, time..."
            value={medications}
            onChangeText={setMedications}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Known Allergies</Text>
          <TextInput style={styles.input} placeholder="NKDA or list allergies..." value={allergies} onChangeText={setAllergies} />
        </View>

        {/* Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Events En Route</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any changes in condition during transport..."
            value={events}
            onChangeText={setEvents}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Receiving Staff */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receiving Staff *</Text>
          <TextInput style={styles.input} placeholder="Nurse / Doctor Name" value={receivingNurse} onChangeText={setReceivingNurse} />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleHandover}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? "Completing..." : "Complete Handover"}</Text>
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
  summaryCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: "#ef4444",
  },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryName: { fontSize: 17, fontWeight: "700", color: "#111827" },
  summaryMeta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 10 },
  vitalsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  vitalInput: { width: "30%" },
  vitalLabel: { fontSize: 11, fontWeight: "600", color: "#6b7280", marginBottom: 4 },
  vitalField: {
    backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10,
    fontSize: 14, color: "#111827", borderWidth: 1, borderColor: "#e5e7eb", textAlign: "center",
  },
  input: {
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#111827", borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 10,
  },
  textArea: { height: 80, textAlignVertical: "top", paddingTop: 12 },
  submitBtn: {
    backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginTop: 8,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});