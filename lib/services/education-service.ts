import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/auth/store/auth.store";

// ─── Types ──────────────────────────────────────────────────────────
export interface EducationInstitution {
  id: string;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  status: string;
  created_at: string;
}

export interface EducationTeacher {
  id: string;
  user_id: string;
  institution_id: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  employment_type?: string;
  salary_grade?: string;
  status: string;
  created_at: string;
}

export interface EducationStudent {
  id: string;
  user_id: string;
  institution_id: string;
  grade_level?: string;
  enrollment_number?: string;
  guardian_name?: string;
  guardian_phone?: string;
  status: string;
  created_at: string;
}

export interface EducationAssignment {
  id: string;
  institution_id: string;
  teacher_id: string;
  class_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  max_score?: number;
  status: string;
  created_at: string;
}

export interface EducationClass {
  id: string;
  institution_id: string;
  name: string;
  grade_level?: string;
  room_number?: string;
  capacity?: number;
  teacher_id?: string;
  status: string;
  created_at: string;
}

export interface EducationAttendance {
  id: string;
  student_id: string;
  class_id?: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  marked_by?: string;
  created_at: string;
}

export interface EducationFee {
  id: string;
  student_id: string;
  institution_id: string;
  fee_type: string;
  amount: number;
  currency?: string;
  due_date?: string;
  paid_amount?: number;
  status: "pending" | "partial" | "paid" | "overdue";
  created_at: string;
}

export interface EducationGrade {
  id: string;
  student_id: string;
  assignment_id?: string;
  subject?: string;
  score: number;
  max_score?: number;
  grade_letter?: string;
  remarks?: string;
  teacher_id?: string;
  created_at: string;
}

export interface EducationLibraryItem {
  id: string;
  institution_id: string;
  title: string;
  author?: string;
  isbn?: string;
  category?: string;
  type: "book" | "digital" | "video" | "audio";
  file_url?: string;
  cover_url?: string;
  quantity?: number;
  available?: number;
  status: string;
  created_at: string;
}

export interface EducationMessage {
  id: string;
  sender_id: string;
  receiver_id?: string;
  institution_id?: string;
  class_id?: string;
  subject?: string;
  body: string;
  message_type?: string;
  is_broadcast?: boolean;
  read_at?: string;
  created_at: string;
}

export interface EducationTimetable {
  id: string;
  institution_id: string;
  class_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject?: string;
  teacher_id?: string;
  room?: string;
  status: string;
  created_at: string;
}

export interface EducationTransport {
  id: string;
  institution_id: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  route_name?: string;
  capacity?: number;
  status: string;
  created_at: string;
}

export interface EducationParticipant {
  id: string;
  event_id: string;
  user_id: string;
  role?: string;
  registration_status?: string;
  attended?: boolean;
  created_at: string;
}

export interface EducationPayroll {
  id: string;
  teacher_id: string;
  institution_id: string;
  month: string;
  year: number;
  base_salary: number;
  allowances?: number;
  deductions?: number;
  net_pay: number;
  currency?: string;
  status: "draft" | "approved" | "paid";
  paid_at?: string;
  created_at: string;
}

export interface EducationEmergency {
  id: string;
  institution_id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location?: string;
  reported_by?: string;
  resolved_at?: string;
  status: "active" | "resolved" | "escalated";
  created_at: string;
}

export interface EducationQRCheckin {
  id: string;
  user_id: string;
  institution_id?: string;
  checkin_type: string;
  qr_code?: string;
  latitude?: number;
  longitude?: number;
  verified_at?: string;
  created_at: string;
}

export interface EducationEvent {
  id: string;
  institution_id: string;
  title: string;
  description?: string;
  event_type?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  organizer_id?: string;
  status: string;
  created_at: string;
}

// ─── Service ────────────────────────────────────────────────────────
export class EducationService {
  // Institutions
  static async getInstitutions(): Promise<EducationInstitution[]> {
    const { data, error } = await supabase
      .from("education_institutions")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async getInstitutionById(id: string): Promise<EducationInstitution | null> {
    const { data, error } = await supabase
      .from("education_institutions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  // Teachers
  static async getTeachers(institutionId?: string): Promise<EducationTeacher[]> {
    let q = supabase.from("education_teachers").select("*");
    if (institutionId) q = q.eq("institution_id", institutionId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Students
  static async getStudents(institutionId?: string): Promise<EducationStudent[]> {
    let q = supabase.from("education_students").select("*");
    if (institutionId) q = q.eq("institution_id", institutionId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Assignments
  static async getAssignments(institutionId?: string): Promise<EducationAssignment[]> {
    let q = supabase.from("education_assignments").select("*");
    if (institutionId) q = q.eq("institution_id", institutionId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getAssignmentById(id: string): Promise<EducationAssignment | null> {
    const { data, error } = await supabase
      .from("education_assignments")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  static async submitAssignment(payload: {
    assignment_id: string;
    student_id: string;
    submission_text?: string;
    file_url?: string;
  }) {
    const { data, error } = await supabase
      .from("education_submissions")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Classes
  static async getClasses(institutionId?: string): Promise<EducationClass[]> {
    let q = supabase.from("education_classes").select("*");
    if (institutionId) q = q.eq("institution_id", institutionId);
    const { data, error } = await q.order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // Attendance
  static async getAttendance(params?: { classId?: string; date?: string }): Promise<EducationAttendance[]> {
    let q = supabase.from("education_attendance").select("*");
    if (params?.classId) q = q.eq("class_id", params.classId);
    if (params?.date) q = q.eq("date", params.date);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async markAttendance(payload: Omit<EducationAttendance, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("education_attendance")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Fees
  static async getFees(studentId?: string): Promise<EducationFee[]> {
    let q = supabase.from("education_fees").select("*");
    if (studentId) q = q.eq("student_id", studentId);
    const { data, error } = await q.order("due_date", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // Grades
  static async getGrades(studentId?: string): Promise<EducationGrade[]> {
    let q = supabase.from("education_grades").select("*");
    if (studentId) q = q.eq("student_id", studentId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Library
  static async getLibraryItems(institutionId?: string): Promise<EducationLibraryItem[]> {
    let q = supabase.from("education_library").select("*");
    if (institutionId) q = q.eq("institution_id", institutionId);
    const { data, error } = await q.order("title", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async uploadLibraryItem(payload: Omit<EducationLibraryItem, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("education_library")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Messages
  static async getMessages(userId: string): Promise<EducationMessage[]> {
    const { data, error } = await supabase
      .from("education_messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async sendMessage(payload: Omit<EducationMessage, "id" | "created_at" | "read_at">) {
    const { data, error } = await supabase
      .from("education_messages")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Timetable
  static async getTimetable(institutionId?: string): Promise<EducationTimetable[]> {
    let q = supabase.from("education_timetable").select("*");
    if (institutionId) q = q.eq("institution_id", institutionId);
    const { data, error } = await q.order("day_of_week", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async createTimetableEntry(payload: Omit<EducationTimetable, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("education_timetable")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Transport
  static async getTransport(institutionId?: string): Promise<EducationTransport[]> {
    let q = supabase.from("education_transport").select("*");
    if (institutionId) q = q.eq("institution_id", institutionId);
    const { data, error } = await q.order("route_name", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // Participants
  static async getParticipants(eventId?: string): Promise<EducationParticipant[]> {
    let q = supabase.from("education_participants").select("*");
    if (eventId) q = q.eq("event_id", eventId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createParticipant(payload: Omit<EducationParticipant, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("education_participants")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Payroll
  static async getPayroll(institutionId?: string): Promise<EducationPayroll[]> {
    let q = supabase.from("education_payroll").select("*");
    if (institutionId) q = q.eq("institution_id", institutionId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Emergency
  static async getEmergencies(institutionId?: string): Promise<EducationEmergency[]> {
    let q = supabase.from("education_emergency").select("*");
    if (institutionId) q = q.eq("institution_id", institutionId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // QR Checkin
  static async getQRCheckins(userId?: string): Promise<EducationQRCheckin[]> {
    let q = supabase.from("education_qr_checkins").select("*");
    if (userId) q = q.eq("user_id", userId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Events
  static async getEvents(institutionId?: string): Promise<EducationEvent[]> {
    let q = supabase.from("education_events").select("*");
    if (institutionId) q = q.eq("institution_id", institutionId);
    const { data, error } = await q.order("start_date", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // Feed / Announcements
  static async getAnnouncements(institutionId?: string) {
    let q = supabase.from("education_announcements").select("*");
    if (institutionId) q = q.eq("institution_id", institutionId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Role detection
  static async detectUserRole(userId: string): Promise<"teacher" | "student" | "admin" | "parent" | null> {
    const [{ data: teacher }, { data: student }] = await Promise.all([
      supabase.from("education_teachers").select("id").eq("user_id", userId).maybeSingle(),
      supabase.from("education_students").select("id").eq("user_id", userId).maybeSingle(),
    ]);
    if (teacher) return "teacher";
    if (student) return "student";
    return null;
  }
}

export default EducationService;
