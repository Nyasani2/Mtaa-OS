// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import {
  getAssignments, getAssignmentById, createAssignment, updateAssignment, publishAssignment, closeAssignment, deleteAssignment,
  getSubmissions, submitAssignment, gradeSubmission, returnSubmission, getStudentSubmission,
  getStudentGrades, getGradeStats, getAssignmentStats,
  type Assignment, type AssignmentSubmission, type Grade, type CreateAssignmentInput, type CreateSubmissionInput, type GradeSubmissionInput,
} from '@/domains/education/services/assignmentEngineService';

// ============================================
// useAssignmentList — Teacher/Admin view
// ============================================
export function useAssignmentList(filters?: { teacher_id?: string; class_id?: string; status?: string; institution_id?: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    const { data, error } = await getAssignments(filters || {});
    if (data) setAssignments(data);
    if (error) setError(error);
    setLoading(false);
  }, [filters?.teacher_id, filters?.class_id, filters?.status, filters?.institution_id]);

  const add = useCallback(async (input: CreateAssignmentInput) => {
    setCreating(true); setError('');
    const { data, error } = await createAssignment(input);
    if (data) setAssignments(prev => [data, ...prev]);
    if (error) setError(error);
    setCreating(false);
    return { data, error };
  }, []);

  const edit = useCallback(async (id: string, updates: Partial<CreateAssignmentInput>) => {
    setUpdating(true); setError('');
    const { data, error } = await updateAssignment(id, updates);
    if (data) setAssignments(prev => prev.map((a: any) => a.id === id ? data : a));
    if (error) setError(error);
    setUpdating(false);
    return { data, error };
  }, []);

  const publish = useCallback(async (id: string) => {
    setUpdating(true); setError('');
    const { success, error } = await publishAssignment(id);
    if (success) setAssignments(prev => prev.map((a: any) => a.id === id ? { ...a, status: 'published' } : a));
    if (error) setError(error);
    setUpdating(false);
    return { success, error };
  }, []);

  const close = useCallback(async (id: string) => {
    setUpdating(true); setError('');
    const { success, error } = await closeAssignment(id);
    if (success) setAssignments(prev => prev.map((a: any) => a.id === id ? { ...a, status: 'closed' } : a));
    if (error) setError(error);
    setUpdating(false);
    return { success, error };
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true); setError('');
    const { success, error } = await deleteAssignment(id);
    if (success) setAssignments(prev => prev.filter((a: any) => a.id !== id));
    if (error) setError(error);
    setLoading(false);
    return { success, error };
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { assignments, loading, error, creating, updating, fetch, add, edit, publish, close, remove };
}

// ============================================
// useAssignmentDetail — Single assignment + submissions
// ============================================
export function useAssignmentDetail(assignmentId?: string) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [stats, setStats] = useState<{ total_submissions: number; graded: number; pending: number; late: number; average_score: number; highest_score: number; lowest_score: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [grading, setGrading] = useState(false);
  const [returning, setReturning] = useState(false);

  const fetch = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true); setError('');
    const [{ data: a, error: aErr }, { data: s, error: sErr }, { data: st, error: stErr }] = await Promise.all([
      getAssignmentById(assignmentId),
      getSubmissions({ assignment_id: assignmentId }),
      getAssignmentStats(assignmentId),
    ]);
    if (a) setAssignment(a);
    if (s) setSubmissions(s);
    if (st) setStats(st);
    setError(aErr || sErr || stErr);
    setLoading(false);
  }, [assignmentId]);

  const grade = useCallback(async (input: GradeSubmissionInput) => {
    setGrading(true); setError('');
    const { data, error } = await gradeSubmission(input);
    if (data) setSubmissions(prev => prev.map((sub: any) => sub.id === input.submission_id ? { ...sub, ...data } : sub));
    if (error) setError(error);
    setGrading(false);
    return { data, error };
  }, []);

  const returnSub = useCallback(async (submissionId: string) => {
    setReturning(true); setError('');
    const { success, error } = await returnSubmission(submissionId);
    if (success) setSubmissions(prev => prev.map((sub: any) => sub.id === submissionId ? { ...sub, status: 'returned' } : sub));
    if (error) setError(error);
    setReturning(false);
    return { success, error };
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { assignment, submissions, stats, loading, error, grading, returning, fetch, grade, returnSub };
}

// ============================================
// useStudentAssignments — Student view
// ============================================
export function useStudentAssignments(studentId?: string, classId?: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, AssignmentSubmission>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    if (!studentId || !classId) return;
    setLoading(true); setError('');
    const { data: assignmentsData, error: aErr } = await getAssignments({ class_id: classId, status: 'published' });
    if (assignmentsData) {
      setAssignments(assignmentsData);
      // Fetch my submissions for each
      const subs: Record<string, AssignmentSubmission> = {};
      for (const a of assignmentsData) {
        const { data: sub } = await getStudentSubmission(a.id, studentId);
        if (sub) subs[a.id] = sub;
      }
      setMySubmissions(subs);
    }
    if (aErr) setError(aErr);
    setLoading(false);
  }, [studentId, classId]);

  const submit = useCallback(async (input: CreateSubmissionInput) => {
    setSubmitting(true); setError('');
    const { data, error } = await submitAssignment(input);
    if (data && input.assignment_id) {
      setMySubmissions(prev => ({ ...prev, [input.assignment_id]: data }));
    }
    if (error) setError(error);
    setSubmitting(false);
    return { data, error };
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { assignments, mySubmissions, loading, error, submitting, fetch, submit };
}

// ============================================
// useStudentGrades — Student/parent grade view
// ============================================
export function useStudentGrades(studentId?: string, filters?: { term?: string; academic_year?: string }) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [stats, setStats] = useState<{ average: number; highest: number; lowest: number; total: number; letter_distribution: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetch = useCallback(async () => {
    if (!studentId) return;
    setLoading(true); setError('');
    const [{ data: g, error: gErr }, { data: s, error: sErr }] = await Promise.all([
      getStudentGrades(studentId, filters),
      getGradeStats(studentId),
    ]);
    if (g) setGrades(g);
    if (s) setStats(s);
    setError(gErr || sErr);
    setLoading(false);
  }, [studentId, filters?.term, filters?.academic_year]);

  useEffect(() => { fetch(); }, [fetch]);

  return { grades, stats, loading, error, refresh: fetch };
}
