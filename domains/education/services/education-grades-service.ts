// @ts-nocheck
import { supabase } from '@/lib/supabase';

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  term: string;
  exam_type: string;
  score: number;
  grade: string;
  remarks: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export interface GradeWithDetails extends Grade {
  subject?: {
    id: string;
    name: string;
    code: string;
  } | null;
  student?: {
    id: string;
    admission_number: string;
    profile?: {
      full_name: string;
      avatar_url: string;
    } | null;
  } | null;
}

export async function getGrades(filters?: {
  student_id?: string;
  class_id?: string;
  subject_id?: string;
  teacher_id?: string;
  term?: string;
  exam_type?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_grades')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.student_id) query = query.eq('student_id', filters.student_id);
    if (filters?.class_id) query = query.eq('class_id', filters.class_id);
    if (filters?.subject_id) query = query.eq('subject_id', filters.subject_id);
    if (filters?.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
    if (filters?.term) query = query.eq('term', filters.term);
    if (filters?.exam_type) query = query.eq('exam_type', filters.exam_type);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data: grades, error } = await query;
    if (error) throw error;
    if (!grades?.length) return { data: [] as GradeWithDetails[], error: null };

    // Fetch subjects
    const subjectIds = grades.map((g: any) => g.subject_id).filter(Boolean);
    let subjects: any[] = [];
    if (subjectIds.length > 0) {
      const { data: sData } = await supabase
        .from('education_subjects')
        .select('id, name, code')
        .in('id', subjectIds);
      subjects = sData || [];
    }

    // Fetch students
    const studentIds = grades.map((g: any) => g.student_id).filter(Boolean);
    let students: any[] = [];
    if (studentIds.length > 0) {
      const { data: stData } = await supabase
        .from('education_students')
        .select('id, user_id, admission_number')
        .in('id', studentIds);
      students = stData || [];
    }

    // Fetch student profiles
    const studentUserIds = students.map((s: any) => s.user_id).filter(Boolean);
    let studentProfiles: any[] = [];
    if (studentUserIds.length > 0) {
      const { data: spData } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', studentUserIds);
      studentProfiles = spData || [];
    }

    const merged = grades.map((grade: any) => {
      const subject = subjects.find((s: any) => s.id === grade.subject_id);
      const student = students.find((s: any) => s.id === grade.student_id);
      const profile = studentProfiles.find((p: any) => p.user_id === student?.user_id);
      return {
        ...grade,
        subject: subject || null,
        student: student ? { ...student, profile: profile || null } : null,
      };
    });

    return { data: merged as GradeWithDetails[], error: null };
  } catch (error: any) {
    console.error('getGrades error:', error);
    return { data: [], error };
  }
}

export async function getGradeById(id: string) {
  try {
    const { data: grade, error } = await supabase
      .from('education_grades')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;

    let subject = null;
    let student = null;
    let profile = null;

    if (grade?.subject_id) {
      const { data: sData } = await supabase
        .from('education_subjects')
        .select('id, name, code')
        .eq('id', grade.subject_id)
        .single();
      subject = sData;
    }

    if (grade?.student_id) {
      const { data: stData } = await supabase
        .from('education_students')
        .select('id, user_id, admission_number')
        .eq('id', grade.student_id)
        .single();
      student = stData;
      if (student?.user_id) {
        const { data: pData } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, avatar_url')
          .eq('user_id', student.user_id)
          .single();
        profile = pData;
      }
    }

    return { data: {
      ...grade,
      subject: subject || null,
      student: student ? { ...student, profile: profile || null } : null,
    } as GradeWithDetails, error: null };
  } catch (error: any) {
    console.error('getGradeById error:', error);
    return { data: null, error };
  }
}

export async function createGrade(grade: Partial<Grade>) {
  try {
    const { data, error } = await supabase
      .from('education_grades')
      .insert([grade])
      .select()
      .single();
    if (error) throw error;
    return { data: data as Grade, error: null };
  } catch (error: any) {
    console.error('createGrade error:', error);
    return { data: null, error };
  }
}

export async function updateGrade(id: string, updates: Partial<Grade>) {
  try {
    const { data, error } = await supabase
      .from('education_grades')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as Grade, error: null };
  } catch (error: any) {
    console.error('updateGrade error:', error);
    return { data: null, error };
  }
}

export async function getStudentReportCard(studentId: string, term: string) {
  try {
    const { data: grades, error } = await supabase
      .from('education_grades')
      .select('*')
      .eq('student_id', studentId)
      .eq('term', term)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!grades?.length) return { data: { grades: [], summary: null }, error: null };

    // Fetch subjects
    const subjectIds = grades.map((g: any) => g.subject_id).filter(Boolean);
    let subjects: any[] = [];
    if (subjectIds.length > 0) {
      const { data: sData } = await supabase
        .from('education_subjects')
        .select('id, name, code')
        .in('id', subjectIds);
      subjects = sData || [];
    }

    const gradesWithSubjects = grades.map((g: any) => ({
      ...g,
      subject: subjects.find((s: any) => s.id === g.subject_id) || null,
    }));

    const scores = grades.map((g: any) => g.score || 0);
    const summary = {
      totalSubjects: grades.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
    };

    return { data: { grades: gradesWithSubjects, summary }, error: null };
  } catch (error: any) {
    console.error('getStudentReportCard error:', error);
    return { data: null, error };
  }
}
