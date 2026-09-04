import React, { useState } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Alert, useRouter } from "expo-router";
import { Alert, Ionicons } from "@expo/vector-icons";

const TYPES = ["Primary", "Secondary", "High School", "University", "College", "Vocational", "Other"];

export default function CreateSchoolScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("Primary");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "School name is required");
      return;
    }
    try {
      setLoading(true);
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase
        .from("education_institutions")
        .insert({
          name: name.trim(),
          type: type,
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          status: "active",
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      Alert.alert("Success", `"${name}" created successfully`, [
        { text: "OK", onPress: () => router.replace(`/school/${data.id}`) },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create school");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>Create School</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Register a new institution</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>School Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Kamos Academy"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 10, textTransform: "uppercase" }}>Type</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={{
                  backgroundColor: type === t ? "#0ea5e9" : "#0f172a",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  margin: 4,
                  borderWidth: 1,
                  borderColor: type === t ? "#0ea5e9" : "#334155",
                }}
              >
                <Text style={{ color: type === t ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600" }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Street, City, Country"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <View style={{ flexDirection: "row", marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginRight: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+1234567890"
              placeholderTextColor="#475569"
              keyboardType="phone-pad"
              style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
            />
          </View>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginLeft: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="school@example.com"
              placeholderTextColor="#475569"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading}
          style={{ backgroundColor: loading ? "#1e3a5f" : "#0ea5e9", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 32, flexDirection: "row", justifyContent: "center" }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="school" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>Create Institution</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}