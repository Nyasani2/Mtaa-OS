import React, { useState, useEffect } from 'react';

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from "expo-router";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from '@expo/vector-icons';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const studentId = typeof id === "string" ? id : "";
  const [student, setStudent] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: s, error: se } = await supabase.from("education_students").select("*").eq("id", studentId).maybeSingle();
        if (se) throw se;
        setStudent(s);

        const [sch, g, f] = await Promise.all([
          s?.institution_id ? EducationService.getInstitutionById(s.institution_id) : Promise.resolve(null),
          EducationService.getGrades(studentId),
          EducationService.getFees(studentId),
        ]);
        setSchool(sch);
        setGrades(g.slice(0, 5));
        setFees(f.slice(0, 5));
      } catch (err: any) {
        setError(err.message || "Failed to load student");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  if (error || !student) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ color: "#f87171", marginTop: 12, fontSize: 16 }}>{error || "Student not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, backgroundColor: "#1e293b", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
          <Text style={{ color: "#38bdf8", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gradeColor = (g: string) => {
    if (!g) return { bg: "#334155", text: "#cbd5e1" };
    const upper = g.toUpperCase();
    if (["A+", "A", "A-"].includes(upper)) return { bg: "#064e3b", text: "#6ee7b7" };
    if (["B+", "B", "B-"].includes(upper)) return { bg: "#1e3a5f", text: "#7dd3fc" };
    if (["C+", "C", "C-"].includes(upper)) return { bg: "#451a03", text: "#fcd34d" };
    return { bg: "#450a0a", text: "#fca5a5" };
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#10b981", justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="person" size={28} color="#fff" />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800" }}>{student.enrollment_number || "Student"}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>Grade: {student.grade_level || "N/A"}</Text>
            <View style={{ flexDirection: "row", marginTop: 4 }}>
              <View style={{ backgroundColor: student.status === "active" ? "#064e3b" : "#451a03", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: student.status === "active" ? "#6ee7b7" : "#fcd34d", fontSize: 11, fontWeight: "600" }}>{student.status}</Text>
              </View>
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

      {/* Guardian */}
      {(student.guardian_name || student.guardian_phone) && (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 10, textTransform: "uppercase" }}>Guardian</Text>
            {student.guardian_name && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Ionicons name="person-outline" size={16} color="#64748b" />
                <Text style={{ color: "#f8fafc", fontSize: 14, marginLeft: 8 }}>{student.guardian_name}</Text>
              </View>
            )}
            {student.guardian_phone && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="call-outline" size={16} color="#64748b" />
                <Text style={{ color: "#94a3b8", fontSize: 14, marginLeft: 8 }}>{student.guardian_phone}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Grades */}
      {grades.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Recent Grades</Text>
          {grades.map((g) => {
            const gc = gradeColor(g.grade_letter);
            return (
              <View key={g.id} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{g.subject || "Subject"}</Text>
                  <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{g.score} / {g.max_score || "N/A"}</Text>
                </View>
                <View style={{ backgroundColor: gc.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: gc.text, fontSize: 14, fontWeight: "800" }}>{g.grade_letter || "N/A"}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Fees */}
      {fees.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Fee Status</Text>
          {fees.map((f) => {
            const remaining = (f.amount || 0) - (f.paid_amount || 0);
            const sc = f.status === "paid" ? { bg: "#064e3b", text: "#6ee7b7" } : f.status === "overdue" ? { bg: "#450a0a", text: "#fca5a5" } : { bg: "#1e3a5f", text: "#7dd3fc" };
            return (
              <View key={f.id} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{f.fee_type}</Text>
                  <View style={{ backgroundColor: sc.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: sc.text, fontSize: 10, fontWeight: "700" }}>{f.status}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#64748b", fontSize: 12 }}>{f.currency || "$"}{f.amount?.toLocaleString()}</Text>
                  <Text style={{ color: remaining > 0 ? "#f87171" : "#6ee7b7", fontSize: 12, fontWeight: "600" }}>Due: {f.currency || "$"}{remaining.toLocaleString()}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}