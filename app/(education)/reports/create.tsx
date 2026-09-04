import React, { useState } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Alert, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Ionicons } from '@expo/vector-icons';

export default function CreateReportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !reportType.trim()) {
      Alert.alert("Required", "Title and report type are required.");
      return;
    }
    if (!user?.id) { Alert.alert("Error", "Not authenticated"); return; }

    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_reports").insert({
        title: title.trim(),
        report_type: reportType.trim(),
        content: content.trim() || null,
        created_by: user.id,
        status: "draft",
      });
      if (error) throw error;
      Alert.alert("Success", "Report created.");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Report</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Report title" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Report Type</Text>
        <TextInput style={styles.input} value={reportType} onChangeText={setReportType} placeholder="e.g. Academic, Financial, Attendance" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Content</Text>
        <TextInput style={[styles.input, { height: 120 }]} value={content} onChangeText={setContent} multiline placeholder="Report details..." placeholderTextColor="#64748b" />
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Report</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  title: { color: "#e2e8f0", fontSize: 18, fontWeight: "700" },
  form: { padding: 16 },
  label: { color: "#94a3b8", fontSize: 14, marginTop: 16, marginBottom: 6 },
  input: { backgroundColor: "#1e293b", color: "#e2e8f0", borderRadius: 10, padding: 14, fontSize: 15, borderWidth: 1, borderColor: "#334155" },
  button: { backgroundColor: "#60a5fa", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  buttonText: { color: "#0f172a", fontSize: 16, fontWeight: "700" },
});
