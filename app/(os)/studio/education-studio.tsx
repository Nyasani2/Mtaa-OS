// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

type EduTab = 'courses' | 'create' | 'students' | 'analytics' | 'certificates';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string | null;
  subject: string;
  level: string;
  language: string;
  price: number;
  is_free: boolean;
  module_count: number;
  student_count: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  enrolled_at: string;
  progress: number;
  last_active: string;
}

interface Certificate {
  id: string;
  student_name: string;
  course_title: string;
  issued_at: string;
  certificate_id: string;
}

export default function EducationStudioScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<EduTab>('courses');
  const [isTeacher, setIsTeacher] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Create course form
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseSubject, setCourseSubject] = useState('');
  const [courseLevel, setCourseLevel] = useState('');
  const [courseLanguage, setCourseLanguage] = useState('English');
  const [coursePrice, setCoursePrice] = useState('');
  const [courseFree, setCourseFree] = useState(false);

  const subjects = ['Mathematics', 'Science', 'Technology', 'Engineering', 'Arts', 'Business', 'Languages', 'History', 'Geography', 'Health', 'Agriculture', 'Law', 'Music', 'Programming'];
  const levels = ['Primary', 'Secondary', 'High School', 'Undergraduate', 'Graduate', 'Professional', 'Vocational'];
  const languages = ['English', 'Swahili', 'French', 'Arabic', 'Portuguese', 'Zulu', 'Yoruba', 'Amharic'];

  useEffect(() => {
    checkTeacherStatus();
  }, []);

  const checkTeacherStatus = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, is_teacher, is_professor')
        .eq('id', user.id)
        .single();

      const teacher = profile?.is_teacher || profile?.is_professor || profile?.role === 'teacher' || profile?.role === 'professor';
      setIsTeacher(!!teacher);

      if (teacher) {
        fetchCourses();
        fetchStudents();
        fetchCertificates();
      }
    } catch (e) {
      console.error('Teacher check error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await supabase
        .from('education_courses')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });
      setCourses(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await supabase
        .from('education_enrollments')
        .select('*, user_profiles(full_name, email)')
        .eq('course_id', courses[0]?.id)
        .order('enrolled_at', { ascending: false });
      setStudents((data || []).map((e: any) => ({
        id: e.id,
        full_name: e.user_profiles?.full_name || 'Student',
        email: e.user_profiles?.email || '',
        enrolled_at: e.enrolled_at,
        progress: e.progress || 0,
        last_active: e.last_active,
      })));
    } catch (e) { console.error(e); }
  };

  const fetchCertificates = async () => {
    try {
      const { data } = await supabase
        .from('education_certificates')
        .select('*')
        .eq('issuer_id', user?.id)
        .order('issued_at', { ascending: false });
      setCertificates(data || []);
    } catch (e) { console.error(e); }
  };

  const createCourse = async () => {
    if (!courseTitle.trim() || !user?.id || !isTeacher) {
      Alert.alert('Error', 'Only registered teachers can create courses.');
      return;
    }
    try {
      await supabase.from('education_courses').insert({
        creator_id: user.id,
        title: courseTitle,
        description: courseDesc,
        subject: courseSubject,
        level: courseLevel,
        language: courseLanguage,
        price: courseFree ? 0 : parseFloat(coursePrice) || 0,
        is_free: courseFree,
        status: 'draft',
      });
      setCourseTitle(''); setCourseDesc(''); setCourseSubject(''); setCourseLevel(''); setCoursePrice(''); setCourseFree(false);
      setActiveTab('courses');
      fetchCourses();
    } catch (e) { console.error(e); }
  };

  const deleteCourse = async (courseId: string) => {
    Alert.alert('Delete Course', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await supabase.from('education_courses').delete().eq('id', courseId);
          fetchCourses();
        } catch (e) { console.error(e); }
      }},
    ]);
  };

  // Gate: Non-teachers see registration prompt
  if (!isTeacher && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gateContainer}>
          <Feather name="lock" size={64} color="#6366f1" />
          <Text style={styles.gateTitle}>Teacher Access Only</Text>
          <Text style={styles.gateDesc}>
            The Education Platform is exclusively for registered teachers, professors, and educational institutions on MTAA.
          </Text>
          <Text style={styles.gateSub}>
            To publish courses, lessons, and educational content, you must complete teacher verification through the MTAA Education portal.
          </Text>
          <TouchableOpacity style={styles.gateBtn} onPress={() => router.push('/(os)/education/teacher-register' as any)}>
            <Text style={styles.gateBtnText}>Apply as Teacher</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gateBack} onPress={() => router.back()}>
            <Text style={styles.gateBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderCourses = () => (
    <FlatList
      data={courses}
      keyExtractor={c => c.id}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Feather name="book-open" size={48} color="#333" />
          <Text style={styles.emptyText}>No courses yet</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab('create')}>
            <Text style={styles.emptyBtnText}>Create Your First Course</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.courseCard} onPress={() => router.push(`/(os)/education/course-builder?id=${item.id}` as any)}>
          <View style={styles.courseThumb}>
            {item.thumbnail_url ? (
              <Text style={styles.courseThumbText}>IMG</Text>
            ) : (
              <Feather name="book-open" size={28} color="#6366f1" />
            )}
          </View>
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.courseMeta}>{item.subject} • {item.level} • {item.language}</Text>
            <View style={styles.courseStats}>
              <Text style={styles.courseStat}>{item.module_count} modules</Text>
              <Text style={styles.courseStat}>{item.student_count} students</Text>
              <View style={[styles.statusBadge, item.status === 'published' && styles.statusPublished]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.coursePrice}>{item.is_free ? 'FREE' : `$${item.price}`}</Text>
          </View>
          <TouchableOpacity style={styles.courseMenu} onPress={() => deleteCourse(item.id)}>
            <Feather name="trash-2" size={16} color="#ef4444" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    />
  );

  const renderCreate = () => (
    <ScrollView style={styles.createContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.createTitle}>Create New Course</Text>

      <Text style={styles.formLabel}>Course Title *</Text>
      <TextInput style={styles.formInput} value={courseTitle} onChangeText={setCourseTitle} placeholder="e.g., Introduction to African History" placeholderTextColor="#666" />

      <Text style={styles.formLabel}>Description</Text>
      <TextInput style={[styles.formInput, styles.textarea]} value={courseDesc} onChangeText={setCourseDesc} placeholder="What will students learn?" placeholderTextColor="#666" multiline numberOfLines={4} textAlignVertical="top" />

      <Text style={styles.formLabel}>Subject</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {subjects.map((s: any) => (
          <TouchableOpacity key={s} onPress={() => setCourseSubject(s)} style={[styles.chip, courseSubject === s && styles.chipActive]}>
            <Text style={[styles.chipText, courseSubject === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.formLabel}>Level</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {levels.map((l: any) => (
          <TouchableOpacity key={l} onPress={() => setCourseLevel(l)} style={[styles.chip, courseLevel === l && styles.chipActive]}>
            <Text style={[styles.chipText, courseLevel === l && styles.chipTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.formLabel}>Language</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {languages.map((l: any) => (
          <TouchableOpacity key={l} onPress={() => setCourseLanguage(l)} style={[styles.chip, courseLanguage === l && styles.chipActive]}>
            <Text style={[styles.chipText, courseLanguage === l && styles.chipTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.priceRow}>
        <View style={styles.priceLeft}>
          <Text style={styles.formLabel}>Price ($)</Text>
          <TextInput style={[styles.formInput, styles.priceInput]} value={coursePrice} onChangeText={setCoursePrice} placeholder="0.00" placeholderTextColor="#666" keyboardType="decimal-pad" editable={!courseFree} />
        </View>
        <View style={styles.priceRight}>
          <Text style={styles.formLabel}>Free Course</Text>
          <Switch value={courseFree} onValueChange={setCourseFree} trackColor={{ false: '#333', true: '#6366f1' }} thumbColor={courseFree ? '#fff' : '#666'} />
        </View>
      </View>

      <TouchableOpacity style={styles.createBtn} onPress={createCourse}>
        <Text style={styles.createBtnText}>Create Course</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStudents = () => (
    <FlatList
      data={students}
      keyExtractor={s => s.id}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Feather name="users" size={48} color="#333" />
          <Text style={styles.emptyText}>No students enrolled yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.studentCard}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.full_name}</Text>
            <Text style={styles.studentEmail}>{item.email}</Text>
            <Text style={styles.studentMeta}>Enrolled {new Date(item.enrolled_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.studentProgress}>
            <Text style={styles.studentProgressText}>{item.progress}%</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
            </View>
          </View>
        </View>
      )}
    />
  );

  const renderAnalytics = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.analyticsContainer}>
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Feather name="users" size={20} color="#6366f1" />
          <Text style={styles.analyticsValue}>{students.length}</Text>
          <Text style={styles.analyticsLabel}>Total Students</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Feather name="book-open" size={20} color="#10b981" />
          <Text style={styles.analyticsValue}>{courses.length}</Text>
          <Text style={styles.analyticsLabel}>Active Courses</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Feather name="award" size={20} color="#f59e0b" />
          <Text style={styles.analyticsValue}>{certificates.length}</Text>
          <Text style={styles.analyticsLabel}>Certificates Issued</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Feather name="dollar-sign" size={20} color="#ec4899" />
          <Text style={styles.analyticsValue}>${courses.filter((c: any) => !c.is_free).reduce((sum, c) => sum + (c.price * c.student_count), 0).toFixed(0)}</Text>
          <Text style={styles.analyticsLabel}>Revenue</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Course Performance</Text>
      {courses.map((course: any) => (
        <View key={course.id} style={styles.performanceCard}>
          <Text style={styles.performanceTitle}>{course.title}</Text>
          <View style={styles.performanceStats}>
            <View style={styles.perfStat}>
              <Text style={styles.perfStatValue}>{course.student_count}</Text>
              <Text style={styles.perfStatLabel}>Students</Text>
            </View>
            <View style={styles.perfStat}>
              <Text style={styles.perfStatValue}>{course.module_count}</Text>
              <Text style={styles.perfStatLabel}>Modules</Text>
            </View>
            <View style={styles.perfStat}>
              <Text style={styles.perfStatValue}>{course.is_free ? 'Free' : `$${course.price}`}</Text>
              <Text style={styles.perfStatLabel}>Price</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderCertificates = () => (
    <FlatList
      data={certificates}
      keyExtractor={c => c.id}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Feather name="award" size={48} color="#333" />
          <Text style={styles.emptyText}>No certificates issued yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.certCard}>
          <View style={styles.certIcon}>
            <Feather name="award" size={28} color="#f59e0b" />
          </View>
          <View style={styles.certInfo}>
            <Text style={styles.certStudent}>{item.student_name}</Text>
            <Text style={styles.certCourse}>{item.course_title}</Text>
            <Text style={styles.certId}>ID: {item.certificate_id}</Text>
            <Text style={styles.certDate}>Issued {new Date(item.issued_at).toLocaleDateString()}</Text>
          </View>
        </View>
      )}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Checking teacher credentials...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Education Studio</Text>
        <View style={styles.teacherBadge}>
          <Feather name="shield" size={14} color="#6366f1" />
          <Text style={styles.teacherBadgeText}>TEACHER</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {[
          { id: 'courses' as EduTab, label: 'My Courses', icon: 'book-open' },
          { id: 'create' as EduTab, label: 'Create', icon: 'plus-circle' },
          { id: 'students' as EduTab, label: 'Students', icon: 'users' },
          { id: 'analytics' as EduTab, label: 'Analytics', icon: 'bar-chart-2' },
          { id: 'certificates' as EduTab, label: 'Certificates', icon: 'award' },
        ].map((t: any) => (
          <TouchableOpacity key={t.id} onPress={() => setActiveTab(t.id)} style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}>
            <Feather name={t.icon as any} size={14} color={activeTab === t.id ? '#6366f1' : '#666'} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'create' && renderCreate()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'certificates' && renderCertificates()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingText: { color: '#fff', textAlign: 'center', marginTop: 40, fontSize: 16 },

  // Teacher Gate
  gateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  gateTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 20 },
  gateDesc: { color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  gateSub: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  gateBtn: { backgroundColor: '#6366f1', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, marginTop: 28 },
  gateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  gateBack: { marginTop: 16 },
  gateBackText: { color: '#666', fontSize: 14, fontWeight: '500' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  teacherBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  teacherBadgeText: { color: '#6366f1', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  tabScroll: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  tabBtnActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: '#6366f1' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#6366f1', fontWeight: '700' },

  content: { flex: 1 },

  // Courses
  courseCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#141414', borderRadius: 12, marginBottom: 10, marginHorizontal: 16 },
  courseThumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#1f1f1f', alignItems: 'center', justifyContent: 'center' },
  courseThumbText: { color: '#6366f1', fontSize: 10, fontWeight: '700' },
  courseInfo: { flex: 1 },
  courseTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  courseMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  courseStats: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  courseStat: { color: '#666', fontSize: 11 },
  coursePrice: { color: '#10b981', fontSize: 12, fontWeight: '700', marginTop: 2 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#1f1f1f' },
  statusPublished: { backgroundColor: 'rgba(16,185,129,0.2)' },
  statusText: { color: '#9ca3af', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  courseMenu: { padding: 4 },

  // Create
  createContainer: { flex: 1, padding: 16 },
  createTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 16 },
  formLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase' },
  formInput: { backgroundColor: '#1f1f1f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  chipScroll: { marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  chipActive: { backgroundColor: '#6366f1' },
  chipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  chipTextActive: { fontWeight: '700' },
  priceRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  priceLeft: { flex: 1 },
  priceRight: { alignItems: 'center' },
  priceInput: { marginTop: 4 },
  createBtn: { backgroundColor: '#6366f1', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Students
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#141414', borderRadius: 12, marginBottom: 8, marginHorizontal: 16 },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  studentInfo: { flex: 1 },
  studentName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  studentEmail: { color: '#9ca3af', fontSize: 12, marginTop: 1 },
  studentMeta: { color: '#666', fontSize: 11, marginTop: 2 },
  studentProgress: { alignItems: 'flex-end', width: 60 },
  studentProgressText: { color: '#6366f1', fontSize: 13, fontWeight: '700' },
  progressBarBg: { width: 50, height: 4, backgroundColor: '#1f1f1f', borderRadius: 2, marginTop: 4 },
  progressBar: { height: 4, backgroundColor: '#6366f1', borderRadius: 2 },

  // Analytics
  analyticsContainer: { padding: 16 },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  analyticsCard: { width: '47%', backgroundColor: '#141414', borderRadius: 12, padding: 14, alignItems: 'center' },
  analyticsValue: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  analyticsLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '600', marginTop: 2 },
  performanceCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginTop: 10 },
  performanceTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  performanceStats: { flexDirection: 'row', gap: 20, marginTop: 10 },
  perfStat: { alignItems: 'center' },
  perfStatValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
  perfStatLabel: { color: '#666', fontSize: 11, marginTop: 2 },

  // Certificates
  certCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#141414', borderRadius: 12, marginBottom: 8, marginHorizontal: 16 },
  certIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center' },
  certInfo: { flex: 1 },
  certStudent: { color: '#fff', fontSize: 14, fontWeight: '600' },
  certCourse: { color: '#9ca3af', fontSize: 12, marginTop: 1 },
  certId: { color: '#6366f1', fontSize: 11, fontWeight: '600', marginTop: 2 },
  certDate: { color: '#666', fontSize: 11, marginTop: 1 },

  // Empty
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptyBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
