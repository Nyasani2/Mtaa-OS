// @ts-nocheck
import React, { useState, useEffect } from 'react';

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from "expo-router";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from '@expo/vector-icons';

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const classId = typeof id === "string" ? id : "";
  const [cls, setCls] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: c, error: ce } = await supabase.from("education_classes").select("*").eq("id", classId).maybeSingle();
        if (ce) throw ce;
        if (!c) { setError("Class not found"); setLoading(false); return; }
        setCls(c);
        const [s, t, allStudents, allTimetable] = await Promise.all([
          c?.institution_id ? EducationService.getInstitutionById(c.institution_id) : Promise.resolve(null),
          c?.teacher_id ? supabase.from("education_teachers").select("*").eq("id", c.teacher_id).maybeSingle().then((r: any) => r.data) : Promise.resolve(null),
          EducationService.getStudents(c?.institution_id),
          EducationService.getTimetable(c?.institution_id),
        ]);
        setSchool(s);
        setTeacher(t);
        setStudents(allStudents.slice(0, 8));
        setTimetable(allTimetable.filter((x: any) => x.class_id === classId).slice(0, 5));
      } catch (err: any) {
        setError(err.message || "Failed to load class");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId]);

  if (loading) return <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#38bdf8" /></View>;
  if (error || !cls) return (
    <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
      <Text style={{ color: "#f87171", marginTop: 12, fontSize: 16 }}>{error || "Class not found"}</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, backgroundColor: "#1e293b", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
        <Text style={{ color: "#38bdf8", fontWeight: "600" }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>{cls.name}</Text>
        <View style={{ flexDirection: "row", marginTop: 6, alignItems: "center" }}>
          <View style={{ backgroundColor: "#0f172a", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ color: "#38bdf8", fontSize: 12, fontWeight: "700" }}>{cls.grade_level || "N/A"}</Text>
          </View>
          <Text style={{ color: "#64748b", fontSize: 13, marginLeft: 10 }}>Room: {cls.room_number || "N/A"} &bull; Cap: {cls.capacity || "N/A"}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        {school && (
          <TouchableOpacity onPress={() => router.push(`/(education as any)/school/${school.id}` as any)} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <Ionicons name="school" size={20} color="#0ea5e9" />
            <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600", marginLeft: 10, flex: 1 }}>{school.name}</Text>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
        {teacher && (
          <TouchableOpacity onPress={() => router.push(`/(education as any)/teacher/${teacher.id}` as any)} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="person" size={20} color="#8b5cf6" />
            <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600", marginLeft: 10, flex: 1 }}>{teacher.department || "Teacher"}</Text>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {timetable.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Schedule</Text>
          {timetable.map((t) => (
            <View key={t.id} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <Text style={{ color: "#f8fafc", fontWeight: "600" }}>{t.subject?.name || "Subject"}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{DAYS[new Date(t.date).getDay()]} &bull; {t.start_time} - {t.end_time}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Students ({students.length})</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {students.map((s) => (
            <TouchableOpacity key={s.id} onPress={() => router.push(`/(education as any)/student/${s.id}` as any)} style={{ width: "47%", backgroundColor: "#1e293b", borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "#38bdf8", fontWeight: "700" }}>{(s.full_name || "S").charAt(0)}</Text>
              </View>
              <Text style={{ color: "#f8fafc", fontSize: 13, fontWeight: "500", marginLeft: 8, flex: 1 }} numberOfLines={1}>{s.full_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}