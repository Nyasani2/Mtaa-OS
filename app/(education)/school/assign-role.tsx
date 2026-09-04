import React, { useState } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Alert, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const ROLES = [
  { key: "teacher", label: "Teacher", table: "education_teachers", icon: "people" },
  { key: "student", label: "Student", table: "education_students", icon: "person" },
];

export default function AssignRoleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const schoolId = typeof id === "string" ? id : "";
  const [userId, setUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("teacher");
  const [department, setDepartment] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!userId.trim() || !schoolId) {
      Alert.alert("Error", "User ID and School ID are required");
      return;
    }
    try {
      setLoading(true);
      const { supabase } = await import("@/lib/supabase");

      if (selectedRole === "teacher") {
        const { error } = await supabase.from("education_teachers").insert({
          user_id: userId.trim(),
          institution_id: schoolId,
          department: department.trim() || undefined,
          status: "active",
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("education_students").insert({
          user_id: userId.trim(),
          institution_id: schoolId,
          grade_level: gradeLevel.trim() || undefined,
          guardian_name: guardianName.trim() || undefined,
          guardian_phone: guardianPhone.trim() || undefined,
          status: "active",
        });
        if (error) throw error;
      }

      Alert.alert("Success", `${selectedRole === "teacher" ? "Teacher" : "Student"} role assigned`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to assign role");
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
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>Assign Role</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Add user to this institution</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {/* Role Selector */}
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 10, textTransform: "uppercase" }}>Select Role</Text>
          <View style={{ flexDirection: "row" }}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                onPress={() => setSelectedRole(r.key)}
                style={{
                  flex: 1,
                  backgroundColor: selectedRole === r.key ? "#0ea5e9" : "#0f172a",
                  borderRadius: 10,
                  padding: 14,
                  marginRight: r.key === "teacher" ? 6 : 0,
                  marginLeft: r.key === "student" ? 6 : 0,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: selectedRole === r.key ? "#0ea5e9" : "#334155",
                }}
              >
                <Ionicons name={r.icon as any} size={22} color={selectedRole === r.key ? "#fff" : "#94a3b8"} />
                <Text style={{ color: selectedRole === r.key ? "#fff" : "#94a3b8", fontWeight: "700", marginTop: 6, fontSize: 14 }}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* User ID */}
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>User ID</Text>
          <TextInput
            value={userId}
            onChangeText={setUserId}
            placeholder="Enter user UUID"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        {/* Teacher fields */}
        {selectedRole === "teacher" && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Department</Text>
            <TextInput
              value={department}
              onChangeText={setDepartment}
              placeholder="e.g. Mathematics, Science"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
            />
          </View>
        )}

        {/* Student fields */}
        {selectedRole === "student" && (
          <>
            <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Grade Level</Text>
              <TextInput
                value={gradeLevel}
                onChangeText={setGradeLevel}
                placeholder="e.g. Grade 10, Form 4"
                placeholderTextColor="#475569"
                style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
              />
            </View>
            <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Guardian Name</Text>
              <TextInput
                value={guardianName}
                onChangeText={setGuardianName}
                placeholder="Parent/Guardian name"
                placeholderTextColor="#475569"
                style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
              />
            </View>
            <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Guardian Phone</Text>
              <TextInput
                value={guardianPhone}
                onChangeText={setGuardianPhone}
                placeholder="+1234567890"
                placeholderTextColor="#475569"
                keyboardType="phone-pad"
                style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
              />
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={handleAssign}
          disabled={loading}
          style={{ backgroundColor: loading ? "#1e3a5f" : "#0ea5e9", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 32, flexDirection: "row", justifyContent: "center" }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>Assign {selectedRole === "teacher" ? "Teacher" : "Student"}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
