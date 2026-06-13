import { supabase } from '@/lib/supabase';

export type EducationAction = 
  | 'generate_qr' | 'scan_qr' | 'student_qr' | 'teacher_qr'
  | 'create_course' | 'enroll_course' | 'issue_certificate' | 'update_progress';

export interface EduGenerateQRParams {
  action: 'generate_qr' | 'student_qr' | 'teacher_qr';
  type: 'attendance' | 'assignment' | 'exam' | 'resource' | 'student_id' | 'teacher_id';
  referenceId: string;
  institutionId: string;
  expiresIn?: number;
  metadata?: Record<string, any>;
}

export interface EduScanQRParams {
  action: 'scan_qr';
  code: string;
  scannedBy: string;
  scannerRole: 'student' | 'teacher' | 'admin';
  location?: { lat: number; lng: number };
}

export interface EduCreateCourseParams {
  action: 'create_course';
  institutionId: string;
  teacherId: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  schedule: Array<{ day: string; startTime: string; endTime: string; room: string }>;
  capacity: number;
  fee?: number;
}

export interface EduEnrollCourseParams {
  action: 'enroll_course';
  courseId: string;
  studentId: string;
  paymentMethod?: 'wallet' | 'mpesa' | 'scholarship';
}

export interface EduIssueCertificateParams {
  action: 'issue_certificate';
  studentId: string;
  courseId: string;
  institutionId: string;
  issuedBy: string;
  type: 'completion' | 'achievement' | 'transcript';
  grade?: string;
  metadata?: Record<string, any>;
}

export interface EduUpdateProgressParams {
  action: 'update_progress';
  studentId: string;
  courseId: string;
  lessonId: string;
  status: 'started' | 'completed' | 'failed';
  score?: number;
  timeSpent?: number;
  notes?: string;
}

export type EducationParams = 
  | EduGenerateQRParams | EduScanQRParams | EduCreateCourseParams 
  | EduEnrollCourseParams | EduIssueCertificateParams | EduUpdateProgressParams;

export async function educationOperation(params: EducationParams) {
  const { data, error } = await supabase.functions.invoke('education-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const generateEducationQR = (p: Omit<EduGenerateQRParams, 'action'>) => 
  educationOperation({ action: 'generate_qr', ...p } as EduGenerateQRParams);

export const scanEducationQR = (p: Omit<EduScanQRParams, 'action'>) => 
  educationOperation({ action: 'scan_qr', ...p } as EduScanQRParams);

export const createCourse = (p: Omit<EduCreateCourseParams, 'action'>) => 
  educationOperation({ action: 'create_course', ...p } as EduCreateCourseParams);

export const enrollCourse = (p: Omit<EduEnrollCourseParams, 'action'>) => 
  educationOperation({ action: 'enroll_course', ...p } as EduEnrollCourseParams);

export const issueCertificate = (p: Omit<EduIssueCertificateParams, 'action'>) => 
  educationOperation({ action: 'issue_certificate', ...p } as EduIssueCertificateParams);

export const updateProgress = (p: Omit<EduUpdateProgressParams, 'action'>) => 
  educationOperation({ action: 'update_progress', ...p } as EduUpdateProgressParams);
