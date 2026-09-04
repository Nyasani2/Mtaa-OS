import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

const CONTENT_TYPES = [
  { value: 'announcement', label: 'Announcement', icon: 'megaphone', table: 'education_announcements' },
  { value: 'lesson', label: 'Lesson', icon: 'book', table: 'education_lessons' },
  { value: 'homework', label: 'Homework', icon: 'create', table: 'education_assignments' },
  { value: 'resource', label: 'Resource', icon: 'document-text', table: 'education_resources' },
  { value: 'assignment', label: 'Assignment', icon: 'clipboard', table: 'education_assignments' },
  { value: 'class_update', label: 'Class Update', icon: 'people', table: 'education_announcements' },
];

const AUDIENCES = [
  { value: 'my_class', label: 'My Class' },
  { value: 'multiple_classes', label: 'Multiple Classes' },
  { value: 'my_subject', label: 'My Subject' },
  { value: 'entire_school', label: 'Entire School' },
  { value: 'african_feed', label: 'African Education Feed' },
];

export default function TeacherWorkspaceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState('announcement');
  const [audience, setAudience] = useState('my_class');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [saving, setSaving] = useState(false);
  const [teacherVerified, setTeacherVerified] = useState(false);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTeacherStatus();
    loadClassesAndSubjects();
  }, []);

  const checkTeacherStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('education_teachers')
        .select('id, verification_status, institution_id')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      setTeacherData(data);
      setTeacherVerified(data?.verification_status === 'verified');
    } catch (e) {
      console.error('[TeacherWorkspace] Auth check failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadClassesAndSubjects = async () => {
    try {
      const [clsRes, subRes] = await Promise.all([
        supabase.from('education_classes').select('id, name, grade_level').eq('teacher_id', user?.id),
        supabase.from('education_subjects').select('id, name, code').eq('institution_id', user?.institution_id || teacherData?.institution_id),
      ]);
      setClasses(clsRes.data || []);
      setSubjects(subRes.data || []);
    } catch (e) {
      console.error('[TeacherWorkspace] Load classes failed:', e);
    }
  };

  const handlePublish = async () => {
    if (!teacherVerified) {
      Alert.alert('Not Verified', 'Only verified teachers can publish educational content. Please complete verification first.');
      return;
    }
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    if (!teacherData?.institution_id) { Alert.alert('Error', 'No institution linked to your teacher account'); return; }
    if (audience === 'african_feed' && (type === 'announcement' || type === 'class_update')) {
      Alert.alert('Invalid Audience', 'School announcements cannot be published to the African Education Feed.');
      return;
    }

    setSaving(true);
    try {
      const basePayload: any = {
        institution_id: teacherData.institution_id,
        teacher_id: teacherData.id,
        title: title.trim(),
        description: content.trim() || null,
        created_at: new Date().toISOString(),
      };

      if (audience === 'my_class' && classId) basePayload.class_id = classId;
      if (audience === 'my_subject' && subjectId) basePayload.subject_id = subjectId;
      if (audience === 'african_feed') basePayload.is_public = true;

      const table = CONTENT_TYPES.find((t: any) => t.value === type)?.table || 'education_announcements';

      if (type === 'homework' || type === 'assignment') {
        basePayload.assignment_type = type;
        basePayload.due_date = dueDate ? new Date(dueDate).toISOString() : null;
        basePayload.status = 'active';
        basePayload.max_score = parseInt(maxScore) || 100;
      }
      if (type === 'lesson') {
        basePayload.lesson_date = new Date().toISOString().split('T')[0];
      }
      if (type === 'resource') {
        basePayload.resource_type = 'document';
        basePayload.grade_level = '';
        basePayload.language = 'English';
      }
      if (type === 'announcement' || type === 'class_update') {
        basePayload.audience = audience;
        basePayload.content = content.trim();
      }

      const { error } = await supabase.from(table).insert(basePayload);
      if (error) throw error;

      Alert.alert('Published', 'Your content has been published successfully.');
      setTitle('');
      setContent('');
      setDueDate('');
      setMaxScore('100');
      setSubjectId('');
      setClassId('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!teacherData) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>Teacher account not found</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={checkTeacherStatus}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Teacher Workspace</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Create & publish educational content</Text>
        {!teacherVerified && (
          <View style={styles.verifyBanner}>
            <Ionicons name="warning" size={16} color="#D97706" />
            <Text style={styles.verifyText}>Your teacher account is not yet verified. Publishing is restricted. <Text style={{ fontWeight: '700' }} onPress={() => router.push('/(education)/verification' as any)}>Verify now</Text></Text>
          </View>
        )}
      </View>

      {/* Type Selector */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Content Type *</Text>
        <View style={styles.typeGrid}>
          {CONTENT_TYPES.map((t: any) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeCard, type === t.value && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
              onPress={() => setType(t.value)}
            >
              <Ionicons name={t.icon as any} size={20} color={type === t.value ? colors.primary : colors.textSecondary} />
              <Text style={[styles.typeLabel, { color: type === t.value ? colors.primary : colors.text }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Audience Selector */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Audience *</Text>
        <View style={styles.audienceList}>
          {AUDIENCES.map((a: any) => (
            <TouchableOpacity
              key={a.value}
              style={[styles.audienceItem, audience === a.value && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
              onPress={() => setAudience(a.value)}
            >
              <View style={[styles.radio, audience === a.value && { borderColor: colors.primary, backgroundColor: colors.primary }]} />
              <Text style={[styles.audienceText, { color: audience === a.value ? colors.primary : colors.text }]}>{a.label}</Text>
              {a.value === 'african_feed' && <Ionicons name="globe" size={14} color={colors.textSecondary} />}
            </TouchableOpacity>
          ))}
        </View>
        {audience === 'african_feed' && (
          <Text style={[styles.warning, { color: '#D97706' }]}>⚠️ This will be visible across the entire African Education network. Only educational content allowed.</Text>
        )}
      </View>

      {/* Content Form */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Details</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          placeholder="Title *"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          placeholder="Description / Content *"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          value={content}
          onChangeText={setContent}
        />

        {(type === 'homework' || type === 'assignment') && (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Due Date (YYYY-MM-DD) *"
              placeholderTextColor={colors.textSecondary}
              value={dueDate}
              onChangeText={setDueDate}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Max Score"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={maxScore}
              onChangeText={setMaxScore}
            />
          </>
        )}

        {/* Class Selector */}
        {(audience === 'my_class' || audience === 'multiple_classes') && (
          <View style={styles.selector}>
            <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Select Class *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {classes.map((c: any) => (
                <TouchableOpacity key={c.id} style={[styles.chip, classId === c.id && { backgroundColor: colors.primary }]} onPress={() => setClassId(c.id)}>
                  <Text style={[styles.chipText, { color: classId === c.id ? '#fff' : colors.text }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {classes.length === 0 && <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>No classes assigned to you</Text>}
          </View>
        )}

        {/* Subject Selector */}
        {(audience === 'my_subject' || type === 'lesson' || type === 'homework' || type === 'assignment') && (
          <View style={styles.selector}>
            <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Select Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {subjects.map((s: any) => (
                <TouchableOpacity key={s.id} style={[styles.chip, subjectId === s.id && { backgroundColor: colors.primary }]} onPress={() => setSubjectId(s.id)}>
                  <Text style={[styles.chipText, { color: subjectId === s.id ? '#fff' : colors.text }]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {subjects.length === 0 && <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>No subjects found</Text>}
          </View>
        )}
      </View>

      {/* Publish Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.publishBtn, { backgroundColor: teacherVerified ? colors.primary : '#9CA3AF' }]}
          onPress={handlePublish}
          disabled={saving || !teacherVerified}
        >
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.publishText}>Publish Content</Text>}
        </TouchableOpacity>
        {!teacherVerified && (
          <TouchableOpacity style={[styles.verifyBtn, { borderColor: colors.primary }]} onPress={() => router.push('/(education)/verification' as any)}>
            <Text style={[styles.verifyBtnText, { color: colors.primary }]}>Go to Verification</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 10, backgroundColor: '#FEF3C7', borderRadius: 8 },
  verifyText: { fontSize: 12, color: '#D97706', flex: 1 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '30%', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  typeLabel: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  audienceList: { gap: 8 },
  audienceItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#9CA3AF', marginRight: 10 },
  audienceText: { flex: 1, fontSize: 14, fontWeight: '500' },
  warning: { fontSize: 12, marginTop: 8, fontWeight: '500' },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  selector: { marginTop: 8, marginBottom: 12 },
  selectorLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  chipText: { fontSize: 13, fontWeight: '600' },
  publishBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  publishText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  verifyBtn: { marginTop: 10, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  verifyBtnText: { fontWeight: '700', fontSize: 15 },
});
