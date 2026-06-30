
import { supabase } from '@/lib/supabase';

// ==================== TYPES (matching YOUR schema) ====================

export interface Institution {
  id: string;
  name: string;
  type: string;
  registration_number: string | null;
  address: string | null;
  city: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  principal_id: string | null;
  status: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  institution_id: string;
  employee_number: string | null;
  subjects: string[];
  specialization: string | null;
  years_experience: number;
  status: string;
  class_teacher_of: string | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

export interface Student {
  id: string;
  user_id: string;
  institution_id: string;
  current_class_id: string | null;
  admission_number: string;
  roll_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  medical_alerts: string[];
  allergies: string[];
  emergency_contacts: any[];
  status: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

export interface Class {
  id: string;
  institution_id: string;
  name: string;
  grade_level: string;
  stream: string;
  class_teacher_id: string | null;
  capacity: number;
  academic_year: string;
  term: string;
}

export interface Subject {
  id: string;
  institution_id: string;
  name: string;
  code: string | null;
  category: string | null;
  description: string | null;
}

export interface Lesson {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  schedule: any[];
  created_at: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  type: string;
  max_score: number;
  due_date: string | null;
  status: string;
  created_at: string;
  subject?: { name: string };
  class?: { name: string; grade_level: string };
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  score: number | null;
  feedback: string | null;
  status: string;
  submitted_at: string;
  graded_at: string | null;
  graded_by: string | null;
}

export interface Grade {
  id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  score: number;
  max_score: number;
  grade_letter: string | null;
  remarks: string | null;
  term: string;
  academic_year: string;
  created_at: string;
  subject?: { name: string };
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  lesson_id: string;
  date: string;
  status: string;
  notes: string | null;
  marked_by: string | null;
  marked_at: string;
}

export interface TimetableEntry {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subject?: { name: string };
  teacher?: { profile: { display_name: string } };
}

export interface Announcement {
  id: string;
  institution_id: string;
  title: string;
  content: string;
  target_audience: string[];
  priority: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  class_id: string | null;
  institution_id: string | null;
  subject: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: { display_name: string | null; avatar_url: string | null };
}

export interface Fee {
  id: string;
  institution_id: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: string;
  due_date: string | null;
  status: string;
}

export interface LibraryResource {
  id: string;
  institution_id: string;
  title: string;
  author: string | null;
  type: string;
  category: string | null;
  url: string | null;
  cover_url: string | null;
  available_copies: number;
}

export interface Event {
  id: string;
  institution_id: string;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
}

export interface Feed {
  id: string;
  institution_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  institution_id: string;
  teacher_id: string;
  amount: number;
  month: string;
  year: string;
  status: string;
}

// ==================== SCHOOL ADMIN ====================

export async function createSchool(payload: Partial<Institution>) {
  const { data, error } = await supabase
    .from('education_institutions')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Institution;
}

export async function getSchools() {
  const { data, error } = await supabase
    .from('education_institutions')
    .select('*')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return data as Institution[];
}

export async function getSchoolById(id: string) {
  const { data, error } = await supabase
    .from('education_institutions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function addTeacher(payload: Partial<Teacher>) {
  const { data, error } = await supabase
    .from('education_teachers')
    .insert(payload)
    .select('*, profiles:profiles(user_id, display_name, avatar_url, email)')
    .single();
  if (error) throw error;
  return data as Teacher;
}

export async function getTeachers(institutionId: string) {
  const { data, error } = await supabase
    .from('education_teachers')
    .select('*, profiles:profiles(user_id, display_name, avatar_url, email)')
    .eq('institution_id', institutionId)
    .eq('status', 'active');
  if (error) throw error;
  return data as Teacher[];
}

export async function addStudent(payload: Partial<Student>) {
  const { data, error } = await supabase
    .from('education_students')
    .insert(payload)
    .select('*, profiles:profiles(user_id, display_name, avatar_url, email)')
    .single();
  if (error) throw error;
  return data as Student;
}

export async function getStudents(institutionId: string, classId?: string) {
  let query = supabase
    .from('education_students')
    .select('*, profiles:profiles(user_id, display_name, avatar_url, email), education_classes(name, grade_level)')
    .eq('institution_id', institutionId);
  if (classId) query = query.eq('current_class_id', classId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Student[];
}

export async function connectParent(payload: { parent_id: string; student_id: string; relationship: string; is_primary_contact?: boolean }) {
  const { data, error } = await supabase
    .from('education_parent_connections')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getParentConnections(studentId: string) {
  const { data, error } = await supabase
    .from('education_parent_connections')
    .select('*, profiles:profiles(user_id, display_name, avatar_url, phone)')
    .eq('student_id', studentId);
  if (error) throw error;
  return data;
}

export async function createClass(payload: Partial<Class>) {
  const { data, error } = await supabase
    .from('education_classes')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Class;
}

export async function getClasses(institutionId: string) {
  const { data, error } = await supabase
    .from('education_classes')
    .select('*, education_teachers(user_id, profiles:profiles(display_name))')
    .eq('institution_id', institutionId)
    .order('grade_level');
  if (error) throw error;
  return data as Class[];
}

export async function createSubject(payload: Partial<Subject>) {
  const { data, error } = await supabase
    .from('education_subjects')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Subject;
}

export async function getSubjects(institutionId: string) {
  const { data, error } = await supabase
    .from('education_subjects')
    .select('*')
    .eq('institution_id', institutionId);
  if (error) throw error;
  return data as Subject[];
}

export async function createLesson(payload: Partial<Lesson>) {
  const { data, error } = await supabase
    .from('education_lessons')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Lesson;
}

// ==================== TEACHER OPERATIONS ====================

export async function createAssignment(payload: Partial<Assignment>) {
  const { data, error } = await supabase
    .from('education_assignments')
    .insert(payload)
    .select('*, education_subjects(name), education_classes(name, grade_level)')
    .single();
  if (error) throw error;
  return data as Assignment;
}

export async function getAssignments(teacherId?: string, classId?: string) {
  let query = supabase
    .from('education_assignments')
    .select('*, education_subjects(name), education_classes(name, grade_level)')
    .order('created_at', { ascending: false });
  if (teacherId) query = query.eq('teacher_id', teacherId);
  if (classId) query = query.eq('class_id', classId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Assignment[];
}

export async function getSubmissions(assignmentId: string) {
  const { data, error } = await supabase
    .from('education_submissions')
    .select('*, education_students(user_id, profiles:profiles(display_name, avatar_url))')
    .eq('assignment_id', assignmentId);
  if (error) throw error;
  return data as Submission[];
}

export async function gradeSubmission(submissionId: string, score: number, feedback: string, teacherId: string) {
  const { data, error } = await supabase
    .from('education_submissions')
    .update({ score, feedback, status: 'graded', graded_by: teacherId, graded_at: new Date().toISOString() })
    .eq('id', submissionId)
    .select()
    .single();
  if (error) throw error;
  return data as Submission;
}

export async function markAttendance(records: Partial<AttendanceRecord>[]) {
  const { data, error } = await supabase
    .from('education_attendance')
    .upsert(records, { onConflict: 'student_id,date,lesson_id' })
    .select();
  if (error) throw error;
  return data as AttendanceRecord[];
}

export async function getAttendance(classId: string, date: string) {
  const { data, error } = await supabase
    .from('education_attendance')
    .select('*, education_students(user_id, profiles:profiles(display_name, avatar_url)), education_lessons(subject_id, education_subjects(name))')
    .eq('class_id', classId)
    .eq('date', date);
  if (error) throw error;
  return data as AttendanceRecord[];
}

export async function getStudentAttendance(studentId: string, limit = 30) {
  const { data, error } = await supabase
    .from('education_attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as AttendanceRecord[];
}

export async function createTimetableEntry(payload: Partial<TimetableEntry>) {
  const { data, error } = await supabase
    .from('education_lessons')
    .insert(payload)
    .select('*, education_subjects(name), education_teachers(profiles:profiles(display_name))')
    .single();
  if (error) throw error;
  return data;
}

export async function getTimetable(classId: string) {
  const { data, error } = await supabase
    .from('education_lessons')
    .select('*, education_subjects(name), education_teachers(profiles:profiles(display_name))')
    .eq('class_id', classId)
    .order('created_at');
  if (error) throw error;
  return data;
}

// ==================== STUDENT OPERATIONS ====================

export async function submitAssignment(payload: Partial<Submission>) {
  const { data, error } = await supabase
    .from('education_submissions')
    .insert({ ...payload, submitted_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as Submission;
}

export async function getStudentAssignments(studentId: string) {
  const { data: student } = await supabase
    .from('education_students')
    .select('current_class_id')
    .eq('id', studentId)
    .single();
  if (!student?.current_class_id) return [];

  const { data, error } = await supabase
    .from('education_assignments')
    .select('*, education_subjects(name), education_classes(name, grade_level)')
    .eq('class_id', student.current_class_id)
    .eq('status', 'published')
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data as Assignment[];
}

export async function getStudentGrades(studentId: string) {
  const { data, error } = await supabase
    .from('education_grades')
    .select('*, education_subjects(name)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Grade[];
}

export async function getStudentTimetable(studentId: string) {
  const { data: student } = await supabase
    .from('education_students')
    .select('current_class_id')
    .eq('id', studentId)
    .single();
  if (!student?.current_class_id) return [];

  return getTimetable(student.current_class_id);
}

// ==================== PARENT OPERATIONS ====================

export async function getParentChildren(parentId: string) {
  const { data, error } = await supabase
    .from('education_parent_connections')
    .select('*, education_students(*, profiles:profiles(display_name, avatar_url), education_classes(name, grade_level))')
    .eq('parent_id', parentId);
  if (error) throw error;
  return data;
}

export async function getChildGrades(parentId: string) {
  const { data: connections } = await supabase
    .from('education_parent_connections')
    .select('student_id')
    .eq('parent_id', parentId);
  if (!connections?.length) return [];

  const studentIds = connections.map(c => c.student_id);
  const { data, error } = await supabase
    .from('education_grades')
    .select('*, education_students(user_id, profiles:profiles(display_name, avatar_url)), education_subjects(name)')
    .in('student_id', studentIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Grade[];
}

export async function getChildAttendance(parentId: string) {
  const { data: connections } = await supabase
    .from('education_parent_connections')
    .select('student_id')
    .eq('parent_id', parentId);
  if (!connections?.length) return [];

  const studentIds = connections.map(c => c.student_id);
  const { data, error } = await supabase
    .from('education_attendance')
    .select('*, education_students(user_id, profiles:profiles(display_name, avatar_url))')
    .in('student_id', studentIds)
    .order('date', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data as AttendanceRecord[];
}

// ==================== MESSAGES ====================

export async function sendMessage(payload: Partial<Message>) {
  const { data, error } = await supabase
    .from('education_messages')
    .insert(payload)
    .select('*, sender:profiles!sender_id(display_name, avatar_url)')
    .single();
  if (error) throw error;
  return data as Message;
}

export async function getMessages(userId: string) {
  const { data, error } = await supabase
    .from('education_messages')
    .select('*, sender:profiles!sender_id(display_name, avatar_url)')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Message[];
}

export async function markMessageRead(messageId: string) {
  const { data, error } = await supabase
    .from('education_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== ANNOUNCEMENTS ====================

export async function createAnnouncement(payload: Partial<Announcement>) {
  const { data, error } = await supabase
    .from('education_announcements')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Announcement;
}

export async function getAnnouncements(institutionId: string) {
  const { data, error } = await supabase
    .from('education_announcements')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data as Announcement[];
}

// ==================== LIBRARY ====================

export async function getLibraryResources(institutionId: string) {
  const { data, error } = await supabase
    .from('education_content_library')
    .select('*')
    .eq('institution_id', institutionId)
    .order('title');
  if (error) throw error;
  return data as LibraryResource[];
}

// ==================== EVENTS ====================

export async function getEvents(institutionId: string) {
  const { data, error } = await supabase
    .from('education_events')
    .select('*')
    .eq('institution_id', institutionId)
    .gte('start_date', new Date().toISOString())
    .order('start_date')
    .limit(20);
  if (error) throw error;
  return data as Event[];
}

// ==================== FEED ====================

export async function getFeeds(institutionId: string) {
  const { data, error } = await supabase
    .from('education_feeds')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data as Feed[];
}

// ==================== PAYROLL ====================

export async function getPayroll(institutionId: string) {
  const { data, error } = await supabase
    .from('education_payroll')
    .select('*, education_teachers(user_id, profiles:profiles(display_name))')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as PayrollRecord[];
}

// ==================== DASHBOARD DATA ====================

export async function getStudentDashboardData(studentId: string) {
  const { data: student } = await supabase
    .from('education_students')
    .select('current_class_id, institution_id')
    .eq('id', studentId)
    .single();
  if (!student) throw new Error('Student not found');

  const [assignments, grades, attendance, timetable, announcements] = await Promise.all([
    getStudentAssignments(studentId),
    getStudentGrades(studentId),
    getStudentAttendance(studentId),
    getStudentTimetable(studentId),
    getAnnouncements(student.institution_id)
  ]);

  return { assignments, grades, attendance, timetable, announcements };
}

export async function getTeacherDashboardData(teacherId: string) {
  const { data: teacher } = await supabase
    .from('education_teachers')
    .select('institution_id')
    .eq('id', teacherId)
    .single();
  if (!teacher) throw new Error('Teacher not found');

  const [classes, assignments, students] = await Promise.all([
    getClasses(teacher.institution_id),
    getAssignments(teacherId),
    getStudents(teacher.institution_id)
  ]);

  return { classes, assignments, students };
}

export async function getParentDashboardData(parentId: string) {
  const [children, messages] = await Promise.all([
    getParentChildren(parentId),
    getMessages(parentId)
  ]);

  const studentIds = children.map((c: any) => c.student_id);
  let grades: Grade[] = [];
  let attendance: AttendanceRecord[] = [];

  if (studentIds.length > 0) {
    [grades, attendance] = await Promise.all([
      supabase.from('education_grades').select('*, education_subjects(name), education_students(user_id, profiles:profiles(display_name, avatar_url))').in('student_id', studentIds).order('created_at', { ascending: false }).then(r => r.data || []),
      supabase.from('education_attendance').select('*, education_students(user_id, profiles:profiles(display_name, avatar_url))').in('student_id', studentIds).order('date', { ascending: false }).limit(30).then(r => r.data || [])
    ]);
  }

  return { children, grades, attendance, messages };
}
