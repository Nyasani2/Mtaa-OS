// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChildrenRecords, useCreateChildRecord } from '@/lib/health/hooks/useChildren';

const GENDERS = ["male", "female", "other"];
const FILTERS = ["all", "infant", "toddler", "child", "adolescent"];

export default function ChildrenScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("male");
  const [guardianId, setGuardianId] = useState("");
  const [allergies, setAllergies] = useState("");

  const { data: records, isLoading, refetch } = useChildrenRecords(filter);
  const createRecord = useCreateChildRecord();

  const onCreate = () => {
    if (!fullName.trim() || !dateOfBirth.trim() || !guardianId.trim()) {
      Alert.alert("Validation", "Full name, date of birth, and guardian ID are required.");
      return;
    }
    createRecord.mutate({
      full_name: fullName.trim(),
      date_of_birth: dateOfBirth.trim(),
      gender,
      guardian_id: guardianId.trim(),
      allergies: allergies.trim() || undefined,
    }, {
      onSuccess: () => { setModalOpen(false); setFullName(""); setDateOfBirth(""); setGender("male"); setGuardianId(""); setAllergies(""); refetch(); },
    });
  };

  const getAgeGroup = (dob: string) => {
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    if (age < 1) return "infant";
    if (age < 3) return "toddler";
    if (age < 12) return "child";
    return "adolescent";
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{item.full_name}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{getAgeGroup(item.date_of_birth)}</Text></View>
      </View>
      <Text style={styles.meta}>DOB: {new Date(item.date_of_birth).toLocaleDateString()}</Text>
      <Text style={styles.meta}>Gender: {item.gender}</Text>
      <Text style={styles.meta}>Guardian: {item.guardian_id?.slice(0, 8)}…</Text>
      {item.allergies && <Text style={styles.alert}>⚠ Allergies: {item.allergies}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={styles.headerTitle}>Pediatric Records</Text>
        <TouchableOpacity onPress={() => setModalOpen(true)}><Ionicons name="add" size={24} color="#fff"/></TouchableOpacity>
      </View>
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={records} keyExtractor={(i) => i.id} renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Pediatric Record</Text>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Child's full name" />
            <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="2000-01-01" />
            <Text style={styles.label}>Gender</Text>
            <View style={styles.typeRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity key={g} style={[styles.typeChip, gender === g && styles.typeChipActive]} onPress={() => setGender(g)}>
                  <Text style={[styles.typeChipText, gender === g && styles.typeChipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Guardian ID</Text>
            <TextInput style={styles.input} value={guardianId} onChangeText={setGuardianId} placeholder="Guardian UUID" />
            <Text style={styles.label}>Allergies (optional)</Text>
            <TextInput style={styles.input} value={allergies} onChangeText={setAllergies} placeholder="Known allergies…" />
            <TouchableOpacity style={styles.submitBtn} onPress={onCreate}>
              <Text style={styles.submitBtnText}>{createRecord.isPending ? "Saving…" : "Save Record"}</Text>
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
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: "#1E3A8A" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  meta: { color: "#D1D5DB", fontSize: 13, marginTop: 4 },
  alert: { color: "#F59E0B", fontSize: 12, marginTop: 6, fontWeight: "600" },
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
