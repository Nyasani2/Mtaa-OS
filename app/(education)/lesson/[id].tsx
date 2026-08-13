// @ts-nocheck
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function LessonViewerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [resources, setResources] = useState([]);

  const loadLesson = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data: l } = await supabase.from("education_lessons").select("*").eq("id", id).maybeSingle();
      setLesson(l);

      if (l?.course_id) {
        const { data: c } = await supabase.from("education_courses").select("title, subject").eq("id", l.course_id).maybeSingle();
        setCourse(c);
      }

      const { data: prog } = await supabase.from("education_lesson_progress")
        .select("progress_percent, completed")
        .eq("lesson_id", id).eq("student_id", user?.id).maybeSingle();
      if (prog) { setProgress(prog.progress_percent || 0); setCompleted(prog.completed || false); }

      const { data: res } = await supabase.from("education_resources")
        .select("*").eq("lesson_id", id).order("created_at", { ascending: true });
      setResources(res || []);
    } catch (err) { console.error("[LessonViewer] load error:", err); }
    finally { setLoading(false); }
  }, [id, user?.id]);

  useEffect(() => { loadLesson(); }, [loadLesson]);

  const markComplete = async () => {
    if (!lesson || !user?.id) return;
    try {
      const { data: existing } = await supabase.from("education_lesson_progress")
        .select("id").eq("lesson_id", lesson.id).eq("student_id", user.id).maybeSingle();

      if (existing) {
        await supabase.from("education_lesson_progress").update({
          progress_percent: 100, completed: true, completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("education_lesson_progress").insert({
          lesson_id: lesson.id, student_id: user.id, course_id: lesson.course_id,
          progress_percent: 100, completed: true, completed_at: new Date().toISOString(),
        });
      }
      setProgress(100); setCompleted(true);
      Alert.alert("Done", "Lesson marked as complete");
    } catch (err) { Alert.alert("Error", err.message || "Failed"); }
  };

  const updateProgress = async (pct) => {
    if (!lesson || !user?.id) return;
    try {
      const { data: existing } = await supabase.from("education_lesson_progress")
        .select("id").eq("lesson_id", lesson.id).eq("student_id", user.id).maybeSingle();
      if (existing) {
        await supabase.from("education_lesson_progress").update({
          progress_percent: pct, updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("education_lesson_progress").insert({
          lesson_id: lesson.id, student_id: user.id, course_id: lesson.course_id,
          progress_percent: pct, completed: false,
        });
      }
      setProgress(pct);
    } catch (err) { console.error("Progress update error:", err); }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 12 }}>Loading lesson...</Text>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Ionicons name="book-outline" size={48} color="#334155" />
        <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "700", marginTop: 16 }}>Lesson Not Found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "800", flex: 1 }} numberOfLines={1}>{lesson.title}</Text>
        </View>
        <Text style={{ color: "#94a3b8", fontSize: 13 }}>{course?.title || "Course"} &middot; {course?.subject || "General"}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Progress bar */}
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700" }}>PROGRESS</Text>
            <Text style={{ color: "#3b82f6", fontSize: 12, fontWeight: "700" }}>{progress}%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
            <View style={{ width: `${progress}%`, height: "100%", backgroundColor: completed ? "#10b981" : "#3b82f6", borderRadius: 3 }} />
          </View>
        </View>

        {/* Content */}
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "700", marginBottom: 12 }}>Lesson Content</Text>
          <Text style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 22 }}>{lesson.content || "No content provided for this lesson."}</Text>
        </View>

        {/* Objectives */}
        {lesson.objectives && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "700", marginBottom: 10 }}>Learning Objectives</Text>
            {(Array.isArray(lesson.objectives) ? lesson.objectives : [lesson.objectives]).map((obj, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#3b82f6" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={{ color: "#cbd5e1", fontSize: 14, flex: 1 }}>{obj}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Resources */}
        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase" }}>Resources ({resources.length})</Text>
        {resources.length === 0 ? (
          <Text style={{ color: "#64748b", paddingVertical: 12 }}>No additional resources</Text>
        ) : (
          resources.map((res) => (
            <TouchableOpacity key={res.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                <Ionicons name={res.resource_type === "video" ? "videocam" : res.resource_type === "pdf" ? "document" : "link"} size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{res.title}</Text>
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>{res.resource_type}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#64748b" />
            </TouchableOpacity>
          ))
        )}

        {/* Mark Complete */}
        {!completed ? (
          <TouchableOpacity onPress={markComplete} style={{ backgroundColor: "#059669", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, flexDirection: "row", justifyContent: "center", gap: 8 }}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Mark as Complete</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ backgroundColor: "#064e3b", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, flexDirection: "row", justifyContent: "center", gap: 8 }}>
            <Ionicons name="checkmark-done-circle" size={20} color="#6ee7b7" />
            <Text style={{ color: "#6ee7b7", fontSize: 16, fontWeight: "700" }}>Completed</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
