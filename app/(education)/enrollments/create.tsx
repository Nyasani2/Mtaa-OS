import React, { useState } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Alert, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, Ionicons } from "@expo/vector-icons";

export default function CreateEnrollmentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!studentId.trim() || !classId.trim() || !academicYear.trim()) {
      Alert.alert("Required", "Student, class and academic year are required.");
      return;
    }
    if (!user?.id) { Alert.alert("Error", "Not authenticated"); return; }

    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_enrollments").insert({
        student_id: studentId.trim(),
        class_id: classId.trim(),
        academic_year: academicYear.trim(),
        term: term.trim() || null,
        enrolled_by: user.id,
        status: "active",
      });
      if (error) throw error;
      Alert.alert("Success", "Enrollment created.");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create enrollment");
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
        <Text style={styles.title}>New Enrollment</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Student ID</Text>
        <TextInput style={styles.input} value={studentId} onChangeText={setStudentId} placeholder="Enter student ID" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Class ID</Text>
        <TextInput style={styles.input} value={classId} onChangeText={setClassId} placeholder="Enter class ID" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Academic Year</Text>
        <TextInput style={styles.input} value={academicYear} onChangeText={setAcademicYear} placeholder="e.g. 2025-2026" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Term (optional)</Text>
        <TextInput style={styles.input} value={term} onChangeText={setTerm} placeholder="e.g. Term 1" placeholderTextColor="#64748b" />
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enroll Student</Text>}
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
