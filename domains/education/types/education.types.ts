
export interface Institution {
  id: string;
  name: string;
  slug: string;
  type: 'ecd' | 'primary' | 'jss' | 'sss' | 'tvet' | 'university' | 'international';
  category: 'public' | 'private' | 'mission' | 'community';
  registration_number?: string;
  ministry_approved: boolean;
  address?: string;
  city?: string;
  county?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  head_teacher_id?: string;
  head_teacher_name?: string;
  levels_offered: string[];
  boarding: boolean;
  day_school: boolean;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  institution_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  id_number?: string;
  kyc_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  tsc_number?: string;
  specialization: string[];
  qualifications: { degree: string; institution: string; year: number }[];
  years_experience: number;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  subjects_taught: string[];
  classes_assigned: string[];
  is_class_teacher: boolean;
  is_active: boolean;
}

export interface Student {
  id: string;
  user_id?: string;
  institution_id: string;
  admission_number: string;
  full_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  is_minor?: boolean;
  parent_guardian_id?: string;
  parent_guardian_phone?: string;
  current_level: string;
  current_class_id?: string;
  stream?: string;
  enrollment_status: 'active' | 'suspended' | 'transferred' | 'graduated' | 'dropped';
}

export interface Class {
  id: string;
  institution_id: string;
  name: string;
  level: string;
  stream?: string;
  class_teacher_id?: string;
  room?: string;
  capacity: number;
  timetable: Record<string, { subject: string; teacher: string; start: string; end: string }[]>;
  academic_year: string;
}

export interface Lesson {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes: number;
  is_online: boolean;
  meeting_link?: string;
  recording_url?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface FeedPost {
  id: string;
  institution_id: string;
  author_id: string;
  author_role: 'teacher' | 'student' | 'admin' | 'alumni';
  title?: string;
  content: string;
  type: 'general' | 'announcement' | 'event' | 'achievement' | 'sports' | 'academic';
  attachments: string[];
  is_junior_safe: boolean;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  institution_id: string;
  sender_id: string;
  sender_role: 'teacher' | 'student' | 'parent' | 'admin';
  receiver_id?: string;
  class_id?: string;
  subject?: string;
  body: string;
  is_broadcast: boolean;
  is_read: boolean;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  teacher_id: string;
  month: string;
  basic_salary: number;
  gross_pay: number;
  net_pay: number;
  status: 'pending' | 'processed' | 'paid';
  paid_via: 'bank_transfer' | 'mpesa' | 'wallet';
}
