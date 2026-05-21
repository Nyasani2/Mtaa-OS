import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useMarketplaceStore } from "@/lib/marketplace/hooks/use-marketplace-store";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function SellScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createListing } = useMarketplaceStore();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!user) return;
    try {
      await createListing({ sellerId: user.id, title, price: parseFloat(price), description, currency: "USD", category: "general", condition: "new", location: "Unknown", images: [], status: "active" });
      Alert.alert("Success", "Listing created");
      router.back();
    } catch (err: any) { Alert.alert("Error", err.message); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sell Item</Text>
      <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#64748B" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Price" placeholderTextColor="#64748B" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Description" placeholderTextColor="#64748B" value={description} onChangeText={setDescription} multiline />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Create Listing</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "white", marginTop: 60, marginBottom: 20 },
  input: { backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "white", fontSize: 16, marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: "top" },
  button: { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 20 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
