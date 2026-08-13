// @ts-nocheck
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useStay } from "@/domains/stay/hooks/useStay";
import { Wrench, ChevronLeft, Camera, Check } from "lucide-react-native";

const PRIORITIES = [
  { id: "low", label: "Low", color: "#22c55e" },
  { id: "medium", label: "Medium", color: "#f59e0b" },
  { id: "high", label: "High", color: "#ef4444" },
  { id: "emergency", label: "Emergency", color: "#dc2626" },
];

const CATEGORIES = ["Plumbing", "Electrical", "HVAC", "Appliance", "Structural", "Pest Control", "Cleaning", "Security", "Other"];

export default function StayMaintenanceScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { reportMaintenance } = useStay();
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!category || !description) return;
    setSubmitting(true);
    try {
      await reportMaintenance({ property_id: id as string, category: category.toLowerCase().replace(' ', '_'), priority, title: category, description });
      setSubmitted(true);
      setTimeout(() => router.back(), 2000);
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  }

  if (submitted) return (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}><Check size={40} color="#22c55e" /></View>
      <Text style={styles.successTitle}>Request Submitted</Text>
      <Text style={styles.successText}>A contractor will be assigned shortly.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={24} color="#1a1a1a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Maintenance Request</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Category *</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority *</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity key={p.id} style={[styles.priorityChip, priority === p.id && { borderColor: p.color, backgroundColor: p.color + "15" }]} onPress={() => setPriority(p.id)}>
                <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                <Text style={[styles.priorityText, priority === p.id && { color: p.color, fontWeight: "600" }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description *</Text>
          <TextInput style={styles.textArea} multiline numberOfLines={5} placeholder="Describe the issue in detail..." value={description} onChangeText={setDescription} />
        </View>
        <TouchableOpacity style={styles.photoBtn}><Camera size={20} color="#1a5c4b" /><Text style={styles.photoBtnText}>Add Photo (optional)</Text></TouchableOpacity>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.submitBtn, (!category || !description || submitting) && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={!category || !description || submitting}>
          <Wrench size={18} color="#fff" /><Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit Request"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 60, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e0d5" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 12 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#e5e0d5" },
  chipActive: { backgroundColor: "#1a5c4b", borderColor: "#1a5c4b" },
  chipText: { fontSize: 13, color: "#4b5563" },
  chipTextActive: { color: "#fff", fontWeight: "500" },
  priorityRow: { flexDirection: "row", flexWrap: 'wrap', gap: 8 },
  priorityChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#e5e0d5" },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  priorityText: { fontSize: 13, color: "#4b5563" },
  textArea: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 15, color: "#1a1a1a", minHeight: 120, textAlignVertical: "top" },
  photoBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e5e0d5", borderStyle: "dashed" },
  photoBtnText: { fontSize: 14, color: "#1a5c4b", fontWeight: "500" },
  bottomBar: { padding: 16, paddingBottom: 32, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e0d5" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1a5c4b", paddingVertical: 16, borderRadius: 12 },
  submitBtnDisabled: { backgroundColor: "#9ca3af" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  successContainer: { flex: 1, backgroundColor: "#f8f6f1", justifyContent: "center", alignItems: "center", padding: 24 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  successText: { fontSize: 15, color: "#6b7280", textAlign: "center" },
});
