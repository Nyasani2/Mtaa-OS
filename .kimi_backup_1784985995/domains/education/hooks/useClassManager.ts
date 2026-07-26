import { useState, useCallback, useEffect } from 'react';
import {
  getClasses, getClassById, createClass, updateClass, archiveClass,
  getClassEnrollments, enrollStudent, updateEnrollmentStatus, transferStudent, getStudentClasses,
  getClassSchedule, createScheduleSlot, deleteScheduleSlot, getTeacherSchedule,
  getClassStats, getInstitutionClassSummary,
  type ClassV2, type ClassEnrollment, type ClassSchedule, type CreateClassInput, type EnrollStudentInput, type CreateScheduleInput,
} from '@/domains/education/services/classManagerService';

// ============================================
// useClassManager — Admin/Teacher hook for class operations
// ============================================
export function useClassManager(institutionId?: string) {
  const [classes, setClasses] = useState<ClassV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchClasses = useCallback(async (filters?: { status?: string; grade_level?: number; academic_year?: string }) => {
    if (!institutionId) return;
    setLoading(true); setError('');
    const { data, error } = await getClasses(institutionId, filters);
    if (data) setClasses(data);
    if (error) setError(error);
    setLoading(false);
  }, [institutionId]);

  const addClass = useCallback(async (input: CreateClassInput) => {
    setCreating(true); setError('');
    const { data, error } = await createClass(input);
    if (data) setClasses(prev => [...prev, data].sort((a, b) => a.grade_level - b.grade_level || a.name.localeCompare(b.name)));
    if (error) setError(error);
    setCreating(false);
    return { data, error };
  }, []);

  const editClass = useCallback(async (classId: string, updates: Partial<CreateClassInput>) => {
    setUpdating(true); setError('');
    const { data, error } = await updateClass(classId, updates);
    if (data) setClasses(prev => prev.map(c => c.id === classId ? data : c));
    if (error) setError(error);
    setUpdating(false);
    return { data, error };
  }, []);

  const removeClass = useCallback(async (classId: string) => {
    setLoading(true); setError('');
    const { success, error } = await archiveClass(classId);
    if (success) setClasses(prev => prev.filter(c => c.id !== classId));
    if (error) setError(error);
    setLoading(false);
    return { success, error };
  }, []);

  return {
    classes, loading, error, creating, updating,
    fetchClasses, addClass, editClass, removeClass,
  };
}

// ============================================
// useClassDetail — Single class + enrollments + schedule
// ============================================
export function useClassDetail(classId?: string) {
  const [classData, setClassData] = useState<ClassV2 | null>(null);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [stats, setStats] = useState<{ total: number; enrolled: number; withdrawn: number; suspended: number; capacity: number; fill_rate: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [enrolling, setEnrolling] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const fetchClass = useCallback(async () => {
    if (!classId) return;
    setLoading(true); setError('');
    const [{ data: cls, error: clsErr }, { data: enr, error: enrErr }, { data: sch, error: schErr }, { data: st, error: stErr }] = await Promise.all([
      getClassById(classId),
      getClassEnrollments(classId),
      getClassSchedule(classId),
      getClassStats(classId),
    ]);
    if (cls) setClassData(cls);
    if (enr) setEnrollments(enr);
    if (sch) setSchedule(sch);
    if (st) setStats(st);
    setError(clsErr || enrErr || schErr || stErr);
    setLoading(false);
  }, [classId]);

  const addStudent = useCallback(async (input: EnrollStudentInput) => {
    setEnrolling(true); setError('');
    const { data, error } = await enrollStudent(input);
    if (data) setEnrollments(prev => [data, ...prev]);
    if (error) setError(error);
    setEnrolling(false);
    return { data, error };
  }, []);

  const changeStatus = useCallback(async (enrollmentId: string, status: ClassEnrollment['status']) => {
    setLoading(true); setError('');
    const { success, error } = await updateEnrollmentStatus(enrollmentId, status);
    if (success) setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status } : e));
    if (error) setError(error);
    setLoading(false);
    return { success, error };
  }, []);

  const moveStudent = useCallback(async (enrollmentId: string, newClassId: string, notes?: string) => {
    setTransferring(true); setError('');
    const { data, error } = await transferStudent(enrollmentId, newClassId, notes);
    if (data) {
      setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status: 'transferred' } : e));
    }
    if (error) setError(error);
    setTransferring(false);
    return { data, error };
  }, []);

  const addScheduleSlot = useCallback(async (input: CreateScheduleInput) => {
    setLoading(true); setError('');
    const { data, error } = await createScheduleSlot(input);
    if (data) setSchedule(prev => [...prev, data].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)));
    if (error) setError(error);
    setLoading(false);
    return { data, error };
  }, []);

  const removeScheduleSlot = useCallback(async (slotId: string) => {
    setLoading(true); setError('');
    const { success, error } = await deleteScheduleSlot(slotId);
    if (success) setSchedule(prev => prev.filter(s => s.id !== slotId));
    if (error) setError(error);
    setLoading(false);
    return { success, error };
  }, []);

  useEffect(() => { fetchClass(); }, [fetchClass]);

  return {
    classData, enrollments, schedule, stats,
    loading, error, enrolling, transferring,
    fetchClass, addStudent, changeStatus, moveStudent,
    addScheduleSlot, removeScheduleSlot,
  };
}

// ============================================
// useStudentClasses — Student view of their classes
// ============================================
export function useStudentClasses(studentId?: string) {
  const [classes, setClasses] = useState<ClassV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetch = useCallback(async () => {
    if (!studentId) return;
    setLoading(true); setError('');
    const { data, error } = await getStudentClasses(studentId);
    if (data) setClasses(data);
    if (error) setError(error);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { classes, loading, error, refresh: fetch };
}

// ============================================
// useTeacherSchedule — Teacher view of their weekly schedule
// ============================================
export function useTeacherSchedule(teacherId?: string) {
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetch = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true); setError('');
    const { data, error } = await getTeacherSchedule(teacherId);
    if (data) setSchedule(data);
    if (error) setError(error);
    setLoading(false);
  }, [teacherId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { schedule, loading, error, refresh: fetch };
}

// ============================================
// useClassSummary — Institution admin overview
// ============================================
export function useClassSummary(institutionId?: string) {
  const [summary, setSummary] = useState<{ total_classes: number; total_students: number; avg_fill_rate: number; active_teachers: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetch = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true); setError('');
    const { data, error } = await getInstitutionClassSummary(institutionId);
    if (data) setSummary(data);
    if (error) setError(error);
    setLoading(false);
  }, [institutionId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, loading, error, refresh: fetch };
}
