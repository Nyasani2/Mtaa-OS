import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import {
  getInstitutions,
  getInstitutionById,
  getInstitutionClasses,
  getTeachers,
  getTeacherByUserId,
  getTeacherClasses,
  getTeacherAssignments,
  getPendingSubmissions,
  getStudents,
  getStudentByUserId,
  getStudentAssignments,
  getStudentGrades,
  getStudentAttendance,
  getStudentTimetable,
  getStudentFees,
  getClasses,
  getClassStudents,
  getClassLessons,
  getClassAssignments,
  getSubjects,
  getLessons,
  getAssignments,
  getSubmissions,
  getGrades,
  getAttendance,
  getMessages,
  getFeeds,
  getEvents,
  getAlumni,
  getPayroll,
  getContentLibrary,
  getLiveStreams,
  getTransportRoutes,
  getTeacherServices,
  getQRSessions,
  getWalkingSquads,
  getParentConnections,
  createInstitution,
  createTeacher,
  createStudent,
  createClass,
  createSubject,
  createLesson,
  createAssignment,
  createSubmission,
  createGrade,
  markAttendance,
  createMessage,
  createFeedPost,
  createEvent,
  createContentItem,
  createLiveStream,
  createTransportRoute,
  createTeacherService,
  createQRSession,
  createWalkingSquad,
  connectParent,
  updateInstitution,
  updateTeacher,
  updateStudent,
  updateClass,
  updateAssignment,
  updateSubmission,
  updateGrade,
  updateAttendance,
  updateMessage,
  updateFeedPost,
  updateEvent,
  updateContentItem,
  updateLiveStream,
  updateTransportRoute,
  updateTeacherService,
  updateQRSession,
  updateWalkingSquad,
  updateParentConnection,
  deleteInstitution,
  deleteTeacher,
  deleteStudent,
  deleteClass,
  deleteSubject,
  deleteLesson,
  deleteAssignment,
  deleteSubmission,
  deleteGrade,
  deleteAttendance,
  deleteMessage,
  deleteFeedPost,
  deleteEvent,
  deleteContentItem,
  deleteLiveStream,
  deleteTransportRoute,
  deleteTeacherService,
  deleteQRSession,
  deleteWalkingSquad,
  deleteParentConnection,
} from '@/lib/services/education-service';

export function useEducation() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCall = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Institutions ---
  const getAllInstitutions = useCallback(() => handleCall(() => getInstitutions()), [handleCall]);
  const getInstitution = useCallback((id: string) => handleCall(() => getInstitutionById(id)), [handleCall]);
  const getSchoolClasses = useCallback((institutionId: string) => handleCall(() => getInstitutionClasses(institutionId)), [handleCall]);
  const createSchool = useCallback((data: any) => handleCall(() => createInstitution(data)), [handleCall]);
  const updateSchool = useCallback((id: string, data: any) => handleCall(() => updateInstitution(id, data)), [handleCall]);
  const removeSchool = useCallback((id: string) => handleCall(() => deleteInstitution(id)), [handleCall]);

  // --- Teachers ---
  const getAllTeachers = useCallback(() => handleCall(() => getTeachers()), [handleCall]);
  const getTeacher = useCallback((userId: string) => handleCall(() => getTeacherByUserId(userId)), [handleCall]);
  const getTeacherClassList = useCallback((teacherId: string) => handleCall(() => getTeacherClasses(teacherId)), [handleCall]);
  const getTeacherAssignmentList = useCallback((teacherId: string) => handleCall(() => getTeacherAssignments(teacherId)), [handleCall]);
  const getTeacherPendingSubmissions = useCallback((teacherId: string) => handleCall(() => getPendingSubmissions(teacherId)), [handleCall]);
  const addTeacher = useCallback((data: any) => handleCall(() => createTeacher(data)), [handleCall]);
  const modifyTeacher = useCallback((id: string, data: any) => handleCall(() => updateTeacher(id, data)), [handleCall]);
  const removeTeacher = useCallback((id: string) => handleCall(() => deleteTeacher(id)), [handleCall]);

  // --- Students ---
  const getAllStudents = useCallback(() => handleCall(() => getStudents()), [handleCall]);
  const getStudent = useCallback((userId: string) => handleCall(() => getStudentByUserId(userId)), [handleCall]);
  const getStudentAssignmentList = useCallback((studentId: string) => handleCall(() => getStudentAssignments(studentId)), [handleCall]);
  const getStudentGradeList = useCallback((studentId: string) => handleCall(() => getStudentGrades(studentId)), [handleCall]);
  const getStudentAttendanceList = useCallback((studentId: string) => handleCall(() => getStudentAttendance(studentId)), [handleCall]);
  const getStudentTimetableList = useCallback((classId: string) => handleCall(() => getStudentTimetable(classId)), [handleCall]);
  const getStudentFeeList = useCallback((studentId: string) => handleCall(() => getStudentFees(studentId)), [handleCall]);
  const addStudent = useCallback((data: any) => handleCall(() => createStudent(data)), [handleCall]);
  const modifyStudent = useCallback((id: string, data: any) => handleCall(() => updateStudent(id, data)), [handleCall]);
  const removeStudent = useCallback((id: string) => handleCall(() => deleteStudent(id)), [handleCall]);

  // --- Classes ---
  const getAllClasses = useCallback(() => handleCall(() => getClasses()), [handleCall]);
  const getClassStudentList = useCallback((classId: string) => handleCall(() => getClassStudents(classId)), [handleCall]);
  const getClassLessonList = useCallback((classId: string) => handleCall(() => getClassLessons(classId)), [handleCall]);
  const getClassAssignmentList = useCallback((classId: string) => handleCall(() => getClassAssignments(classId)), [handleCall]);
  const addClass = useCallback((data: any) => handleCall(() => createClass(data)), [handleCall]);
  const modifyClass = useCallback((id: string, data: any) => handleCall(() => updateClass(id, data)), [handleCall]);
  const removeClass = useCallback((id: string) => handleCall(() => deleteClass(id)), [handleCall]);

  // --- Subjects ---
  const getAllSubjects = useCallback(() => handleCall(() => getSubjects()), [handleCall]);
  const addSubject = useCallback((data: any) => handleCall(() => createSubject(data)), [handleCall]);
  const removeSubject = useCallback((id: string) => handleCall(() => deleteSubject(id)), [handleCall]);

  // --- Lessons ---
  const getAllLessons = useCallback(() => handleCall(() => getLessons()), [handleCall]);
  const addLesson = useCallback((data: any) => handleCall(() => createLesson(data)), [handleCall]);
  const modifyLesson = useCallback((id: string, data: any) => handleCall(() => updateLesson(id, data)), [handleCall]);
  const removeLesson = useCallback((id: string) => handleCall(() => deleteLesson(id)), [handleCall]);

  // --- Assignments ---
  const getAllAssignments = useCallback(() => handleCall(() => getAssignments()), [handleCall]);
  const addAssignment = useCallback((data: any) => handleCall(() => createAssignment(data)), [handleCall]);
  const modifyAssignment = useCallback((id: string, data: any) => handleCall(() => updateAssignment(id, data)), [handleCall]);
  const removeAssignment = useCallback((id: string) => handleCall(() => deleteAssignment(id)), [handleCall]);
  const submitAssignmentWork = useCallback((data: any) => handleCall(() => createSubmission(data)), [handleCall]);
  const gradeSubmission = useCallback((id: string, data: any) => handleCall(() => updateSubmission(id, data)), [handleCall]);

  // --- Grades ---
  const getAllGrades = useCallback(() => handleCall(() => getGrades()), [handleCall]);
  const addGrade = useCallback((data: any) => handleCall(() => createGrade(data)), [handleCall]);
  const modifyGrade = useCallback((id: string, data: any) => handleCall(() => updateGrade(id, data)), [handleCall]);
  const removeGrade = useCallback((id: string) => handleCall(() => deleteGrade(id)), [handleCall]);

  // --- Attendance ---
  const getAllAttendance = useCallback(() => handleCall(() => getAttendance()), [handleCall]);
  const recordAttendance = useCallback((records: any[]) => handleCall(() => markAttendance(records)), [handleCall]);
  const modifyAttendance = useCallback((id: string, data: any) => handleCall(() => updateAttendance(id, data)), [handleCall]);
  const removeAttendance = useCallback((id: string) => handleCall(() => deleteAttendance(id)), [handleCall]);

  // --- Messages ---
  const getAllMessages = useCallback(() => handleCall(() => getMessages()), [handleCall]);
  const sendMessage = useCallback((data: any) => handleCall(() => createMessage(data)), [handleCall]);
  const modifyMessage = useCallback((id: string, data: any) => handleCall(() => updateMessage(id, data)), [handleCall]);
  const removeMessage = useCallback((id: string) => handleCall(() => deleteMessage(id)), [handleCall]);

  // --- Feeds ---
  const getAllFeeds = useCallback(() => handleCall(() => getFeeds()), [handleCall]);
  const postToFeed = useCallback((data: any) => handleCall(() => createFeedPost(data)), [handleCall]);
  const modifyFeedPost = useCallback((id: string, data: any) => handleCall(() => updateFeedPost(id, data)), [handleCall]);
  const removeFeedPost = useCallback((id: string) => handleCall(() => deleteFeedPost(id)), [handleCall]);

  // --- Events ---
  const getAllEvents = useCallback(() => handleCall(() => getEvents()), [handleCall]);
  const addEvent = useCallback((data: any) => handleCall(() => createEvent(data)), [handleCall]);
  const modifyEvent = useCallback((id: string, data: any) => handleCall(() => updateEvent(id, data)), [handleCall]);
  const removeEvent = useCallback((id: string) => handleCall(() => deleteEvent(id)), [handleCall]);

  // --- Content Library ---
  const getAllContent = useCallback(() => handleCall(() => getContentLibrary()), [handleCall]);
  const addContent = useCallback((data: any) => handleCall(() => createContentItem(data)), [handleCall]);
  const modifyContent = useCallback((id: string, data: any) => handleCall(() => updateContentItem(id, data)), [handleCall]);
  const removeContent = useCallback((id: string) => handleCall(() => deleteContentItem(id)), [handleCall]);

  // --- Live Streams ---
  const getAllLiveStreams = useCallback(() => handleCall(() => getLiveStreams()), [handleCall]);
  const addLiveStream = useCallback((data: any) => handleCall(() => createLiveStream(data)), [handleCall]);
  const modifyLiveStream = useCallback((id: string, data: any) => handleCall(() => updateLiveStream(id, data)), [handleCall]);
  const removeLiveStream = useCallback((id: string) => handleCall(() => deleteLiveStream(id)), [handleCall]);

  // --- Transport ---
  const getAllTransportRoutes = useCallback(() => handleCall(() => getTransportRoutes()), [handleCall]);
  const addTransportRoute = useCallback((data: any) => handleCall(() => createTransportRoute(data)), [handleCall]);
  const modifyTransportRoute = useCallback((id: string, data: any) => handleCall(() => updateTransportRoute(id, data)), [handleCall]);
  const removeTransportRoute = useCallback((id: string) => handleCall(() => deleteTransportRoute(id)), [handleCall]);

  // --- Teacher Services ---
  const getAllTeacherServices = useCallback(() => handleCall(() => getTeacherServices()), [handleCall]);
  const addTeacherService = useCallback((data: any) => handleCall(() => createTeacherService(data)), [handleCall]);
  const modifyTeacherService = useCallback((id: string, data: any) => handleCall(() => updateTeacherService(id, data)), [handleCall]);
  const removeTeacherService = useCallback((id: string) => handleCall(() => deleteTeacherService(id)), [handleCall]);

  // --- QR Sessions ---
  const getAllQRSessions = useCallback(() => handleCall(() => getQRSessions()), [handleCall]);
  const addQRSession = useCallback((data: any) => handleCall(() => createQRSession(data)), [handleCall]);
  const modifyQRSession = useCallback((id: string, data: any) => handleCall(() => updateQRSession(id, data)), [handleCall]);
  const removeQRSession = useCallback((id: string) => handleCall(() => deleteQRSession(id)), [handleCall]);

  // --- Walking Squads ---
  const getAllWalkingSquads = useCallback(() => handleCall(() => getWalkingSquads()), [handleCall]);
  const addWalkingSquad = useCallback((data: any) => handleCall(() => createWalkingSquad(data)), [handleCall]);
  const modifyWalkingSquad = useCallback((id: string, data: any) => handleCall(() => updateWalkingSquad(id, data)), [handleCall]);
  const removeWalkingSquad = useCallback((id: string) => handleCall(() => deleteWalkingSquad(id)), [handleCall]);

  // --- Parent Connections ---
  const getParentConnectionList = useCallback((parentUserId: string) => handleCall(() => getParentConnections(parentUserId)), [handleCall]);
  const addParentConnection = useCallback((data: any) => handleCall(() => connectParent(data)), [handleCall]);
  const modifyParentConnection = useCallback((id: string, data: any) => handleCall(() => updateParentConnection(id, data)), [handleCall]);
  const removeParentConnection = useCallback((id: string) => handleCall(() => deleteParentConnection(id)), [handleCall]);

  return {
    loading,
    error,
    user,
    // Institutions
    getAllInstitutions,
    getInstitution,
    getSchoolClasses,
    createSchool,
    updateSchool,
    removeSchool,
    // Teachers
    getAllTeachers,
    getTeacher,
    getTeacherClassList,
    getTeacherAssignmentList,
    getTeacherPendingSubmissions,
    addTeacher,
    modifyTeacher,
    removeTeacher,
    // Students
    getAllStudents,
    getStudent,
    getStudentAssignmentList,
    getStudentGradeList,
    getStudentAttendanceList,
    getStudentTimetableList,
    getStudentFeeList,
    addStudent,
    modifyStudent,
    removeStudent,
    // Classes
    getAllClasses,
    getClassStudentList,
    getClassLessonList,
    getClassAssignmentList,
    addClass,
    modifyClass,
    removeClass,
    // Subjects
    getAllSubjects,
    addSubject,
    removeSubject,
    // Lessons
    getAllLessons,
    addLesson,
    modifyLesson,
    removeLesson,
    // Assignments
    getAllAssignments,
    addAssignment,
    modifyAssignment,
    removeAssignment,
    submitAssignmentWork,
    gradeSubmission,
    // Grades
    getAllGrades,
    addGrade,
    modifyGrade,
    removeGrade,
    // Attendance
    getAllAttendance,
    recordAttendance,
    modifyAttendance,
    removeAttendance,
    // Messages
    getAllMessages,
    sendMessage,
    modifyMessage,
    removeMessage,
    // Feeds
    getAllFeeds,
    postToFeed,
    modifyFeedPost,
    removeFeedPost,
    // Events
    getAllEvents,
    addEvent,
    modifyEvent,
    removeEvent,
    // Content
    getAllContent,
    addContent,
    modifyContent,
    removeContent,
    // Live Streams
    getAllLiveStreams,
    addLiveStream,
    modifyLiveStream,
    removeLiveStream,
    // Transport
    getAllTransportRoutes,
    addTransportRoute,
    modifyTransportRoute,
    removeTransportRoute,
    // Teacher Services
    getAllTeacherServices,
    addTeacherService,
    modifyTeacherService,
    removeTeacherService,
    // QR
    getAllQRSessions,
    addQRSession,
    modifyQRSession,
    removeQRSession,
    // Walking Squads
    getAllWalkingSquads,
    addWalkingSquad,
    modifyWalkingSquad,
    removeWalkingSquad,
    // Parent Connections
    getParentConnectionList,
    addParentConnection,
    modifyParentConnection,
    removeParentConnection,
  };
}
