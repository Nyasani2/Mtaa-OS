// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import {
  getTests, getTestById, createTest, updateTest, publishTest, activateTest, closeTest, deleteTest,
  getQuestions, addQuestion, updateQuestion, deleteQuestion, reorderQuestions,
  startAttempt, getAttempts, getAttemptById, submitAttempt, abandonAttempt,
  submitAnswer, getAnswers, getTestStats, getStudentTestResults,
  type Test, type TestQuestion, type TestAttempt, type TestAnswer, type CreateTestInput, type CreateQuestionInput, type SubmitAnswerInput,
} from '@/domains/education/services/testQuizService';

// ============================================
// useTestList — Teacher/Admin test management
// ============================================
export function useTestList(filters?: { teacher_id?: string; class_id?: string; status?: string; institution_id?: string }) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    const { data, error } = await getTests(filters || {});
    if (data) setTests(data);
    if (error) setError(error);
    setLoading(false);
  }, [filters?.teacher_id, filters?.class_id, filters?.status, filters?.institution_id]);

  const add = useCallback(async (input: CreateTestInput) => {
    setCreating(true); setError('');
    const { data, error } = await createTest(input);
    if (data) setTests(prev => [data, ...prev]);
    if (error) setError(error);
    setCreating(false);
    return { data, error };
  }, []);

  const edit = useCallback(async (id: string, updates: Partial<CreateTestInput>) => {
    setUpdating(true); setError('');
    const { data, error } = await updateTest(id, updates);
    if (data) setTests(prev => prev.map((t: any) => t.id === id ? data : t));
    if (error) setError(error);
    setUpdating(false);
    return { data, error };
  }, []);

  const publish = useCallback(async (id: string) => {
    setUpdating(true); setError('');
    const { success, error } = await publishTest(id);
    if (success) setTests(prev => prev.map((t: any) => t.id === id ? { ...t, status: 'published' } : t));
    if (error) setError(error);
    setUpdating(false);
    return { success, error };
  }, []);

  const activate = useCallback(async (id: string) => {
    setUpdating(true); setError('');
    const { success, error } = await activateTest(id);
    if (success) setTests(prev => prev.map((t: any) => t.id === id ? { ...t, status: 'active' } : t));
    if (error) setError(error);
    setUpdating(false);
    return { success, error };
  }, []);

  const close = useCallback(async (id: string) => {
    setUpdating(true); setError('');
    const { success, error } = await closeTest(id);
    if (success) setTests(prev => prev.map((t: any) => t.id === id ? { ...t, status: 'closed' } : t));
    if (error) setError(error);
    setUpdating(false);
    return { success, error };
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true); setError('');
    const { success, error } = await deleteTest(id);
    if (success) setTests(prev => prev.filter((t: any) => t.id !== id));
    if (error) setError(error);
    setLoading(false);
    return { success, error };
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { tests, loading, error, creating, updating, fetch, add, edit, publish, activate, close, remove };
}

// ============================================
// useTestBuilder — Single test + questions management
// ============================================
export function useTestBuilder(testId?: string) {
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    if (!testId) return;
    setLoading(true); setError('');
    const [{ data: t, error: tErr }, { data: q, error: qErr }] = await Promise.all([
      getTestById(testId),
      getQuestions(testId),
    ]);
    if (t) setTest(t);
    if (q) setQuestions(q);
    setError(tErr || qErr);
    setLoading(false);
  }, [testId]);

  const addQuestion = useCallback(async (input: CreateQuestionInput) => {
    setSaving(true); setError('');
    const { data, error } = await addQuestion(input);
    if (data) setQuestions(prev => [...prev, data].sort((a, b) => a.order_index - b.order_index));
    if (error) setError(error);
    setSaving(false);
    return { data, error };
  }, []);

  const editQuestion = useCallback(async (id: string, updates: Partial<CreateQuestionInput>) => {
    setSaving(true); setError('');
    const { data, error } = await updateQuestion(id, updates);
    if (data) setQuestions(prev => prev.map((q: any) => q.id === id ? data : q));
    if (error) setError(error);
    setSaving(false);
    return { data, error };
  }, []);

  const removeQuestion = useCallback(async (id: string) => {
    setDeleting(true); setError('');
    const { success, error } = await deleteQuestion(id);
    if (success) setQuestions(prev => prev.filter((q: any) => q.id !== id));
    if (error) setError(error);
    setDeleting(false);
    return { success, error };
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { test, questions, loading, error, saving, deleting, fetch, addQuestion, editQuestion, removeQuestion };
}

// ============================================
// useTestTaker — Student test taking experience
// ============================================
export function useTestTaker(testId?: string, studentId?: string) {
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, TestAnswer>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchTest = useCallback(async () => {
    if (!testId) return;
    setLoading(true); setError('');
    const [{ data: t, error: tErr }, { data: q, error: qErr }] = await Promise.all([
      getTestById(testId),
      getQuestions(testId),
    ]);
    if (t) setTest(t);
    if (q) setQuestions(q);
    setError(tErr || qErr);
    setLoading(false);
  }, [testId]);

  const start = useCallback(async () => {
    if (!testId || !studentId) return;
    setStarting(true); setError('');
    const { data, error } = await startAttempt(testId, studentId);
    if (data) {
      setAttempt(data);
      setTimeLeft((data.test?.duration_minutes || 30) * 60);
    }
    if (error) setError(error);
    setStarting(false);
    return { data, error };
  }, [testId, studentId]);

  const answerQuestion = useCallback(async (questionId: string, answer: unknown, timeSpent: number) => {
    if (!attempt) return;
    const { data, error } = await submitAnswer({ attempt_id: attempt.id, question_id: questionId, answer, time_spent_seconds: timeSpent });
    if (data) setAnswers(prev => ({ ...prev, [questionId]: data }));
    if (error) setError(error);
    return { data, error };
  }, [attempt]);

  const submit = useCallback(async (timeSpent: number) => {
    if (!attempt) return;
    setSubmitting(true); setError('');
    const { data, error } = await submitAttempt(attempt.id, timeSpent);
    if (data) setAttempt(data);
    if (error) setError(error);
    setSubmitting(false);
    return { data, error };
  }, [attempt]);

  const abandon = useCallback(async () => {
    if (!attempt) return;
    const { success, error } = await abandonAttempt(attempt.id);
    if (success) setAttempt(prev => prev ? { ...prev, status: 'abandoned' } : null);
    if (error) setError(error);
    return { success, error };
  }, [attempt]);

  const goNext = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.min(prev + 1, questions.length - 1));
  }, [questions.length]);

  const goPrev = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => { fetchTest(); }, [fetchTest]);

  return {
    test, questions, attempt, answers, currentQuestionIndex, timeLeft,
    loading, error, starting, submitting,
    fetchTest, start, answerQuestion, submit, abandon,
    goNext, goPrev, setCurrentQuestionIndex,
  };
}

// ============================================
// useTestResults — Teacher analytics + student results
// ============================================
export function useTestResults(testId?: string) {
  const [stats, setStats] = useState<{ total_attempts: number; completed: number; average_score: number; highest_score: number; lowest_score: number; pass_rate: number } | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetch = useCallback(async () => {
    if (!testId) return;
    setLoading(true); setError('');
    const [{ data: s, error: sErr }, { data: a, error: aErr }] = await Promise.all([
      getTestStats(testId),
      getAttempts({ test_id: testId }),
    ]);
    if (s) setStats(s);
    if (a) setAttempts(a);
    setError(sErr || aErr);
    setLoading(false);
  }, [testId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, attempts, loading, error, refresh: fetch };
}

// ============================================
// useStudentTestResults — Student view of their results
// ============================================
export function useStudentTestResults(studentId?: string) {
  const [results, setResults] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetch = useCallback(async () => {
    if (!studentId) return;
    setLoading(true); setError('');
    const { data, error } = await getStudentTestResults(studentId);
    if (data) setResults(data);
    if (error) setError(error);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { results, loading, error, refresh: fetch };
}
