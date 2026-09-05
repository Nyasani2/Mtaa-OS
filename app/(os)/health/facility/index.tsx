// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFacilities, useCreateFacility } from '@/lib/health/hooks/useFacility';

const TYPES = ["hospital", "clinic", "pharmacy", "lab", "imaging", "rehabilitation"];
const FILTERS = ["all", "hospital", "clinic", "pharmacy", "lab", "imaging"];

export default function FacilityScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("hospital");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [capacity, setCapacity] = useState("");

  const { data: facilities, isLoading, refetch } = useFacilities(filter);
  const createFacility = useCreateFacility();

  const onCreate = () => {
    if (!name.trim() || !type) { Alert.alert("Error", "Name and type are required."); return; }
    createFacility.mutate({
      name: name.trim(),
      type,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
    }, {
      onSuccess: () => { setModalOpen(false); setName(""); setType("hospital"); setAddress(""); setPhone(""); setEmail(""); setCapacity(""); refetch(); },
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{item.type}</Text></View>
      </View>
      <Text style={styles.meta}>{item.address || "No address"}</Text>
      {item.phone && (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
          <Text style={[styles.meta, { color: "#60A5FA" }]}>📞 {item.phone}</Text>
        </TouchableOpacity>
      )}
      {item.email && (
        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${item.email}`)}>
          <Text style={[styles.meta, { color: "#60A5FA" }]}>✉ {item.email}</Text>
        </TouchableOpacity>
      )}
      {item.capacity && <Text style={styles.meta}>Capacity: {item.capacity} beds</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={styles.headerTitle}>Facilities</Text>
        <TouchableOpacity onPress={() => setModalOpen(true)}><Ionicons name="add" size={24} color="#fff"/></TouchableOpacity>
      </View>
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={facilities} keyExtractor={(i) => i.id} renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Facility</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Facility name" />
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <TouchableOpacity key={t} style={[styles.typeChip, type === t && styles.typeChipActive]} onPress={() => setType(t)}>
                  <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Street address" />
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+255…" keyboardType="phone-pad" />
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="contact@facility.com" keyboardType="email-address" />
            <Text style={styles.label}>Capacity (beds)</Text>
            <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} placeholder="50" keyboardType="numeric" />
            <TouchableOpacity style={styles.submitBtn} onPress={onCreate}>
              <Text style={styles.submitBtnText}>{createFacility.isPending ? "Saving…" : "Add Facility"}</Text>
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
