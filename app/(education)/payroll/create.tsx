import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { Ionicons } from "@expo/vector-icons";

export default function CreatePayrollScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [staffId, setStaffId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [bonuses, setBonuses] = useState("");
  const [deductions, setDeductions] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!staffId.trim() || !baseSalary.trim() || !month.trim() || !year.trim()) {
      Alert.alert("Required", "Staff ID, base salary, month and year are required.");
      return;
    }
    if (!user?.id) { Alert.alert("Error", "Not authenticated"); return; }

    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_payroll").insert({
        staff_id: staffId.trim(),
        base_salary: parseFloat(baseSalary),
        bonuses: parseFloat(bonuses) || 0,
        deductions: parseFloat(deductions) || 0,
        month: month.trim(),
        year: parseInt(year),
        created_by: user.id,
        status: "draft",
      });
      if (error) throw error;
      Alert.alert("Success", "Payroll entry created.");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create payroll");
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
        <Text style={styles.title}>Create Payroll</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Staff ID</Text>
        <TextInput style={styles.input} value={staffId} onChangeText={setStaffId} placeholder="Enter staff ID" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Base Salary</Text>
        <TextInput style={styles.input} value={baseSalary} onChangeText={setBaseSalary} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Bonuses</Text>
        <TextInput style={styles.input} value={bonuses} onChangeText={setBonuses} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Deductions</Text>
        <TextInput style={styles.input} value={deductions} onChangeText={setDeductions} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Month</Text>
        <TextInput style={styles.input} value={month} onChangeText={setMonth} placeholder="e.g. January" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Year</Text>
        <TextInput style={styles.input} value={year} onChangeText={setYear} keyboardType="number-pad" placeholder="2026" placeholderTextColor="#64748b" />
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Payroll</Text>}
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
