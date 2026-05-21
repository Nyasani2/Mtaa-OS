// app/(os)/shop/create.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { ShopService } from "@/lib/shop/services/shopService";
import { router } from "expo-router";

export default function CreateShopScreen() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "retail",
    phone: "",
    email: "",
    address_line1: "",
    city: "",
    country: "ZA",
    business_type: "sole_prop",
  });
  const [loading, setLoading] = useState(false);

  const categories = ["retail", "restaurant", "bar", "pharmacy", "electronics", "fashion", "grocery", "services"];
  const businessTypes = ["sole_prop", "pty_ltd", "partnership", "cooperative"];

  const handleCreate = async () => {
    if (!form.name.trim()) { Alert.alert("Error", "Shop name is required"); return; }
    setLoading(true);
    try {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const shop = await ShopService.createShop({ ...form, slug });
      Alert.alert("Success", `${shop.name} created!`);
      router.push(`/shop/${shop.id}`);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create Your Shop</Text>
      <Text style={styles.subheader}>Start selling in minutes</Text>

      <Text style={styles.label}>Shop Name *</Text>
      <TextInput style={styles.input} placeholder="My Awesome Store" placeholderTextColor="#64748b" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder="What do you sell?" placeholderTextColor="#64748b" multiline numberOfLines={3} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        {categories.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.chip, form.category === cat && styles.chipActive]} onPress={() => setForm({ ...form, category: cat })}>
            <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} placeholder="+27 12 345 6789" placeholderTextColor="#64748b" keyboardType="phone-pad" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} placeholder="shop@example.com" placeholderTextColor="#64748b" keyboardType="email-address" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} />

      <Text style={styles.label}>Address</Text>
      <TextInput style={styles.input} placeholder="123 Main Street" placeholderTextColor="#64748b" value={form.address_line1} onChangeText={(t) => setForm({ ...form, address_line1: t })} />
      <TextInput style={styles.input} placeholder="City" placeholderTextColor="#64748b" value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} />

      <Text style={styles.label}>Business Type</Text>
      <View style={styles.chipRow}>
        {businessTypes.map((type) => (
          <TouchableOpacity key={type} style={[styles.chip, form.business_type === type && styles.chipActive]} onPress={() => setForm({ ...form, business_type: type })}>
            <Text style={[styles.chipText, form.business_type === type && styles.chipTextActive]}>{type.replace("_", " ")}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.createBtn, loading && styles.createBtnDisabled]} onPress={handleCreate} disabled={loading}>
        <Text style={styles.createBtnText}>{loading ? "Creating..." : "Create Shop"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 20 },
  header: { color: "#f8fafc", fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subheader: { color: "#64748b", fontSize: 16, marginBottom: 24 },
  label: { color: "#94a3b8", fontSize: 14, fontWeight: "600", marginTop: 16, marginBottom: 6 },
  input: { backgroundColor: "#1e293b", color: "#f8fafc", padding: 14, borderRadius: 10, fontSize: 16, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { backgroundColor: "#1e293b", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  chipActive: { backgroundColor: "#3b82f6" },
  chipText: { color: "#94a3b8", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  createBtn: { backgroundColor: "#22c55e", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 24, marginBottom: 40 },
  createBtnDisabled: { backgroundColor: "#334155" },
  createBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
