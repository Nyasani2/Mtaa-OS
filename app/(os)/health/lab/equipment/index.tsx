// @ts-nocheck
import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLabEquipment, useCreateEquipment, useUpdateEquipmentStatus } from "@/lib/health/hooks/useLab";

const STATUSES = ["operational", "maintenance", "out_of_order", "calibrating"];
const FILTERS = ["all", "operational", "maintenance", "out_of_order", "calibrating"];

export default function LabEquipmentScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [location, setLocation] = useState("");

  const { data: equipment, isLoading, refetch } = useLabEquipment(filter);
  const createEquipment = useCreateEquipment();
  const updateStatus = useUpdateEquipmentStatus();

  const onCreate = () => {
    if (!name.trim()) { Alert.alert("Error", "Equipment name required"); return; }
    createEquipment.mutate({
      name: name.trim(),
      serial_number: serialNumber.trim() || undefined,
      location: location.trim() || undefined,
      status: "operational",
    }, {
      onSuccess: () => { setModalOpen(false); setName(""); setSerialNumber(""); setLocation(""); refetch(); },
    });
  };

  const onStatusChange = (id: string, newStatus: string) => {
    updateStatus.mutate({ id, status: newStatus }, { onSuccess: refetch });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={[styles.badge,
          item.status === "operational" ? styles.badgeGreen :
          item.status === "out_of_order" ? styles.badgeRed :
          item.status === "maintenance" ? styles.badgeYellow : styles.badgeBlue]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.meta}>Serial: {item.serial_number || "N/A"}</Text>
      <Text style={styles.meta}>Location: {item.location || "N/A"}</Text>
      <Text style={styles.meta}>Last calibrated: {item.last_calibrated_at ? new Date(item.last_calibrated_at).toLocaleDateString() : "Never"}</Text>
      <View style={styles.actionRow}>
        {STATUSES.map((s) => (
          <TouchableOpacity key={s} style={[styles.statusChip, item.status === s && styles.statusChipActive]} onPress={() => onStatusChange(item.id, s)}>
            <Text style={[styles.statusChipText, item.status === s && styles.statusChipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Equipment</Text>
        <TouchableOpacity onPress={() => setModalOpen(true)}><Ionicons name="add" size={24} color="#fff"/></TouchableOpacity>
      </View>
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={equipment} keyExtractor={(i) => i.id} renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Equipment</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Equipment name" />
            <Text style={styles.label}>Serial Number</Text>
            <TextInput style={styles.input} value={serialNumber} onChangeText={setSerialNumber} placeholder="Serial / asset tag" />
            <Text style={styles.label}>Location</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Room / lab location" />
            <TouchableOpacity style={styles.submitBtn} onPress={onCreate}>
              <Text style={styles.submitBtnText}>{createEquipment.isPending ? "Saving…" : "Add Equipment"}</Text>
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
  badgeYellow: { backgroundColor: "#78350F" },
  badgeBlue: { backgroundColor: "#1E3A8A" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  meta: { color: "#D1D5DB", fontSize: 13, marginTop: 4 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: "#111827" },
  statusChipActive: { backgroundColor: "#00D09C" },
  statusChipText: { color: "#9CA3AF", fontSize: 11 },
  statusChipTextActive: { color: "#000", fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: "#1F2937", borderRadius: 16, padding: 20 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  label: { color: "#9CA3AF", fontSize: 12, marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: "#111827", color: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  submitBtn: { backgroundColor: "#00D09C", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 16 },
  submitBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
  cancelBtn: { backgroundColor: "#374151", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  cancelBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
