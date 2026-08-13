// @ts-nocheck
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ── Schools ──
import { getSchools, getSchoolById, createSchool, updateSchool } from '@/domains/education/services/education-schools-service';

// ── Teachers ──
import { getTeachers, getTeacherById, getTeacherByUserId,  updateTeacher } from '@/domains/education/services/education-teachers-service';

// ── Students ──
import { getStudents, getStudentById, getStudentByUserId, createStudent } from '@/domains/education/services/education-students-service';

// ── Classes ──
import { getClasses, getClassById, createClass } from '@/domains/education/services/education-classes-service';

// ── Assignments ──
import { getAssignments,  getSubmissions, createAssignment, submitAssignment } from '@/domains/education/services/education-assignments-service';

// ── Attendance ──
import { getAttendance, markAttendance, getAttendanceSummary } from '@/domains/education/services/education-attendance-service';

// ── Grades ──
import { getGrades,  createGrade } from '@/domains/education/services/education-grades-service';

// ── Timetable ──
import { getTimetable, createTimetableEntry } from '@/domains/education/services/education-timetable-service';

// ── Feed ──
import { getFeedPosts, createFeedPost, likeFeedPost } from '@/domains/education/services/education-feed-service';

// ── Announcements ──
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '@/domains/education/services/education-announcements-service';

// ── Fees ──
import { getFees, getFeePayments, createFee } from '@/domains/education/services/education-fees-service';

// ── Messages ──
import { getMessages, sendMessage } from '@/domains/education/services/education-messages-service';

// ── Payroll ──
import { getPayrolls, createPayroll } from '@/domains/education/services/education-payroll-service';

// ── Transport ──
import { getTransportRoutes,  createTransportRoute } from '@/domains/education/services/education-transport-service';

// ── Subjects ──
import { getSubjects, createSubject } from '@/domains/education/services/education-subjects-service';

// ── Staff ──
import { getStaff, createStaff } from '@/domains/education/services/education-staff-service';

// ── Exams ──
import { getExams, createExam } from '@/domains/education/services/education-exams-service';

// ── Events ──
import { getEvents, createEvent } from '@/domains/education/services/education-events-service';

// ── Unified Participants ──
import {
  getParticipants,
  getParticipantCounts,
  getParticipantById,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getStudentsByParent,
  getTeachersByInstitution,
  getHeadTeachers,
} from '@/domains/education/services/education-participants-service';
import type { ParticipantRole } from '@/domains/education/services/education-participants-service';

export { type ParticipantRole };

export function useEducation() {
  // ── Institutions ──
  const getInstitutionById = useCallback((id: string) => getSchoolById(id), []);
  const getInstitutions = useCallback((filters?: any) => getSchools(filters), []);

  // ── Teacher workspace ──
  const getTeacherClasses = useCallback(async (teacherId: string) => getClasses({ class_teacher_id: teacherId as any }), []);
  const getTeacherAssignments = useCallback(async (teacherId: string) => getAssignments({ teacher_id: teacherId }), []);
  const getPendingSubmissions = useCallback(async (teacherId: string) => {
    const assignments = await getAssignments({ teacher_id: teacherId });
    if (!assignments.data?.length) return [];
    const ids = assignments.data?.map((a: any) => a.id);
    const { data, error } = await supabase.from('education_submissions').select('*').in('assignment_id', ids).eq('status', 'submitted').order('created_at', { ascending: false });
    if (error) { console.error('[useEducation] getPendingSubmissions:', error); return []; }
    return data || [];
  }, []);

  // ── Class helpers ──
  const getClassStudents = useCallback(async (classId: string) => getStudents({ class_id: classId as any }), []);
  const getClassLessons = useCallback(async (classId: string) => {
    const { data, error } = await supabase.from('education_lessons').select('*').eq('class_id', classId).order('created_at', { ascending: false });
    if (error) { console.error('[useEducation] getClassLessons:', error); return []; }
    return data || [];
  }, []);

  // ── Student dashboard ──
  const getStudentAttendance = useCallback(async (studentId: string) => {
    const { data, error } = await supabase.from('education_attendance').select('*').eq('student_id', studentId).order('date', { ascending: false });
    if (error) { console.error('[useEducation] getStudentAttendance:', error); return []; }
    return data || [];
  }, []);

  const getStudentTimetable = useCallback(async (studentId: string) => {
    const student = await getStudentById(studentId);
    if (!(student as any)?.class_id) return [];
    return getTimetable({ class_id: (student as any).class_id });
  }, []);

  // ── Aliases ──
  const getAllEvents = useCallback((filters?: any) => getEvents(filters), []);
  const getFeeStructure = useCallback((filters?: any) => getFees(filters), []);

  // ── Unified Participants ──
  const getAllParticipants = useCallback((filters?: any) => getParticipants(filters), []);
  const getAllParticipantCounts = useCallback((institutionId?: string) => getParticipantCounts(institutionId), []);
  const getParticipant = useCallback((id: string, role: ParticipantRole) => getParticipantById(id, role), []);
  const addParticipant = useCallback((role: ParticipantRole, payload: any) => createParticipant(role, payload), []);
  const editParticipant = useCallback((id: string, role: ParticipantRole, payload: any) => updateParticipant(id, role, payload), []);
  const removeParticipant = useCallback((id: string, role: ParticipantRole) => deleteParticipant(id, role), []);
  const getChildrenByParent = useCallback((parentId: string) => getStudentsByParent(parentId), []);
  const getInstitutionTeachers = useCallback((institutionId: string) => getTeachersByInstitution(institutionId), []);
  const getInstitutionHeadTeachers = useCallback((filters?: any) => getHeadTeachers(filters), []);

  return {
    // Institutions
    getSchools, getSchoolById, getInstitutions, getInstitutionById, createSchool, updateSchool,

    // Teachers
    getTeachers, getTeacherById, getTeacherByUserId,  updateTeacher,
    getTeacherClasses, getTeacherAssignments, getPendingSubmissions,

    // Students
    getStudents, getStudentById, getStudentByUserId, createStudent, getClassStudents,

    // Classes
    getClasses, getClassById, createClass, getClassLessons,

    // Assignments
    getAssignments,  getSubmissions, createAssignment, submitAssignment,

    // Attendance
    getAttendance, markAttendance, getAttendanceSummary, getStudentAttendance,

    // Grades
    getGrades,  createGrade,

    // Timetable
    getTimetable, getStudentTimetable, createTimetableEntry,

    // Feed
    getFeedPosts, createFeedPost, likeFeedPost,

    // Announcements
    getAnnouncements, createAnnouncement, deleteAnnouncement,

    // Fees
    getFees, getFeePayments, createFee, getFeeStructure,

    // Messages
    getMessages, sendMessage,

    // Payroll
    getPayrolls, 

    // Transport
    getTransportRoutes,  createTransportRoute,

    // Subjects
    getSubjects, createSubject,

    // Staff
    getStaff, createStaff,

    // Exams
    getExams, createExam,

    // Events
    getEvents, getAllEvents, createEvent,

    // ═══════════════════════════════════════
    // UNIFIED PARTICIPANTS (NEW)
    // ═══════════════════════════════════════
    getAllParticipants,
    getAllParticipantCounts,
    getParticipant,
    addParticipant,
    editParticipant,
    removeParticipant,
    getChildrenByParent,
    getInstitutionTeachers,
    getInstitutionHeadTeachers,
  };
}
