import React, { useState, useEffect } from 'react';

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from "expo-router";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from '@expo/vector-icons';

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const schoolId = typeof id === "string" ? id : "";
  const [school, setSchool] = useState<any>(null);
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0, events: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    const load = async () => {
      try {
        const [s, t, st, c, e] = await Promise.all([
          EducationService.getInstitutionById(schoolId),
          EducationService.getTeachers(schoolId),
          EducationService.getStudents(schoolId),
          EducationService.getClasses(schoolId),
          EducationService.getEvents(schoolId),
        ]);
        setSchool(s);
        setStats({ teachers: t.length, students: st.length, classes: c.length, events: e.length });
      } catch (err: any) {
        setError(err.message || "Failed to load school");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [schoolId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  if (error || !school) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ color: "#f87171", marginTop: 12, fontSize: 16 }}>{error || "School not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, backgroundColor: "#1e293b", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
          <Text style={{ color: "#38bdf8", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statCards = [
    { label: "Teachers", count: stats.teachers, icon: "people", color: "#8b5cf6", route: "/teachers" },
    { label: "Students", count: stats.students, icon: "person", color: "#10b981", route: "/students" },
    { label: "Classes", count: stats.classes, icon: "easel", color: "#f59e0b", route: "/classes" },
    { label: "Events", count: stats.events, icon: "calendar", color: "#ec4899", route: "/events" },
  ];

  const actions = [
    { label: "Manage Fees", icon: "receipt", route: `/school/fees?id=${schoolId}`, color: "#0ea5e9" },
    { label: "Assign Role", icon: "person-add", route: `/school/assign-role?id=${schoolId}`, color: "#8b5cf6" },
    { label: "Timetable", icon: "calendar", route: "/timetable", color: "#10b981" },
    { label: "Emergency", icon: "warning", route: "/emergency", color: "#ef4444" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#0ea5e9", justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="school" size={28} color="#fff" />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800" }} numberOfLines={1}>{school.name}</Text>
            <View style={{ flexDirection: "row", marginTop: 4, alignItems: "center" }}>
              <View style={{ backgroundColor: school.status === "active" ? "#064e3b" : "#451a03", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: school.status === "active" ? "#6ee7b7" : "#fcd34d", fontSize: 11, fontWeight: "600" }}>{school.status}</Text>
              </View>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginLeft: 8 }}>{school.type}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Info */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16 }}>
          {school.address && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="location-outline" size={16} color="#64748b" />
              <Text style={{ color: "#94a3b8", fontSize: 14, marginLeft: 8 }}>{school.address}</Text>
            </View>
          )}
          {school.phone && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="call-outline" size={16} color="#64748b" />
              <Text style={{ color: "#94a3b8", fontSize: 14, marginLeft: 8 }}>{school.phone}</Text>
            </View>
          )}
          {school.email && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="mail-outline" size={16} color="#64748b" />
              <Text style={{ color: "#94a3b8", fontSize: 14, marginLeft: 8 }}>{school.email}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, marginBottom: 8 }}>
        {statCards.map((s) => (
          <TouchableOpacity
            key={s.label}
            onPress={() => router.push(s.route as any)}
            style={{ width: "50%", padding: 4 }}
          >
            <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: s.color + "22", justifyContent: "center", alignItems: "center", marginBottom: 6 }}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "800" }}>{s.count}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{s.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions */}
      <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 32 }}>
        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 12, textTransform: "uppercase" }}>Actions</Text>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.label}
            onPress={() => router.push(a.route as any)}
            style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center" }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: a.color + "22", justifyContent: "center", alignItems: "center" }}>
              <Ionicons name={a.icon as any} size={18} color={a.color} />
            </View>
            <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600", marginLeft: 12, flex: 1 }}>{a.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
