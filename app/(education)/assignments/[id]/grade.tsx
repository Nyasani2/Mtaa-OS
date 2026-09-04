import { Alert, useState } from 'react';
import React, { useEffect, useState } from "react";
import { Alert, View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Alert, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, Ionicons } from "@expo/vector-icons";

export default function GradeSubmissionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const submissionId = typeof id === "string" ? id : "";

  const [submission, setSubmission] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!submissionId) return;
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: sub, error: se } = await supabase
          .from("education_assignment_submissions")
          .select("*, student:student_id(full_name), assignment:assignment_id(*)")
          .eq("id", submissionId)
          .maybeSingle();
        if (se) throw se;
        setSubmission(sub);
        setAssignment(sub?.assignment);
        setStudent(sub?.student);
        if (sub?.score != null) setScore(sub.score.toString());
        if (sub?.feedback) setFeedback(sub.feedback);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load submission");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [submissionId]);

  const handleSave = async () => {
    if (!user?.id || !submissionId) return;
    const numericScore = parseFloat(score);
    if (isNaN(numericScore) || numericScore < 0) {
      Alert.alert("Invalid Score", "Please enter a valid number.");
      return;
    }
    const maxScore = assignment?.max_score || 100;
    if (numericScore > maxScore) {
      Alert.alert("Score Too High", `Maximum score for this assignment is ${maxScore}.`);
      return;
    }

    setSaving(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_assignment_submissions").update({
        score: numericScore,
        feedback: feedback.trim() || null,
        graded_by: user.id,
        graded_at: new Date().toISOString(),
        status: "graded",
      }).eq("id", submissionId);
      if (error) throw error;

      Alert.alert("Saved", "Grade and feedback have been saved.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert("Save Failed", err.message || "Could not save grade.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  const maxScore = assignment?.max_score || 100;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }} contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 40 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <Ionicons name="arrow-back" size={20} color="#94a3b8" />
        <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
      </TouchableOpacity>

      <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800", marginBottom: 4 }}>Grade Submission</Text>
      <Text style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>{assignment?.title || "Assignment"}</Text>

      <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "#38bdf8", fontWeight: "700", fontSize: 16 }}>{(student?.full_name || "S").charAt(0)}</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600" }}>{student?.full_name || "Student"}</Text>
            <Text style={{ color: "#64748b", fontSize: 12 }}>Submitted {submission?.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "N/A"}</Text>
          </View>
        </View>
        {submission?.submission_text && (
          <View style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, marginBottom: 10 }}>
            <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 6 }}>Submission</Text>
            <Text style={{ color: "#f8fafc", fontSize: 14, lineHeight: 20 }}>{submission.submission_text}</Text>
          </View>
        )}
        {submission?.attachment_url && (
          <TouchableOpacity onPress={() => {}} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#0f172a", borderRadius: 8, padding: 10 }}>
            <Ionicons name="document-attach" size={18} color="#0ea5e9" />
            <Text style={{ color: "#0ea5e9", marginLeft: 8, fontSize: 13, flex: 1 }} numberOfLines={1}>{submission.attachment_url}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 8 }}>Score (out of {maxScore})</Text>
      <TextInput
        value={score}
        onChangeText={setScore}
        placeholder="0"
        placeholderTextColor="#475569"
        keyboardType="numeric"
        style={{ color: "#f8fafc", fontSize: 18, fontWeight: "700", backgroundColor: "#1e293b", borderRadius: 10, padding: 14, marginBottom: 16 }}
      />

      <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 8 }}>Feedback</Text>
      <TextInput
        value={feedback}
        onChangeText={setFeedback}
        placeholder="Write feedback for the student..."
        placeholderTextColor="#475569"
        multiline
        style={{ color: "#f8fafc", fontSize: 14, lineHeight: 20, backgroundColor: "#1e293b", borderRadius: 10, padding: 14, minHeight: 120, textAlignVertical: "top", marginBottom: 24 }}
      />

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{ backgroundColor: "#0ea5e9", paddingVertical: 14, borderRadius: 12, alignItems: "center", opacity: saving ? 0.6 : 1 }}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Save Grade</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}