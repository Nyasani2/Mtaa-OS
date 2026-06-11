import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

interface ReportData {
  id: string;
  patient_name: string;
  patient_id: string;
  modality: string;
  body_part: string;
  clinical_indication: string;
  technique: string;
  findings: string;
  impression: string;
  radiologist: string;
  reported_at: string;
  status: "pending" | "completed";
  images: string[];
}

export default function RadiologyReport() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRadiologyReport, updateRadiologyReport } = useHealthStore();

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    const data = await getRadiologyReport(id);
    setReport(data);
    setFindings(data?.findings || "");
    setImpression(data?.impression || "");
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRadiologyReport(id, { findings, impression, status: "completed" });
      Alert.alert("Saved", "Radiology report updated successfully.");
      setIsEditing(false);
      loadReport();
    } catch (e) {
      Alert.alert("Error", "Failed to save report.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#6b7280" }}>Report not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Radiology Report</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Patient Header */}
        <View style={styles.patientCard}>
          <View style={styles.patientRow}>
            <MaterialCommunityIcons name="account" size={28} color="#2563eb" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.patientName}>{report.patient_name}</Text>
              <Text style={styles.patientId}>ID: {report.patient_id}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: report.status === "completed" ? "#10b98120" : "#f59e0b20" }]}>
              <Text style={[styles.statusText, { color: report.status === "completed" ? "#059669" : "#d97706" }]}>
                {report.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Modality</Text>
              <Text style={styles.metaValue}>{report.modality.toUpperCase()}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Body Part</Text>
              <Text style={styles.metaValue}>{report.body_part}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Reported</Text>
              <Text style={styles.metaValue}>{new Date(report.reported_at).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* Clinical Indication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Indication</Text>
          <View style={styles.box}>
            <Text style={styles.boxText}>{report.clinical_indication}</Text>
          </View>
        </View>

        {/* Technique */}
        {report.technique && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technique</Text>
            <View style={styles.box}>
              <Text style={styles.boxText}>{report.technique}</Text>
            </View>
          </View>
        )}

        {/* Findings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Findings</Text>
          {isEditing ? (
            <>
              <View style={[styles.box, { backgroundColor: "#fff", borderWidth: 1, borderColor: "#2563eb" }]}>
                <TextInput
                  style={[styles.boxText, { minHeight: 120 }]}
                  multiline
                  value={findings}
                  onChangeText={setFindings}
                  placeholder="Enter findings..."
                  textAlignVertical="top"
                />
              </View>
            </>
          ) : (
            <View style={styles.box}>
              <Text style={styles.boxText}>{report.findings || "No findings recorded yet."}</Text>
            </View>
          )}
        </View>

        {/* Impression */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impression</Text>
          {isEditing ? (
            <View style={[styles.box, { backgroundColor: "#fff", borderWidth: 1, borderColor: "#2563eb" }]}>
              <TextInput
                style={[styles.boxText, { minHeight: 80 }]}
                multiline
                value={impression}
                onChangeText={setImpression}
                placeholder="Enter impression / conclusion..."
                textAlignVertical="top"
              />
            </View>
          ) : (
            <View style={styles.box}>
              <Text style={styles.boxText}>{report.impression || "No impression recorded yet."}</Text>
            </View>
          )}
        </View>

        {/* Radiologist */}
        <View style={styles.section}>
          <View style={styles.radiologistRow}>
            <Ionicons name="person-circle" size={32} color="#6b7280" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.radiologistName}>Dr. {report.radiologist}</Text>
              <Text style={styles.radiologistLabel}>Reporting Radiologist</Text>
            </View>
          </View>
        </View>

        {/* Image Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Images</Text>
          <View style={styles.imageGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={32} color="#d1d5db" />
                <Text style={styles.imageLabel}>Image {i}</Text>
              </View>
            ))}
          </View>
        </View>

        {isEditing && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Report"}</Text>
          </TouchableOpacity>
        )}
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
  patientCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  patientRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  patientName: { fontSize: 17, fontWeight: "700", color: "#111827" },
  patientId: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "800" },
  metaRow: { flexDirection: "row", gap: 16 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: "700", color: "#374151" },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 8 },
  box: { backgroundColor: "#fff", borderRadius: 12, padding: 14 },
  boxText: { fontSize: 14, color: "#374151", lineHeight: 22 },
  radiologistRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14 },
  radiologistName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  radiologistLabel: { fontSize: 12, color: "#9ca3af" },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  imagePlaceholder: {
    width: "48%", aspectRatio: 1, backgroundColor: "#fff", borderRadius: 12,
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb",
  },
  imageLabel: { fontSize: 11, color: "#9ca3af", marginTop: 6 },
  saveBtn: {
    backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
