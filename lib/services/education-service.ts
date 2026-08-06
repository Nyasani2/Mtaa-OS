// ============================================================
// MTAA OS V10 — Education Service (UNIFIED AUTH REFACTOR)
// Pattern: All create/update/delete functions accept userId
// from the hook layer (useAuthStore). No internal auth checks.
// RLS is the security gate at the database.
// ============================================================

import { supabase } from '@/lib/supabase';

export interface Institution { id: string; name: string; type: string; location?: string; created_at?: string; created_by?: string; }
export interface InstitutionClass { id: string; institution_id: string; name: string; grade_level?: string; teacher_id?: string; created_by?: string; }
export interface Student { id: string; user_id: string; institution_id: string; class_id?: string; enrollment_date?: string; status?: string; }
export interface Teacher { id: string; user_id: string; institution_id: string; subject?: string; qualification?: string; }
export interface Grade { id: string; student_id: string; subject: string; score: number; term: string; year: number; created_by?: string; }
export interface Assignment { id: string; class_id: string; teacher_id: string; title: string; description?: string; due_date?: string; status?: string; created_by?: string; }
export interface Submission { id: string; assignment_id: string; student_id: string; content?: string; status?: string; submitted_at?: string; }
export interface Attendance { id: string; student_id: string; class_id: string; date: string; status: 'present' | 'absent' | 'late'; marked_by?: string; }
export interface Timetable { id: string; class_id: string; day: string; period: number; subject: string; teacher_id?: string; start_time?: string; end_time?: string; created_by?: string; }
export interface Lesson { id: string; class_id: string; teacher_id: string; title: string; content?: string; scheduled_at?: string; created_by?: string; }
export interface Event { id: string; institution_id: string; title: string; description?: string; event_date?: string; type?: string; created_by?: string; }
export interface TransportRoute { id: string; institution_id: string; name: string; route_data?: any; driver_id?: string; created_by?: string; }
export interface FeePayment { id: string; student_id: string; amount: number; term: string; year: number; status?: string; paid_at?: string; created_by?: string; }
export interface Earning { id: string; teacher_id: string; amount: number; type: string; status?: string; created_at?: string; created_by?: string; }
export interface ContentItem { id: string; institution_id: string; title: string; type: string; content?: string; url?: string; created_by?: string; }
export interface LiveStream { id: string; institution_id: string; title: string; stream_url?: string; status?: string; started_at?: string; ended_at?: string; created_by?: string; }
export interface QRSession { id: string; class_id: string; teacher_id: string; qr_code?: string; expires_at?: string; status?: string; created_by?: string; }
export interface WalkingSquad { id: string; name: string; route?: string; leader_id?: string; members?: string[]; created_by?: string; }
export interface ParentConnection { id: string; student_id: string; parent_id: string; status?: string; }
export interface Alumni { id: string; user_id: string; institution_id: string; graduation_year: number; current_occupation?: string; }
export interface Exam { id: string; class_id: string; subject: string; exam_date?: string; duration?: number; total_marks?: number; created_by?: string; }
export interface Test { id: string; class_id: string; subject: string; test_date?: string; total_marks?: number; created_by?: string; }
export interface Group { id: string; name: string; institution_id?: string; class_id?: string; created_by?: string; }
export interface Purchase { id: string; user_id: string; item_type: string; item_id: string; amount: number; status?: string; }
export interface StudentTransport { id: string; student_id: string; route_id: string; pickup_point?: string; dropoff_point?: string; }
export interface TeacherBooking { id: string; teacher_id: string; student_id: string; booking_date?: string; status?: string; created_by?: string; }
export interface TeacherDashboard { id: string; teacher_id: string; metrics?: any; updated_at?: string; }
export interface TeacherService { id: string; teacher_id: string; service_type: string; rate?: number; status?: string; created_by?: string; }
export interface SchoolAdmin { id: string; user_id: string; institution_id: string; role?: string; }
export interface Staff { id: string; user_id: string; institution_id: string; department?: string; position?: string; }
export interface Resource { id: string; institution_id: string; title: string; type: string; url?: string; created_by?: string; }
export interface History { id: string; user_id: string; action: string; entity_type?: string; entity_id?: string; created_at?: string; }
export interface PayrollEntry { id: string; staff_id: string; amount: number; month: string; year: number; status?: string; created_by?: string; }

function handleError(err: any, fallback: any = null) {
  console.error('[EducationService]', err?.message || err);
  return fallback;
}

// ─── INSTITUTIONS ───
export async function getInstitutions(): Promise<Institution[]> {
  const { data, error } = await supabase.from('education_institutions').select('*').order('name');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getInstitutionById(id: string): Promise<Institution | null> {
  const { data, error } = await supabase.from('education_institutions').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function getInstitutionClasses(institutionId: string): Promise<InstitutionClass[]> {
  const { data, error } = await supabase.from('education_classes').select('*').eq('institution_id', institutionId).order('name');
  if (error) return handleError(error, []);
  return data || [];
}
export async function createInstitution(userId: string, data: Partial<Institution>): Promise<Institution | null> {
  const { data: result, error } = await supabase.from('education_institutions').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateInstitution(userId: string, id: string, data: Partial<Institution>): Promise<Institution | null> {
  const { data: result, error } = await supabase.from('education_institutions').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteInstitution(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_institutions').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── STUDENTS ───
export async function getStudents(): Promise<Student[]> {
  const { data, error } = await supabase.from('education_students').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getStudentById(id: string): Promise<Student | null> {
  const { data, error } = await supabase.from('education_students').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function getStudentByUserId(userId: string): Promise<Student | null> {
  const { data, error } = await supabase.from('education_students').select('*').eq('user_id', userId).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function getClassStudents(classId: string): Promise<Student[]> {
  const { data, error } = await supabase.from('education_students').select('*').eq('class_id', classId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function createStudent(userId: string, data: Partial<Student>): Promise<Student | null> {
  const { data: result, error } = await supabase.from('education_students').insert({ ...data, user_id: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateStudent(userId: string, id: string, data: Partial<Student>): Promise<Student | null> {
  const { data: result, error } = await supabase.from('education_students').update(data).eq('id', id).eq('user_id', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteStudent(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_students').delete().eq('id', id).eq('user_id', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── TEACHERS ───
export async function getTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase.from('education_teachers').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getTeacherById(id: string): Promise<Teacher | null> {
  const { data, error } = await supabase.from('education_teachers').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function getTeacherByUserId(userId: string): Promise<Teacher | null> {
  const { data, error } = await supabase.from('education_teachers').select('*').eq('user_id', userId).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function getTeacherClasses(teacherId: string): Promise<InstitutionClass[]> {
  const { data, error } = await supabase.from('education_classes').select('*').eq('teacher_id', teacherId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function createTeacher(userId: string, data: Partial<Teacher>): Promise<Teacher | null> {
  const { data: result, error } = await supabase.from('education_teachers').insert({ ...data, user_id: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateTeacher(userId: string, id: string, data: Partial<Teacher>): Promise<Teacher | null> {
  const { data: result, error } = await supabase.from('education_teachers').update(data).eq('id', id).eq('user_id', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteTeacher(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_teachers').delete().eq('id', id).eq('user_id', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── CLASSES ───
export async function getClasses(): Promise<InstitutionClass[]> {
  const { data, error } = await supabase.from('education_classes').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getClassById(id: string): Promise<InstitutionClass | null> {
  const { data, error } = await supabase.from('education_classes').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function createClass(userId: string, data: Partial<InstitutionClass>): Promise<InstitutionClass | null> {
  const { data: result, error } = await supabase.from('education_classes').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateClass(userId: string, id: string, data: Partial<InstitutionClass>): Promise<InstitutionClass | null> {
  const { data: result, error } = await supabase.from('education_classes').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteClass(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_classes').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── GRADES ───
export async function getGrades(): Promise<Grade[]> {
  const { data, error } = await supabase.from('education_grades').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getGradeById(id: string): Promise<Grade | null> {
  const { data, error } = await supabase.from('education_grades').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function getStudentGrades(studentId: string): Promise<Grade[]> {
  const { data, error } = await supabase.from('education_grades').select('*').eq('student_id', studentId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function createGrade(userId: string, data: Partial<Grade>): Promise<Grade | null> {
  const { data: result, error } = await supabase.from('education_grades').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateGrade(userId: string, id: string, data: Partial<Grade>): Promise<Grade | null> {
  const { data: result, error } = await supabase.from('education_grades').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteGrade(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_grades').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── ASSIGNMENTS ───
export async function getAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase.from('education_assignments').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getAssignmentById(id: string): Promise<Assignment | null> {
  const { data, error } = await supabase.from('education_assignments').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function getClassAssignments(classId: string): Promise<Assignment[]> {
  const { data, error } = await supabase.from('education_assignments').select('*').eq('class_id', classId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function createAssignment(userId: string, data: Partial<Assignment>): Promise<Assignment | null> {
  const { data: result, error } = await supabase.from('education_assignments').insert({ ...data, teacher_id: userId, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateAssignment(userId: string, id: string, data: Partial<Assignment>): Promise<Assignment | null> {
  const { data: result, error } = await supabase.from('education_assignments').update(data).eq('id', id).eq('teacher_id', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteAssignment(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_assignments').delete().eq('id', id).eq('teacher_id', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── SUBMISSIONS ───
export async function getSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabase.from('education_submissions').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getSubmissionById(id: string): Promise<Submission | null> {
  const { data, error } = await supabase.from('education_submissions').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function getPendingSubmissions(teacherId: string): Promise<Submission[]> {
  const { data, error } = await supabase.from('education_submissions').select('*').eq('status', 'pending');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getStudentSubmissions(studentId: string): Promise<Submission[]> {
  const { data, error } = await supabase.from('education_submissions').select('*').eq('student_id', studentId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function createSubmission(userId: string, data: Partial<Submission>): Promise<Submission | null> {
  const { data: result, error } = await supabase.from('education_submissions').insert({ ...data, student_id: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateSubmission(userId: string, id: string, data: Partial<Submission>): Promise<Submission | null> {
  const { data: result, error } = await supabase.from('education_submissions').update(data).eq('id', id).eq('student_id', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteSubmission(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_submissions').delete().eq('id', id).eq('student_id', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── ATTENDANCE ───
export async function getAttendance(): Promise<Attendance[]> {
  const { data, error } = await supabase.from('education_attendance').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getStudentAttendance(studentId: string): Promise<Attendance[]> {
  const { data, error } = await supabase.from('education_attendance').select('*').eq('student_id', studentId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function getClassAttendance(classId: string, date: string): Promise<Attendance[]> {
  const { data, error } = await supabase.from('education_attendance').select('*').eq('class_id', classId).eq('date', date);
  if (error) return handleError(error, []);
  return data || [];
}
export async function createAttendance(userId: string, data: Partial<Attendance>): Promise<Attendance | null> {
  const { data: result, error } = await supabase.from('education_attendance').insert({ ...data, marked_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateAttendance(userId: string, id: string, data: Partial<Attendance>): Promise<Attendance | null> {
  const { data: result, error } = await supabase.from('education_attendance').update(data).eq('id', id).eq('marked_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteAttendance(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_attendance').delete().eq('id', id).eq('marked_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── TIMETABLE ───
export async function getTimetables(): Promise<Timetable[]> {
  const { data, error } = await supabase.from('education_timetable').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getClassTimetable(classId: string): Promise<Timetable[]> {
  const { data, error } = await supabase.from('education_timetable').select('*').eq('class_id', classId).order('day').order('period');
  if (error) return handleError(error, []);
  return data || [];
}
export async function createTimetableEntry(userId: string, data: Partial<Timetable>): Promise<Timetable | null> {
  const { data: result, error } = await supabase.from('education_timetable').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateTimetableEntry(userId: string, id: string, data: Partial<Timetable>): Promise<Timetable | null> {
  const { data: result, error } = await supabase.from('education_timetable').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteTimetableEntry(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_timetable').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── LESSONS ───
export async function getLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase.from('education_lessons').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getLessonById(id: string): Promise<Lesson | null> {
  const { data, error } = await supabase.from('education_lessons').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function getClassLessons(classId: string): Promise<Lesson[]> {
  const { data, error } = await supabase.from('education_lessons').select('*').eq('class_id', classId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function createLesson(userId: string, data: Partial<Lesson>): Promise<Lesson | null> {
  const { data: result, error } = await supabase.from('education_lessons').insert({ ...data, teacher_id: userId, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateLesson(userId: string, id: string, data: Partial<Lesson>): Promise<Lesson | null> {
  const { data: result, error } = await supabase.from('education_lessons').update(data).eq('id', id).eq('teacher_id', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteLesson(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_lessons').delete().eq('id', id).eq('teacher_id', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── EVENTS ───
export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase.from('education_events').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase.from('education_events').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function getInstitutionEvents(institutionId: string): Promise<Event[]> {
  const { data, error } = await supabase.from('education_events').select('*').eq('institution_id', institutionId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function createEvent(userId: string, data: Partial<Event>): Promise<Event | null> {
  const { data: result, error } = await supabase.from('education_events').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateEvent(userId: string, id: string, data: Partial<Event>): Promise<Event | null> {
  const { data: result, error } = await supabase.from('education_events').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteEvent(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_events').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── EXAMS ───
export async function getExams(): Promise<Exam[]> {
  const { data, error } = await supabase.from('education_exams').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getExamById(id: string): Promise<Exam | null> {
  const { data, error } = await supabase.from('education_exams').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function getClassExams(classId: string): Promise<Exam[]> {
  const { data, error } = await supabase.from('education_exams').select('*').eq('class_id', classId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function createExam(userId: string, data: Partial<Exam>): Promise<Exam | null> {
  const { data: result, error } = await supabase.from('education_exams').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateExam(userId: string, id: string, data: Partial<Exam>): Promise<Exam | null> {
  const { data: result, error } = await supabase.from('education_exams').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteExam(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_exams').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── TESTS ───
export async function getTests(): Promise<Test[]> {
  const { data, error } = await supabase.from('education_tests').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getTestById(id: string): Promise<Test | null> {
  const { data, error } = await supabase.from('education_tests').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function createTest(userId: string, data: Partial<Test>): Promise<Test | null> {
  const { data: result, error } = await supabase.from('education_tests').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateTest(userId: string, id: string, data: Partial<Test>): Promise<Test | null> {
  const { data: result, error } = await supabase.from('education_tests').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteTest(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_tests').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── GROUPS ───
export async function getGroups(): Promise<Group[]> {
  const { data, error } = await supabase.from('education_groups').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getGroupById(id: string): Promise<Group | null> {
  const { data, error } = await supabase.from('education_groups').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function createGroup(userId: string, data: Partial<Group>): Promise<Group | null> {
  const { data: result, error } = await supabase.from('education_groups').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateGroup(userId: string, id: string, data: Partial<Group>): Promise<Group | null> {
  const { data: result, error } = await supabase.from('education_groups').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteGroup(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_groups').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── LIVE STREAMS ───
export async function getLiveStreams(): Promise<LiveStream[]> {
  const { data, error } = await supabase.from('education_live_streams').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getLiveStreamById(id: string): Promise<LiveStream | null> {
  const { data, error } = await supabase.from('education_live_streams').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function createLiveStream(userId: string, data: Partial<LiveStream>): Promise<LiveStream | null> {
  const { data: result, error } = await supabase.from('education_live_streams').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateLiveStream(userId: string, id: string, data: Partial<LiveStream>): Promise<LiveStream | null> {
  const { data: result, error } = await supabase.from('education_live_streams').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteLiveStream(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_live_streams').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── QR SESSIONS ───
export async function getQRSessions(): Promise<QRSession[]> {
  const { data, error } = await supabase.from('education_qr_sessions').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function getQRSessionById(id: string): Promise<QRSession | null> {
  const { data, error } = await supabase.from('education_qr_sessions').select('*').eq('id', id).maybeSingle();
  if (error) return handleError(error, null);
  return data;
}
export async function createQRSession(userId: string, data: Partial<QRSession>): Promise<QRSession | null> {
  const { data: result, error } = await supabase.from('education_qr_sessions').insert({ ...data, teacher_id: userId, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateQRSession(userId: string, id: string, data: Partial<QRSession>): Promise<QRSession | null> {
  const { data: result, error } = await supabase.from('education_qr_sessions').update(data).eq('id', id).eq('teacher_id', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteQRSession(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_qr_sessions').delete().eq('id', id).eq('teacher_id', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── WALKING SQUADS ───
export async function getWalkingSquads(): Promise<WalkingSquad[]> {
  const { data, error } = await supabase.from('education_walking_squads').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function createWalkingSquad(userId: string, data: Partial<WalkingSquad>): Promise<WalkingSquad | null> {
  const { data: result, error } = await supabase.from('education_walking_squads').insert({ ...data, leader_id: userId, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateWalkingSquad(userId: string, id: string, data: Partial<WalkingSquad>): Promise<WalkingSquad | null> {
  const { data: result, error } = await supabase.from('education_walking_squads').update(data).eq('id', id).eq('leader_id', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteWalkingSquad(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_walking_squads').delete().eq('id', id).eq('leader_id', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── CONTENT LIBRARY ───
export async function getContentLibrary(): Promise<ContentItem[]> {
  const { data, error } = await supabase.from('education_content_library').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function createContentItem(userId: string, data: Partial<ContentItem>): Promise<ContentItem | null> {
  const { data: result, error } = await supabase.from('education_content_library').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateContentItem(userId: string, id: string, data: Partial<ContentItem>): Promise<ContentItem | null> {
  const { data: result, error } = await supabase.from('education_content_library').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteContentItem(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_content_library').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── RESOURCES ───
export async function getResources(): Promise<Resource[]> {
  const { data, error } = await supabase.from('education_resources').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function createResource(userId: string, data: Partial<Resource>): Promise<Resource | null> {
  const { data: result, error } = await supabase.from('education_resources').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updateResource(userId: string, id: string, data: Partial<Resource>): Promise<Resource | null> {
  const { data: result, error } = await supabase.from('education_resources').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deleteResource(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_resources').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── PAYROLL ───
export async function getPayroll(): Promise<PayrollEntry[]> {
  const { data, error } = await supabase.from('education_payroll').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function createPayroll(userId: string, data: Partial<PayrollEntry>): Promise<PayrollEntry | null> {
  const { data: result, error } = await supabase.from('education_payroll').insert({ ...data, created_by: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function updatePayroll(userId: string, id: string, data: Partial<PayrollEntry>): Promise<PayrollEntry | null> {
  const { data: result, error } = await supabase.from('education_payroll').update(data).eq('id', id).eq('created_by', userId).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}
export async function deletePayroll(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('education_payroll').delete().eq('id', id).eq('created_by', userId);
  if (error) return handleError(error, false);
  return true;
}

// ─── HISTORY ───
export async function getHistory(): Promise<History[]> {
  const { data, error } = await supabase.from('education_history').select('*');
  if (error) return handleError(error, []);
  return data || [];
}
export async function createHistory(userId: string, data: Partial<History>): Promise<History | null> {
  const { data: result, error } = await supabase.from('education_history').insert({ ...data, user_id: userId }).select().maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

// ─── SEARCH & STATS ───
export async function searchEducation(query: string): Promise<any[]> {
  const { data, error } = await supabase.from('education_institutions').select('*').ilike('name', `%${query}%`);
  if (error) return handleError(error, []);
  return data || [];
}
export async function getEducationStats(): Promise<any> {
  const { count: students } = await supabase.from('education_students').select('*', { count: 'exact', head: true });
  const { count: teachers } = await supabase.from('education_teachers').select('*', { count: 'exact', head: true });
  const { count: institutions } = await supabase.from('education_institutions').select('*', { count: 'exact', head: true });
  const { count: classes } = await supabase.from('education_classes').select('*', { count: 'exact', head: true });
  return { students, teachers, institutions, classes };
}

// ─── PARENT PORTAL ───
export async function getParentChildren(parentId: string): Promise<Student[]> {
  const { data, error } = await supabase.from('education_students').select('*').eq('parent_id', parentId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function getChildGrades(parentId: string, childId: string): Promise<Grade[]> {
  const { data, error } = await supabase.from('education_grades').select('*').eq('student_id', childId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function getChildAttendance(parentId: string, childId: string): Promise<Attendance[]> {
  const { data, error } = await supabase.from('education_attendance').select('*').eq('student_id', childId);
  if (error) return handleError(error, []);
  return data || [];
}
export async function getChildAssignments(parentId: string, childId: string): Promise<Assignment[]> {
  const { data: student, error: sErr } = await supabase.from('education_students').select('class_id').eq('id', childId).maybeSingle();
  if (sErr || !student?.class_id) return [];
  const { data, error } = await supabase.from('education_assignments').select('*').eq('class_id', student.class_id);
  if (error) return handleError(error, []);
  return data || [];
}
