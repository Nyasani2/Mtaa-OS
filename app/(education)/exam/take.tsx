import { Alert, useState } from 'react';

import React, { useEffect, useState, useRef } from "react";
import { Alert, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Alert, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, Ionicons } from "@expo/vector-icons";

export default function ExamTakeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const examId = typeof id === "string" ? id : "";

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitRef = useRef(false);

  useEffect(() => {
    if (!examId) return;
    const load = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: ev, error: ee } = await supabase.from("education_exams").select("*").eq("id", examId).maybeSingle();
        if (ee) throw ee;
        setExam(ev);

        const { data: q } = await supabase.from("education_exam_questions").select("*").eq("exam_id", examId).order("order_index");
        setQuestions(q || []);

        if (ev.duration_minutes) {
          setTimeLeft(ev.duration_minutes * 60);
        }
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load exam");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examId]);

  useEffect(() => {
    if (timeLeft <= 0 || submitted || loading) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!autoSubmitRef.current) {
            autoSubmitRef.current = true;
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft, submitted, loading]);

  const handleAutoSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      await submitToDatabase(true);
      Alert.alert("Time's Up!", "Your exam has been automatically submitted.", [{ text: "OK", onPress: () => router.replace("/(education)/student-dashboard") }]);
    } catch (err: any) {
      Alert.alert("Auto-Submit Failed", err.message || "Please contact your teacher.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    const answered = Object.keys(answers).length;
    const total = questions.length;
    Alert.alert(
      "Submit Exam?",
      `You have answered ${answered} of ${total} questions. ${answered < total ? "Some questions are unanswered." : ""}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setSubmitting(true);
            try {
              await submitToDatabase(false);
              setSubmitted(true);
              if (timerRef.current) clearInterval(timerRef.current);
              Alert.alert("Submitted!", "Your exam has been submitted successfully.", [{ text: "OK", onPress: () => router.replace("/(education)/student-dashboard") }]);
            } catch (err: any) {
              Alert.alert("Submit Failed", err.message);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const submitToDatabase = async (isAuto: boolean) => {
    if (!user?.id || !examId) throw new Error("Missing user or exam");
    const { supabase } = await import("@/lib/supabase");
    const score = calculateScore();
    const timeSpent = exam?.duration_minutes ? (exam.duration_minutes * 60) - timeLeft : 0;

    const { error } = await supabase.from("education_exam_submissions").insert({
      exam_id: examId,
      student_id: user.id,
      answers: answers,
      score: score,
      total_possible: questions.length,
      time_spent_seconds: timeSpent,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      is_auto_submitted: isAuto,
    });
    if (error) throw error;
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option_index) correct++;
    });
    return correct;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const selectAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  const timerColor = timeLeft < 60 ? "#ef4444" : timeLeft < 300 ? "#f59e0b" : "#22c55e";

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "800" }}>{exam?.title || "Exam"}</Text>
          <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{questions.length} questions</Text>
        </View>
        <View style={{ backgroundColor: timerColor + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: timerColor + "40" }}>
          <Text style={{ color: timerColor, fontSize: 16, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {questions.map((q, idx) => (
          <View key={q.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 8 }}>Question {idx + 1}</Text>
            <Text style={{ color: "#f8fafc", fontSize: 15, lineHeight: 22, marginBottom: 12 }}>{q.question_text}</Text>
            {q.options?.map((opt: string, optIdx: number) => (
              <TouchableOpacity
                key={optIdx}
                onPress={() => selectAnswer(q.id, optIdx)}
                style={{
                  backgroundColor: answers[q.id] === optIdx ? "#0ea5e920" : "#0f172a",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: answers[q.id] === optIdx ? "#0ea5e9" : "#334155",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: answers[q.id] === optIdx ? "#0ea5e9" : "#475569", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                  {answers[q.id] === optIdx && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#0ea5e9" }} />}
                </View>
                <Text style={{ color: "#f8fafc", fontSize: 14, flex: 1 }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: "#1e293b", backgroundColor: "#0f172a" }}>
        <TouchableOpacity
          onPress={handleManualSubmit}
          disabled={submitting || submitted}
          style={{ backgroundColor: "#0ea5e9", paddingVertical: 14, borderRadius: 12, alignItems: "center", opacity: submitting || submitted ? 0.6 : 1 }}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Submit Exam</Text>}
        </TouchableOpacity>
        <Text style={{ color: "#64748b", fontSize: 11, textAlign: "center", marginTop: 8 }}>
          {Object.keys(answers).length} of {questions.length} answered
        </Text>
      </View>
    </View>
  );
}

