// @ts-nocheck
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function QuizTakeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const loadQuiz = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data: q } = await supabase.from("education_quizzes").select("*").eq("id", id).maybeSingle();
      setQuiz(q);
      if (q?.time_limit_minutes) setTimeLeft(q.time_limit_minutes * 60);

      const { data: qs } = await supabase.from("education_quiz_questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true });
      setQuestions(qs || []);

      // Check if already submitted
      const { data: sub } = await supabase.from("education_quiz_submissions").select("id, score").eq("quiz_id", id).eq("student_id", user?.id).maybeSingle();
      if (sub) { setSubmitted(true); setScore(sub.score || 0); }
    } catch (err) { console.error("[QuizTake] load error:", err); }
    finally { setLoading(false); }
  }, [id, user?.id]);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const selectAnswer = (questionId, optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const submitQuiz = async () => {
    if (!quiz || !user?.id) return;
    const total = questions.length;
    const correct = questions.filter((q) => answers[q.id] === q.correct_option_index).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    try {
      await supabase.from("education_quiz_submissions").insert({
        quiz_id: quiz.id, student_id: user.id, answers: answers,
        score: pct, correct_count: correct, total_count: total,
        submitted_at: new Date().toISOString(), time_spent_seconds: quiz.time_limit_minutes * 60 - timeLeft,
      });
      setScore(pct);
      setSubmitted(true);
      Alert.alert("Submitted", `You scored ${pct}% (${correct}/${total})`);
    } catch (err) { Alert.alert("Error", err.message || "Failed to submit"); }
  };

  const formatTime = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, "0")}`; };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 12 }}>Loading quiz...</Text>
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
          <Text style={{ color: "#f8fafc", fontSize: 20, fontWeight: "800", flex: 1 }} numberOfLines={1}>{quiz?.title || "Quiz"}</Text>
          {!submitted && (
            <View style={{ backgroundColor: timeLeft < 60 ? "#7f1d1d" : "#1e3a5f", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: timeLeft < 60 ? "#fca5a5" : "#7dd3fc", fontSize: 12, fontWeight: "700", fontFamily: "monospace" }}>{formatTime(Math.max(0, timeLeft))}</Text>
            </View>
          )}
        </View>
        <Text style={{ color: "#94a3b8", fontSize: 13 }}>{questions.length} questions &middot; {quiz?.subject || "General"}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {submitted && (
          <View style={{ backgroundColor: score >= 70 ? "#064e3b" : score >= 50 ? "#451a03" : "#7f1d1d", borderRadius: 12, padding: 16, marginBottom: 16, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>{score}%</Text>
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{score >= 70 ? "Excellent!" : score >= 50 ? "Good effort" : "Keep practicing"}</Text>
          </View>
        )}

        {questions.map((q, idx) => (
          <View key={q.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600", marginBottom: 12 }}>{idx + 1}. {q.question_text}</Text>
            {(q.options || []).map((opt, optIdx) => {
              const isSelected = answers[q.id] === optIdx;
              const isCorrect = submitted && optIdx === q.correct_option_index;
              const isWrong = submitted && isSelected && optIdx !== q.correct_option_index;
              return (
                <TouchableOpacity
                  key={optIdx}
                  onPress={() => selectAnswer(q.id, optIdx)}
                  disabled={submitted}
                  style={{
                    backgroundColor: isCorrect ? "#064e3b" : isWrong ? "#7f1d1d" : isSelected ? "#1e3a5f" : "#0f172a",
                    borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center",
                    borderWidth: 1, borderColor: isCorrect ? "#10b981" : isWrong ? "#ef4444" : isSelected ? "#3b82f6" : "#334155",
                  }}
                >
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isSelected || isCorrect ? "#3b82f6" : "#334155", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{String.fromCharCode(65 + optIdx)}</Text>
                  </View>
                  <Text style={{ color: "#f8fafc", fontSize: 14, flex: 1 }}>{opt}</Text>
                  {submitted && optIdx === q.correct_option_index && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
                  {submitted && isWrong && <Ionicons name="close-circle" size={20} color="#ef4444" />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {!submitted && (
          <TouchableOpacity onPress={submitQuiz} style={{ backgroundColor: "#3b82f6", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Submit Quiz</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
