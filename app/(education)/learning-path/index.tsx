import { useState } from 'react';
// @ts-nocheck
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Ionicons } from '@expo/vector-icons';

export default function LearningPathScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [achievements, setAchievements] = useState([]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: enr } = await supabase.from("education_enrollments")
        .select("*, education_courses(title, subject, total_lessons)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      setEnrollments(enr || []);

      const totalLessons = (enr || []).reduce((sum, e) => sum + (e.education_courses?.total_lessons || 0), 0);
      const completedLessons = (enr || []).reduce((sum, e) => sum + (e.completed_lessons || 0), 0);
      setOverallProgress(totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0);

      const { data: ach } = await supabase.from("education_achievements")
        .select("*").eq("student_id", user.id).order("awarded_at", { ascending: false }).limit(10);
      setAchievements(ach || []);
    } catch (err) { console.error("[LearningPath] load error:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 12 }}>Loading your learning path...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", flex: 1 }}>My Learning Path</Text>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#38bdf8" />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Overall Progress */}
        <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "700" }}>Overall Progress</Text>
            <Text style={{ color: "#3b82f6", fontSize: 24, fontWeight: "800" }}>{overallProgress}%</Text>
          </View>
          <View style={{ height: 10, backgroundColor: "#0f172a", borderRadius: 5, overflow: "hidden" }}>
            <View style={{ width: `${overallProgress}%`, height: "100%", backgroundColor: overallProgress >= 80 ? "#10b981" : overallProgress >= 50 ? "#3b82f6" : "#f59e0b", borderRadius: 5 }} />
          </View>
        </View>

        {/* Enrolled Courses */}
        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>My Courses</Text>
        {enrollments.length === 0 ? (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="book-outline" size={32} color="#334155" />
            <Text style={{ color: "#64748b", marginTop: 8 }}>Not enrolled in any courses</Text>
          </View>
        ) : (
          enrollments.map((e) => {
            const pct = e.education_courses?.total_lessons ? Math.round(((e.completed_lessons || 0) / e.education_courses.total_lessons) * 100) : 0;
            return (
              <TouchableOpacity key={e.id} onPress={() => router.push(`/courses/${e.course_id}` as any)} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600" }}>{e.education_courses?.title || "Course"}</Text>
                  <Text style={{ color: "#3b82f6", fontSize: 14, fontWeight: "700" }}>{pct}%</Text>
                </View>
                <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 10 }}>{e.education_courses?.subject || ""}</Text>
                <View style={{ height: 6, backgroundColor: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ width: `${pct}%`, height: "100%", backgroundColor: pct >= 80 ? "#10b981" : "#3b82f6", borderRadius: 3 }} />
                </View>
                <Text style={{ color: "#64748b", fontSize: 11, marginTop: 6 }}>{e.completed_lessons || 0} / {e.education_courses?.total_lessons || 0} lessons completed</Text>
              </TouchableOpacity>
            );
          })
        )}

        {/* Achievements */}
        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, marginTop: 8, textTransform: "uppercase" }}>Achievements</Text>
        {achievements.length === 0 ? (
          <Text style={{ color: "#64748b", paddingVertical: 12 }}>No achievements yet</Text>
        ) : (
          achievements.map((a) => (
            <View key={a.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#451a03", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                <Ionicons name="trophy" size={20} color="#fbbf24" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{a.title}</Text>
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{a.description}</Text>
              </View>
              <Text style={{ color: "#94a3b8", fontSize: 11 }}>{new Date(a.awarded_at).toLocaleDateString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
