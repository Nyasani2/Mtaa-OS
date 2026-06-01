import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useIdentity } from "@/lib/auth/identity";
import { supabase } from "@/lib/supabase/client";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useIdentity();
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState(user?.user_metadata?.phone || "");
  const [bio, setBio] = useState(user?.user_metadata?.bio || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await updateProfile({
      full_name: name,
      phone,
      bio,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    // Also update profiles table
    const { error: dbError } = await supabase
      .from("profiles")
      .upsert({
        id: user?.id,
        full_name: name,
        phone,
        bio,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      Alert.alert("Database Error", dbError.message);
      return;
    }

    Alert.alert("Success", "Profile updated");
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}</Text>
        </View>
        <TouchableOpacity style={styles.changePhotoBtn}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#64748B" />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="2547XXXXXXXX" placeholderTextColor="#64748B" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={[styles.input, { color: "#64748B" }]} value={user?.email || ""} editable={false} />

        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} value={bio} onChangeText={setBio} multiline placeholder="Tell us about yourself" placeholderTextColor="#64748B" />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveText}>{loading ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "700" },
  changePhotoBtn: { marginTop: 12 },
  changePhotoText: { color: "#6366F1", fontSize: 14, fontWeight: "600" },
  form: { paddingHorizontal: 16, gap: 16 },
  label: { color: "#94A3B8", fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15 },
  saveBtn: { backgroundColor: "#6366F1", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8, marginBottom: 32 },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
