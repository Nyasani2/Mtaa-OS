// ============================================================
// MTAA OS V10 - Education Service
// Matches lib/hooks/useEducation.ts imports
// 54 tables: education_students, education_teachers, etc.
// ============================================================

import { supabase } from '@/lib/supabase';

// ─── Types ───
export interface Institution {
  id: string;
  name: string;
  type: string;
  location?: string;
  created_at?: string;
}

export interface InstitutionClass {
  id: string;
  institution_id: string;
  name: string;
  grade_level?: string;
  teacher_id?: string;
}

export interface Student {
  id: string;
  user_id: string;
  institution_id: string;
  class_id?: string;
  enrollment_date?: string;
  status?: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  institution_id: string;
  subject?: string;
  qualification?: string;
}

export interface Grade {
  id: string;
  student_id: string;
  subject: string;
  score: number;
  term: string;
  year: number;
}

export interface Assignment {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  due_date?: string;
  status?: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content?: string;
  status?: string;
  submitted_at?: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface Timetable {
  id: string;
  class_id: string;
  day: string;
  period: number;
  subject: string;
  teacher_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface Lesson {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  content?: string;
  scheduled_at?: string;
}

export interface Event {
  id: string;
  institution_id: string;
  title: string;
  description?: string;
  event_date?: string;
  type?: string;
}

export interface TransportRoute {
  id: string;
  institution_id: string;
  name: string;
  route_data?: any;
  driver_id?: string;
}

export interface FeePayment {
  id: string;
  student_id: string;
  amount: number;
  term: string;
  year: number;
  status?: string;
  paid_at?: string;
}

export interface Earning {
  id: string;
  teacher_id: string;
  amount: number;
  type: string;
  status?: string;
  created_at?: string;
}

export interface ContentItem {
  id: string;
  institution_id: string;
  title: string;
  type: string;
  content?: string;
  url?: string;
  created_by?: string;
}

export interface LiveStream {
  id: string;
  institution_id: string;
  title: string;
  stream_url?: string;
  status?: string;
  started_at?: string;
  ended_at?: string;
}

export interface QRSession {
  id: string;
  class_id: string;
  teacher_id: string;
  qr_code?: string;
  expires_at?: string;
  status?: string;
}

export interface WalkingSquad {
  id: string;
  name: string;
  route?: string;
  leader_id?: string;
  members?: string[];
}

export interface ParentConnection {
  id: string;
  student_id: string;
  parent_id: string;
  status?: string;
}

export interface Alumni {
  id: string;
  user_id: string;
  institution_id: string;
  graduation_year: number;
  current_occupation?: string;
}

export interface Exam {
  id: string;
  class_id: string;
  subject: string;
  exam_date?: string;
  duration?: number;
  total_marks?: number;
}

export interface Test {
  id: string;
  class_id: string;
  subject: string;
  test_date?: string;
  total_marks?: number;
}

export interface Group {
  id: string;
  name: string;
  institution_id?: string;
  class_id?: string;
  created_by?: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  amount: number;
  status?: string;
}

export interface StudentTransport {
  id: string;
  student_id: string;
  route_id: string;
  pickup_point?: string;
  dropoff_point?: string;
}

export interface TeacherBooking {
  id: string;
  teacher_id: string;
  student_id: string;
  booking_date?: string;
  status?: string;
}

export interface TeacherDashboard {
  id: string;
  teacher_id: string;
  metrics?: any;
  updated_at?: string;
}

export interface TeacherService {
  id: string;
  teacher_id: string;
  service_type: string;
  rate?: number;
  status?: string;
}

export interface SchoolAdmin {
  id: string;
  user_id: string;
  institution_id: string;
  role?: string;
}

export interface Staff {
  id: string;
  user_id: string;
  institution_id: string;
  department?: string;
  position?: string;
}

export interface Resource {
  id: string;
  institution_id: string;
  title: string;
  type: string;
  url?: string;
  created_by?: string;
}

export interface History {
  id: string;
  user_id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  created_at?: string;
}

export interface PayrollEntry {
  id: string;
  staff_id: string;
  amount: number;
  month: string;
  year: number;
  status?: string;
}

// ─── Helper ───
function handleError(err: any, fallback: any = null) {
  console.error('[EducationService]', err?.message || err);
  return fallback;
}

// ─── INSTITUTIONS ───

export async function getInstitutions(): Promise<Institution[]> {
  const { data, error } = await supabase
    .from('education_institutions')
    .select('*')
    .order('name');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getInstitutionById(id: string): Promise<Institution | null> {
  const { data, error } = await supabase
    .from('education_institutions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getInstitutionClasses(institutionId: string): Promise<InstitutionClass[]> {
  const { data, error } = await supabase
    .from('education_classes')
    .select('*')
    .eq('institution_id', institutionId)
    .order('name');
  if (error) return handleError(error, []);
  return data || [];
}

export async function createInstitution(data: Partial<Institution>): Promise<Institution | null> {
  const { data: result, error } = await supabase
    .from('education_institutions')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateInstitution(id: string, data: Partial<Institution>): Promise<Institution | null> {
  const { data: result, error } = await supabase
    .from('education_institutions')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteInstitution(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('education_institutions')
    .delete()
    .eq('id', id);
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
  const { data, error } = await supabase
    .from('education_students')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getStudentByUserId(userId: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('education_students')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getClassStudents(classId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('education_students')
    .select('*')
    .eq('class_id', classId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createStudent(data: Partial<Student>): Promise<Student | null> {
  const { data: result, error } = await supabase
    .from('education_students')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student | null> {
  const { data: result, error } = await supabase
    .from('education_students')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteStudent(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_students').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_teachers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getTeacherByUserId(userId: string): Promise<Teacher | null> {
  const { data, error } = await supabase
    .from('education_teachers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getTeacherClasses(teacherId: string): Promise<InstitutionClass[]> {
  const { data, error } = await supabase
    .from('education_classes')
    .select('*')
    .eq('teacher_id', teacherId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createTeacher(data: Partial<Teacher>): Promise<Teacher | null> {
  const { data: result, error } = await supabase
    .from('education_teachers')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher | null> {
  const { data: result, error } = await supabase
    .from('education_teachers')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteTeacher(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_teachers').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_classes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createClass(data: Partial<InstitutionClass>): Promise<InstitutionClass | null> {
  const { data: result, error } = await supabase
    .from('education_classes')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateClass(id: string, data: Partial<InstitutionClass>): Promise<InstitutionClass | null> {
  const { data: result, error } = await supabase
    .from('education_classes')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteClass(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_classes').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_grades')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getStudentGrades(studentId: string): Promise<Grade[]> {
  const { data, error } = await supabase
    .from('education_grades')
    .select('*')
    .eq('student_id', studentId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createGrade(data: Partial<Grade>): Promise<Grade | null> {
  const { data: result, error } = await supabase
    .from('education_grades')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateGrade(id: string, data: Partial<Grade>): Promise<Grade | null> {
  const { data: result, error } = await supabase
    .from('education_grades')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteGrade(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_grades').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_assignments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getClassAssignments(classId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('education_assignments')
    .select('*')
    .eq('class_id', classId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createAssignment(data: Partial<Assignment>): Promise<Assignment | null> {
  const { data: result, error } = await supabase
    .from('education_assignments')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateAssignment(id: string, data: Partial<Assignment>): Promise<Assignment | null> {
  const { data: result, error } = await supabase
    .from('education_assignments')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_assignments').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getPendingSubmissions(teacherId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('education_submissions')
    .select('*')
    .eq('status', 'pending');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getStudentSubmissions(studentId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('education_submissions')
    .select('*')
    .eq('student_id', studentId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createSubmission(data: Partial<Submission>): Promise<Submission | null> {
  const { data: result, error } = await supabase
    .from('education_submissions')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateSubmission(id: string, data: Partial<Submission>): Promise<Submission | null> {
  const { data: result, error } = await supabase
    .from('education_submissions')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_submissions').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_attendance')
    .select('*')
    .eq('student_id', studentId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function getClassAttendance(classId: string, date: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('education_attendance')
    .select('*')
    .eq('class_id', classId)
    .eq('date', date);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createAttendance(data: Partial<Attendance>): Promise<Attendance | null> {
  const { data: result, error } = await supabase
    .from('education_attendance')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateAttendance(id: string, data: Partial<Attendance>): Promise<Attendance | null> {
  const { data: result, error } = await supabase
    .from('education_attendance')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteAttendance(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_attendance').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_timetable')
    .select('*')
    .eq('class_id', classId)
    .order('day')
    .order('period');
  if (error) return handleError(error, []);
  return data || [];
}

export async function createTimetableEntry(data: Partial<Timetable>): Promise<Timetable | null> {
  const { data: result, error } = await supabase
    .from('education_timetable')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateTimetableEntry(id: string, data: Partial<Timetable>): Promise<Timetable | null> {
  const { data: result, error } = await supabase
    .from('education_timetable')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteTimetableEntry(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_timetable').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getClassLessons(classId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('education_lessons')
    .select('*')
    .eq('class_id', classId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createLesson(data: Partial<Lesson>): Promise<Lesson | null> {
  const { data: result, error } = await supabase
    .from('education_lessons')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson | null> {
  const { data: result, error } = await supabase
    .from('education_lessons')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteLesson(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_lessons').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_events')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getInstitutionEvents(institutionId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('education_events')
    .select('*')
    .eq('institution_id', institutionId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createEvent(data: Partial<Event>): Promise<Event | null> {
  const { data: result, error } = await supabase
    .from('education_events')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event | null> {
  const { data: result, error } = await supabase
    .from('education_events')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_events').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── TRANSPORT ROUTES ───

export async function getTransportRoutes(): Promise<TransportRoute[]> {
  const { data, error } = await supabase.from('education_transport_routes').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getTransportRouteById(id: string): Promise<TransportRoute | null> {
  const { data, error } = await supabase
    .from('education_transport_routes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createTransportRoute(data: Partial<TransportRoute>): Promise<TransportRoute | null> {
  const { data: result, error } = await supabase
    .from('education_transport_routes')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateTransportRoute(id: string, data: Partial<TransportRoute>): Promise<TransportRoute | null> {
  const { data: result, error } = await supabase
    .from('education_transport_routes')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteTransportRoute(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_transport_routes').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── FEE PAYMENTS ───

export async function getFeePayments(): Promise<FeePayment[]> {
  const { data, error } = await supabase.from('education_fee_payments').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getStudentFeePayments(studentId: string): Promise<FeePayment[]> {
  const { data, error } = await supabase
    .from('education_fee_payments')
    .select('*')
    .eq('student_id', studentId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createFeePayment(data: Partial<FeePayment>): Promise<FeePayment | null> {
  const { data: result, error } = await supabase
    .from('education_fee_payments')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateFeePayment(id: string, data: Partial<FeePayment>): Promise<FeePayment | null> {
  const { data: result, error } = await supabase
    .from('education_fee_payments')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteFeePayment(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_fee_payments').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── EARNINGS ───

export async function getEarnings(): Promise<Earning[]> {
  const { data, error } = await supabase.from('education_earnings_transactions').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getTeacherEarnings(teacherId: string): Promise<Earning[]> {
  const { data, error } = await supabase
    .from('education_earnings_transactions')
    .select('*')
    .eq('teacher_id', teacherId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createEarning(data: Partial<Earning>): Promise<Earning | null> {
  const { data: result, error } = await supabase
    .from('education_earnings_transactions')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateEarning(id: string, data: Partial<Earning>): Promise<Earning | null> {
  const { data: result, error } = await supabase
    .from('education_earnings_transactions')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteEarning(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_earnings_transactions').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── CONTENT LIBRARY ───

export async function getContentLibrary(): Promise<ContentItem[]> {
  const { data, error } = await supabase.from('education_content_library').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getContentItemById(id: string): Promise<ContentItem | null> {
  const { data, error } = await supabase
    .from('education_content_library')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createContentItem(data: Partial<ContentItem>): Promise<ContentItem | null> {
  const { data: result, error } = await supabase
    .from('education_content_library')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateContentItem(id: string, data: Partial<ContentItem>): Promise<ContentItem | null> {
  const { data: result, error } = await supabase
    .from('education_content_library')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteContentItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_content_library').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_live_streams')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createLiveStream(data: Partial<LiveStream>): Promise<LiveStream | null> {
  const { data: result, error } = await supabase
    .from('education_live_streams')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateLiveStream(id: string, data: Partial<LiveStream>): Promise<LiveStream | null> {
  const { data: result, error } = await supabase
    .from('education_live_streams')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteLiveStream(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_live_streams').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_qr_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createQRSession(data: Partial<QRSession>): Promise<QRSession | null> {
  const { data: result, error } = await supabase
    .from('education_qr_sessions')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateQRSession(id: string, data: Partial<QRSession>): Promise<QRSession | null> {
  const { data: result, error } = await supabase
    .from('education_qr_sessions')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteQRSession(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_qr_sessions').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── WALKING SQUADS ───

export async function getWalkingSquads(): Promise<WalkingSquad[]> {
  const { data, error } = await supabase.from('education_walking_squads').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getWalkingSquadById(id: string): Promise<WalkingSquad | null> {
  const { data, error } = await supabase
    .from('education_walking_squads')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createWalkingSquad(data: Partial<WalkingSquad>): Promise<WalkingSquad | null> {
  const { data: result, error } = await supabase
    .from('education_walking_squads')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateWalkingSquad(id: string, data: Partial<WalkingSquad>): Promise<WalkingSquad | null> {
  const { data: result, error } = await supabase
    .from('education_walking_squads')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteWalkingSquad(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_walking_squads').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── PARENT CONNECTIONS ───

export async function getParentConnections(): Promise<ParentConnection[]> {
  const { data, error } = await supabase.from('education_parent_connections').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getParentConnectionById(id: string): Promise<ParentConnection | null> {
  const { data, error } = await supabase
    .from('education_parent_connections')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createParentConnection(data: Partial<ParentConnection>): Promise<ParentConnection | null> {
  const { data: result, error } = await supabase
    .from('education_parent_connections')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateParentConnection(id: string, data: Partial<ParentConnection>): Promise<ParentConnection | null> {
  const { data: result, error } = await supabase
    .from('education_parent_connections')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteParentConnection(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_parent_connections').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── ALUMNI ───

export async function getAlumni(): Promise<Alumni[]> {
  const { data, error } = await supabase.from('education_alumni').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getAlumniById(id: string): Promise<Alumni | null> {
  const { data, error } = await supabase
    .from('education_alumni')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createAlumni(data: Partial<Alumni>): Promise<Alumni | null> {
  const { data: result, error } = await supabase
    .from('education_alumni')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateAlumni(id: string, data: Partial<Alumni>): Promise<Alumni | null> {
  const { data: result, error } = await supabase
    .from('education_alumni')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteAlumni(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_alumni').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_exams')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getClassExams(classId: string): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('education_exams')
    .select('*')
    .eq('class_id', classId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createExam(data: Partial<Exam>): Promise<Exam | null> {
  const { data: result, error } = await supabase
    .from('education_exams')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateExam(id: string, data: Partial<Exam>): Promise<Exam | null> {
  const { data: result, error } = await supabase
    .from('education_exams')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteExam(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_exams').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_tests')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createTest(data: Partial<Test>): Promise<Test | null> {
  const { data: result, error } = await supabase
    .from('education_tests')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateTest(id: string, data: Partial<Test>): Promise<Test | null> {
  const { data: result, error } = await supabase
    .from('education_tests')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteTest(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_tests').delete().eq('id', id);
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
  const { data, error } = await supabase
    .from('education_groups')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createGroup(data: Partial<Group>): Promise<Group | null> {
  const { data: result, error } = await supabase
    .from('education_groups')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateGroup(id: string, data: Partial<Group>): Promise<Group | null> {
  const { data: result, error } = await supabase
    .from('education_groups')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteGroup(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_groups').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── PURCHASES ───

export async function getPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase.from('education_purchases').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getPurchaseById(id: string): Promise<Purchase | null> {
  const { data, error } = await supabase
    .from('education_purchases')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createPurchase(data: Partial<Purchase>): Promise<Purchase | null> {
  const { data: result, error } = await supabase
    .from('education_purchases')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updatePurchase(id: string, data: Partial<Purchase>): Promise<Purchase | null> {
  const { data: result, error } = await supabase
    .from('education_purchases')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deletePurchase(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_purchases').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── STUDENT TRANSPORT ───

export async function getStudentTransport(): Promise<StudentTransport[]> {
  const { data, error } = await supabase.from('education_student_transport').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getStudentTransportById(id: string): Promise<StudentTransport | null> {
  const { data, error } = await supabase
    .from('education_student_transport')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createStudentTransport(data: Partial<StudentTransport>): Promise<StudentTransport | null> {
  const { data: result, error } = await supabase
    .from('education_student_transport')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateStudentTransport(id: string, data: Partial<StudentTransport>): Promise<StudentTransport | null> {
  const { data: result, error } = await supabase
    .from('education_student_transport')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteStudentTransport(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_student_transport').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── TEACHER BOOKINGS ───

export async function getTeacherBookings(): Promise<TeacherBooking[]> {
  const { data, error } = await supabase.from('education_teacher_bookings').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getTeacherBookingById(id: string): Promise<TeacherBooking | null> {
  const { data, error } = await supabase
    .from('education_teacher_bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createTeacherBooking(data: Partial<TeacherBooking>): Promise<TeacherBooking | null> {
  const { data: result, error } = await supabase
    .from('education_teacher_bookings')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateTeacherBooking(id: string, data: Partial<TeacherBooking>): Promise<TeacherBooking | null> {
  const { data: result, error } = await supabase
    .from('education_teacher_bookings')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteTeacherBooking(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_teacher_bookings').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── TEACHER DASHBOARDS ───

export async function getTeacherDashboards(): Promise<TeacherDashboard[]> {
  const { data, error } = await supabase.from('education_teacher_dashboards').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getTeacherDashboardById(id: string): Promise<TeacherDashboard | null> {
  const { data, error } = await supabase
    .from('education_teacher_dashboards')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createTeacherDashboard(data: Partial<TeacherDashboard>): Promise<TeacherDashboard | null> {
  const { data: result, error } = await supabase
    .from('education_teacher_dashboards')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateTeacherDashboard(id: string, data: Partial<TeacherDashboard>): Promise<TeacherDashboard | null> {
  const { data: result, error } = await supabase
    .from('education_teacher_dashboards')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteTeacherDashboard(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_teacher_dashboards').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── TEACHER SERVICES ───

export async function getTeacherServices(): Promise<TeacherService[]> {
  const { data, error } = await supabase.from('education_teacher_services').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getTeacherServiceById(id: string): Promise<TeacherService | null> {
  const { data, error } = await supabase
    .from('education_teacher_services')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createTeacherService(data: Partial<TeacherService>): Promise<TeacherService | null> {
  const { data: result, error } = await supabase
    .from('education_teacher_services')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateTeacherService(id: string, data: Partial<TeacherService>): Promise<TeacherService | null> {
  const { data: result, error } = await supabase
    .from('education_teacher_services')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteTeacherService(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_teacher_services').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── SCHOOL ADMINS ───

export async function getSchoolAdmins(): Promise<SchoolAdmin[]> {
  const { data, error } = await supabase.from('education_school_admins').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getSchoolAdminById(id: string): Promise<SchoolAdmin | null> {
  const { data, error } = await supabase
    .from('education_school_admins')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createSchoolAdmin(data: Partial<SchoolAdmin>): Promise<SchoolAdmin | null> {
  const { data: result, error } = await supabase
    .from('education_school_admins')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateSchoolAdmin(id: string, data: Partial<SchoolAdmin>): Promise<SchoolAdmin | null> {
  const { data: result, error } = await supabase
    .from('education_school_admins')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteSchoolAdmin(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_school_admins').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── STAFF ───

export async function getStaff(): Promise<Staff[]> {
  const { data, error } = await supabase.from('education_staff').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getStaffById(id: string): Promise<Staff | null> {
  const { data, error } = await supabase
    .from('education_staff')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createStaff(data: Partial<Staff>): Promise<Staff | null> {
  const { data: result, error } = await supabase
    .from('education_staff')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateStaff(id: string, data: Partial<Staff>): Promise<Staff | null> {
  const { data: result, error } = await supabase
    .from('education_staff')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteStaff(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_staff').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── RESOURCES / CONTENT LIBRARY ───

export async function getResources(): Promise<Resource[]> {
  const { data, error } = await supabase.from('education_resources').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const { data, error } = await supabase
    .from('education_resources')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createResource(data: Partial<Resource>): Promise<Resource | null> {
  const { data: result, error } = await supabase
    .from('education_resources')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateResource(id: string, data: Partial<Resource>): Promise<Resource | null> {
  const { data: result, error } = await supabase
    .from('education_resources')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteResource(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_resources').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── HISTORY ───

export async function getHistory(): Promise<History[]> {
  const { data, error } = await supabase.from('education_history').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getHistoryById(id: string): Promise<History | null> {
  const { data, error } = await supabase
    .from('education_history')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function createHistory(data: Partial<History>): Promise<History | null> {
  const { data: result, error } = await supabase
    .from('education_history')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updateHistory(id: string, data: Partial<History>): Promise<History | null> {
  const { data: result, error } = await supabase
    .from('education_history')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteHistory(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_history').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── PAYROLL ───

export async function getPayroll(): Promise<PayrollEntry[]> {
  const { data, error } = await supabase.from('education_payroll').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getPayrollById(id: string): Promise<PayrollEntry | null> {
  const { data, error } = await supabase
    .from('education_payroll')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return handleError(error, null);
  return data;
}

export async function getStaffPayroll(staffId: string): Promise<PayrollEntry[]> {
  const { data, error } = await supabase
    .from('education_payroll')
    .select('*')
    .eq('staff_id', staffId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createPayroll(data: Partial<PayrollEntry>): Promise<PayrollEntry | null> {
  const { data: result, error } = await supabase
    .from('education_payroll')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function updatePayroll(id: string, data: Partial<PayrollEntry>): Promise<PayrollEntry | null> {
  const { data: result, error } = await supabase
    .from('education_payroll')
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return handleError(error, null);
  return result;
}

export async function deletePayroll(id: string): Promise<boolean> {
  const { error } = await supabase.from('education_payroll').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── SEARCH ───

export async function searchEducation(query: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('education_institutions')
    .select('*')
    .ilike('name', `%${query}%`);
  if (error) return handleError(error, []);
  return data || [];
}

// ─── STATS ───

export async function getEducationStats(): Promise<any> {
  const { count: students } = await supabase.from('education_students').select('*', { count: 'exact', head: true });
  const { count: teachers } = await supabase.from('education_teachers').select('*', { count: 'exact', head: true });
  const { count: institutions } = await supabase.from('education_institutions').select('*', { count: 'exact', head: true });
  const { count: classes } = await supabase.from('education_classes').select('*', { count: 'exact', head: true });
  return { students, teachers, institutions, classes };
}
