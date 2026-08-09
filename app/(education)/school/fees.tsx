import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from "@expo/vector-icons";

export default function SchoolFeesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const schoolId = typeof id === "string" ? id : "";
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [feeType, setFeeType] = useState("Tuition");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const [f, s] = await Promise.all([
        EducationService.getFees(),
        EducationService.getStudents(schoolId),
      ]);
      // Filter fees for this school's students
      const studentIds = new Set(s.map((st: any) => st.id));
      const schoolFees = f.filter((fee: any) => studentIds.has(fee.student_id) || fee.institution_id === schoolId);
      setFees(schoolFees);
      setStudents(s);
    } catch (err: any) {
      setError(err.message || "Failed to load school fees");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (schoolId) load(); }, [schoolId]);

  const handleCreate = async () => {
    if (!studentId.trim() || !amount.trim() || !feeType.trim()) {
      Alert.alert("Error", "Student, fee type, and amount are required");
      return;
    }
    try {
      setCreating(true);
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_fees").insert({
        student_id: studentId.trim(),
        institution_id: schoolId,
        fee_type: feeType.trim(),
        amount: parseFloat(amount),
        currency: currency.trim() || "USD",
        due_date: dueDate.trim() || undefined,
        paid_amount: 0,
        status: "pending",
      });
      if (error) throw error;
      Alert.alert("Success", "Fee record created");
      setShowCreate(false);
      setStudentId(""); setAmount(""); setDueDate("");
      load();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create fee");
    } finally {
      setCreating(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "paid": return { bg: "#064e3b", text: "#6ee7b7" };
      case "partial": return { bg: "#451a03", text: "#fcd34d" };
      case "overdue": return { bg: "#450a0a", text: "#fca5a5" };
      default: return { bg: "#1e3a5f", text: "#7dd3fc" };
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#0f172a", borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800" }}>School Fees</Text>
        <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>Manage fee records for this institution</Text>
      </View>

      {error && (
        <View style={{ backgroundColor: "#7f1d1d", marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 8 }}>
          <Text style={{ color: "#fecaca" }}>{error}</Text>
        </View>
      )}

      {showCreate && (
        <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: "#1e293b", borderRadius: 12, padding: 16 }}>
          <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "700", marginBottom: 12 }}>Create Fee Record</Text>
          <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Student</Text>
          <TextInput
            value={studentId}
            onChangeText={setStudentId}
            placeholder="Student UUID"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 10, color: "#f8fafc", fontSize: 14, borderWidth: 1, borderColor: "#334155", marginBottom: 10 }}
          />
          <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Fee Type</Text>
          <TextInput
            value={feeType}
            onChangeText={setFeeType}
            placeholder="e.g. Tuition, Exam Fee"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 10, color: "#f8fafc", fontSize: 14, borderWidth: 1, borderColor: "#334155", marginBottom: 10 }}
          />
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Amount</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#475569"
                style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 10, color: "#f8fafc", fontSize: 14, borderWidth: 1, borderColor: "#334155" }}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Currency</Text>
              <TextInput
                value={currency}
                onChangeText={setCurrency}
                placeholder="USD"
                placeholderTextColor="#475569"
                style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 10, color: "#f8fafc", fontSize: 14, borderWidth: 1, borderColor: "#334155" }}
              />
            </View>
          </View>
          <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6, marginTop: 10, textTransform: "uppercase" }}>Due Date (YYYY-MM-DD)</Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-08-31"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 10, color: "#f8fafc", fontSize: 14, borderWidth: 1, borderColor: "#334155", marginBottom: 12 }}
          />
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity onPress={() => setShowCreate(false)} style={{ flex: 1, backgroundColor: "#334155", borderRadius: 8, padding: 12, alignItems: "center", marginRight: 6 }}>
              <Text style={{ color: "#cbd5e1", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreate} disabled={creating} style={{ flex: 1, backgroundColor: creating ? "#1e3a5f" : "#0ea5e9", borderRadius: 8, padding: 12, alignItems: "center", marginLeft: 6 }}>
              {creating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Create</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={fees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#38bdf8" />}
        renderItem={({ item }) => {
          const sc = statusColor(item.status);
          const remaining = (item.amount || 0) - (item.paid_amount || 0);
          return (
            <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "700" }}>{item.fee_type}</Text>
                <View style={{ backgroundColor: sc.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: sc.text, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>{item.status}</Text>
                </View>
              </View>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>Student: {item.student_id.slice(0, 8)}...</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                <Text style={{ color: "#64748b" }}>Amount: {item.currency || "$"}{item.amount?.toLocaleString()}</Text>
                <Text style={{ color: remaining > 0 ? "#f87171" : "#6ee7b7", fontWeight: "600" }}>Due: {item.currency || "$"}{remaining.toLocaleString()}</Text>
              </View>
              {item.due_date && (
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons name="receipt-outline" size={48} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 12 }}>No fee records for this school</Text>
          </View>
        }
      />

      {!showCreate && (
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={{ position: "absolute", right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#0ea5e9", justifyContent: "center", alignItems: "center", elevation: 6 }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
