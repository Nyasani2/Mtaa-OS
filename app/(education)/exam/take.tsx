import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function ExamTakeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);

  const loadExam = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data: e } = await supabase.from("education_exams").select("*").eq("id", id).maybeSingle();
      setExam(e);
      if (e?.duration_minutes) setTimeLeft(e.duration_minutes * 60);

      const { data: qs } = await supabase.from("education_exam_questions").select("*").eq("exam_id", id).order("order_index", { ascending: true });
      setQuestions(qs || []);

      const { data: sub } = await supabase.from("education_exam_submissions").select("id, score").eq("exam_id", id).eq("student_id", user?.id).maybeSingle();
      if (sub) { setSubmitted(true); setScore(sub.score || 0); }
    } catch (err) { console.error("[ExamTake] load error:", err); }
    finally { setLoading(false); }
  }, [id, user?.id]);

  useEffect(() => { loadExam(); }, [loadExam]);

  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const setAnswer = (questionId, value) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitExam = async () => {
    if (!exam || !user?.id) return;
    let correct = 0;
    let total = 0;
    questions.forEach((q) => {
      if (q.question_type === "multiple_choice") {
        total++;
        if (answers[q.id] === q.correct_option_index) correct++;
      } else if (q.question_type === "true_false") {
        total++;
        if (answers[q.id] === q.correct_answer) correct++;
      } else {
        total += q.points || 1;
      }
    });
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    try {
      await supabase.from("education_exam_submissions").insert({
        exam_id: exam.id, student_id: user.id, answers: answers,
        score: pct, correct_count: correct, total_count: total,
        submitted_at: new Date().toISOString(),
        time_spent_seconds: exam.duration_minutes * 60 - timeLeft,
        status: "submitted",
      });
      setScore(pct); setSubmitted(true);
      Alert.alert("Submitted", `You scored ${pct}%`);
    } catch (err) { Alert.alert("Error", err.message || "Failed to submit"); }
  };

  const formatTime = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, "0")}`; };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 12 }}>Loading exam...</Text>
      </View>
    );
  }

  const q = questions[currentQ];

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "800", flex: 1 }} numberOfLines={1}>{exam?.title || "Exam"}</Text>
          {!submitted && (
            <View style={{ backgroundColor: timeLeft < 300 ? "#7f1d1d" : "#1e3a5f", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: timeLeft < 300 ? "#fca5a5" : "#7dd3fc", fontSize: 12, fontWeight: "700", fontFamily: "monospace" }}>{formatTime(Math.max(0, timeLeft))}</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: "#94a3b8", fontSize: 13 }}>Q{currentQ + 1} of {questions.length}</Text>
          <Text style={{ color: "#94a3b8", fontSize: 13 }}>{exam?.subject || "General"}</Text>
        </View>
      </View>

      {submitted ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          <View style={{ backgroundColor: score >= 70 ? "#064e3b" : score >= 50 ? "#451a03" : "#7f1d1d", borderRadius: 12, padding: 20, marginBottom: 20, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 32, fontWeight: "800" }}>{score}%</Text>
            <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>{score >= 70 ? "Passed" : score >= 50 ? "Average" : "Failed"}</Text>
          </View>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 12, textTransform: "uppercase" }}>Answer Review</Text>
          {questions.map((ques, idx) => (
            <View key={ques.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600" }}>{idx + 1}. {ques.question_text}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>Your answer: {JSON.stringify(answers[ques.id]) || "No answer"}</Text>
              {ques.correct_answer && <Text style={{ color: "#10b981", fontSize: 13, marginTop: 4 }}>Correct: {JSON.stringify(ques.correct_answer)}</Text>}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
            {q ? (
              <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16 }}>
                <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "600", marginBottom: 16 }}>{currentQ + 1}. {q.question_text}</Text>
                {q.question_type === "multiple_choice" && (q.options || []).map((opt, idx) => (
                  <TouchableOpacity key={idx} onPress={() => setAnswer(q.id, idx)} style={{ backgroundColor: answers[q.id] === idx ? "#1e3a5f" : "#0f172a", borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: answers[q.id] === idx ? "#3b82f6" : "#334155", flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: answers[q.id] === idx ? "#3b82f6" : "#334155", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{String.fromCharCode(65 + idx)}</Text>
                    </View>
                    <Text style={{ color: "#f8fafc", fontSize: 14, flex: 1 }}>{opt}</Text>
                  </TouchableOpacity>
                ))}
                {q.question_type === "true_false" && (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    {["true", "false"].map((val) => (
                      <TouchableOpacity key={val} onPress={() => setAnswer(q.id, val === "true")} style={{ flex: 1, backgroundColor: answers[q.id] === (val === "true") ? "#1e3a5f" : "#0f172a", borderRadius: 10, padding: 14, alignItems: "center", borderWidth: 1, borderColor: answers[q.id] === (val === "true") ? "#3b82f6" : "#334155" }}>
                        <Text style={{ color: "#f8fafc", fontSize: 14, fontWeight: "600", textTransform: "capitalize" }}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {(q.question_type === "short_answer" || q.question_type === "essay") && (
                  <TextInput
                    value={answers[q.id] || ""} onChangeText={(t) => setAnswer(q.id, t)}
                    placeholder="Type your answer..." placeholderTextColor="#475569"
                    multiline numberOfLines={q.question_type === "essay" ? 6 : 3}
                    style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f8fafc", fontSize: 14, borderWidth: 1, borderColor: "#334155", textAlignVertical: "top" }}
                  />
                )}
              </View>
            ) : (
              <Text style={{ color: "#64748b", textAlign: "center", paddingVertical: 40 }}>No questions available</Text>
            )}
          </ScrollView>

          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: "#1e293b", backgroundColor: "#0f172a" }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0} style={{ flex: 1, backgroundColor: currentQ === 0 ? "#1e293b" : "#334155", borderRadius: 10, padding: 14, alignItems: "center" }}>
                <Text style={{ color: currentQ === 0 ? "#64748b" : "#f8fafc", fontWeight: "600" }}>Previous</Text>
              </TouchableOpacity>
              {currentQ < questions.length - 1 ? (
                <TouchableOpacity onPress={() => setCurrentQ((p) => Math.min(questions.length - 1, p + 1))} style={{ flex: 1, backgroundColor: "#3b82f6", borderRadius: 10, padding: 14, alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={submitExam} style={{ flex: 1, backgroundColor: "#059669", borderRadius: 10, padding: 14, alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Submit Exam</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
