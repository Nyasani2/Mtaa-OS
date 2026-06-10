import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useProperty } from "@/domains/property/hooks/useProperty";
import { ChevronLeft, Home, Building2, Hotel, TrendingUp, Camera, MapPin, PoundSterling } from "lucide-react-native";

const PROPERTY_TYPES = [
  { id: "rental", label: "Rental", icon: Building2 },
  { id: "hotel", label: "Hotel", icon: Hotel },
  { id: "investment", label: "Investment", icon: TrendingUp },
  { id: "shared", label: "Shared", icon: Home },
];

export default function ListPropertyScreen() {
  const router = useRouter();
  const { createProperty } = useProperty();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("rental");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title || !price || !city) return;
    setSubmitting(true);
    try {
      await createProperty({ title, property_type: type, price_per_night: parseFloat(price), city, description, is_available: isAvailable });
      router.replace("/(os)/property/(tabs)/host");
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={24} color="#1a1a1a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>List Property</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.photoUpload}><Camera size={32} color="#1a5c4b" /><Text style={styles.photoText}>Add Photos</Text></TouchableOpacity>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Type</Text>
          <View style={styles.typeRow}>
            {PROPERTY_TYPES.map((t) => (
              <TouchableOpacity key={t.id} style={[styles.typeChip, type === t.id && styles.typeChipActive]} onPress={() => setType(t.id)}>
                <t.icon size={18} color={type === t.id ? "#fff" : "#1a5c4b"} />
                <Text style={[styles.typeChipText, type === t.id && styles.typeChipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title *</Text>
          <TextInput style={styles.input} placeholder="e.g. Modern 2-bedroom apartment" value={title} onChangeText={setTitle} />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>City *</Text>
          <View style={styles.inputRow}><MapPin size={18} color="#9ca3af" /><TextInput style={[styles.input, { flex: 1, marginTop: 0 }]} placeholder="e.g. Southampton" value={city} onChangeText={setCity} /></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price per Night (£) *</Text>
          <View style={styles.inputRow}><PoundSterling size={18} color="#9ca3af" /><TextInput style={[styles.input, { flex: 1, marginTop: 0 }]} placeholder="e.g. 85" keyboardType="numeric" value={price} onChangeText={setPrice} /></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]} multiline numberOfLines={4} placeholder="Describe your property..." value={description} onChangeText={setDescription} />
        </View>
        <View style={styles.section}>
          <View style={styles.switchRow}><Text style={styles.sectionTitle}>Available Now</Text><Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ false: "#d1d5db", true: "#1a5c4b" }} /></View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.submitBtn, (!title || !price || !city || submitting) && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={!title || !price || !city || submitting}>
          <Text style={styles.submitBtnText}>{submitting ? "Listing..." : "List Property"}</Text>
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
  photoUpload: { backgroundColor: "#fff", borderRadius: 16, padding: 40, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: "#e5e0d5", borderStyle: "dashed" },
  photoText: { fontSize: 15, color: "#1a5c4b", fontWeight: "500", marginTop: 8 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 12 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#e5e0d5" },
  typeChipActive: { backgroundColor: "#1a5c4b", borderColor: "#1a5c4b" },
  typeChipText: { fontSize: 13, color: "#4b5563" },
  typeChipTextActive: { color: "#fff", fontWeight: "500" },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 15, color: "#1a1a1a", marginTop: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bottomBar: { padding: 16, paddingBottom: 32, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e0d5" },
  submitBtn: { backgroundColor: "#1a5c4b", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  submitBtnDisabled: { backgroundColor: "#9ca3af" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
