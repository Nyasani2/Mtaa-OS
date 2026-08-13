import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from "@expo/vector-icons";

export default function TeacherDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const teacherId = typeof id === "string" ? id : "";
  const [teacher, setTeacher] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) return;
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: t, error: te } = await supabase.from("education_teachers").select("*").eq("id", teacherId).maybeSingle();
        if (te) throw te;
        setTeacher(t);

        const [s, a, c] = await Promise.all([
          t?.institution_id ? EducationService.getInstitutionById(t.institution_id) : Promise.resolve(null),
          EducationService.getAssignments(t?.institution_id),
          EducationService.getClasses(t?.institution_id),
        ]);
        setSchool(s);
        setAssignments(a.filter((x: any) => x.teacher_id === teacherId).slice(0, 5));
        setClasses(c.filter((x: any) => x.teacher_id === teacherId).slice(0, 5));
      } catch (err: any) {
        setError(err.message || "Failed to load teacher");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teacherId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  if (error || !teacher) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ color: "#f87171", marginTop: 12, fontSize: 16 }}>{error || "Teacher not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, backgroundColor: "#1e293b", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
          <Text style={{ color: "#38bdf8", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#8b5cf6", justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="person" size={28} color="#fff" />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800" }}>{teacher.department || "Teacher"}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{teacher.specialization || teacher.qualification || "No specialization"}</Text>
            <View style={{ flexDirection: "row", marginTop: 4 }}>
              <View style={{ backgroundColor: teacher.status === "active" ? "#064e3b" : "#451a03", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: teacher.status === "active" ? "#6ee7b7" : "#fcd34d", fontSize: 11, fontWeight: "600" }}>{teacher.status}</Text>
              </View>
              <Text style={{ color: "#64748b", fontSize: 12, marginLeft: 8 }}>{teacher.employment_type || "Full-time"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* School */}
      {school && (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.push(`/school/${school.id}` as any)}
            style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center" }}
          >
            <Ionicons name="school" size={20} color="#0ea5e9" />
            <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600", marginLeft: 10, flex: 1 }}>{school.name}</Text>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      )}

      {/* Details */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 10, textTransform: "uppercase" }}>Details</Text>
          {teacher.qualification && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ color: "#64748b" }}>Qualification</Text>
              <Text style={{ color: "#f8fafc", fontWeight: "600" }}>{teacher.qualification}</Text>
            </View>
          )}
          {teacher.salary_grade && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ color: "#64748b" }}>Salary Grade</Text>
              <Text style={{ color: "#f8fafc", fontWeight: "600" }}>{teacher.salary_grade}</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#64748b" }}>Joined</Text>
            <Text style={{ color: "#f8fafc", fontWeight: "600" }}>{new Date(teacher.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>

      {/* Recent Assignments */}
      {assignments.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Recent Assignments</Text>
          {assignments.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => router.push(`/assignments/${a.id}` as any)}
              style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8 }}
            >
              <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{a.title}</Text>
              <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : "N/A"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Classes */}
      {classes.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Classes</Text>
          {classes.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => router.push(`/class/${c.id}` as any)}
              style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" }}
            >
              <Ionicons name="easel" size={18} color="#f59e0b" />
              <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600", marginLeft: 10, flex: 1 }}>{c.name}</Text>
              <Text style={{ color: "#64748b", fontSize: 12 }}>{c.grade_level}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}