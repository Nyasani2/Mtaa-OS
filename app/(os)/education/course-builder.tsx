// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const CATEGORIES = ['Academic', 'Professional', 'Creative', 'Technical', 'Life Skills'];

export default function CourseBuilderScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic');
  const [level, setLevel] = useState('beginner');
  const [duration, setDuration] = useState('');
  const [maxStudents, setMaxStudents] = useState('30');
  const [modules, setModules] = useState([{ title: '', lessons: [{ title: '', duration: '' }] }]);

  const addModule = () => setModules([...modules, { title: '', lessons: [{ title: '', duration: '' }] }]);
  const addLesson = (modIdx) => {
    const copy = [...modules];
    copy[modIdx].lessons.push({ title: '', duration: '' });
    setModules(copy);
  };
  const updateModule = (idx, val) => { const copy = [...modules]; copy[idx].title = val; setModules(copy); };
  const updateLesson = (modIdx, lesIdx, key, val) => {
    const copy = [...modules]; copy[modIdx].lessons[lesIdx][key] = val; setModules(copy);
  };

  const submit = async () => {
    if (!title.trim()) { Alert.alert('Validation', 'Course title is required'); return; }
    if (modules.some((m) => !m.title.trim())) { Alert.alert('Validation', 'All modules need a title'); return; }

    setLoading(true);
    try {
      const { data: course, error: cErr } = await supabase.from('education_courses').insert({
        title: title.trim(),
        description: description.trim() || null,
        instructor_id: user?.id,
        category,
        level,
        duration_hours: parseInt(duration) || 0,
        max_students: parseInt(maxStudents) || 30,
        status: 'draft',
      }).select().single();
      if (cErr) throw cErr;

      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        if (!mod.title.trim()) continue;
        const { data: module, error: mErr } = await supabase.from('education_course_modules').insert({
          course_id: course.id,
          title: mod.title.trim(),
          order_index: i,
        }).select().single();
        if (mErr) throw mErr;

        for (let j = 0; j < mod.lessons.length; j++) {
          const les = mod.lessons[j];
          if (!les.title.trim()) continue;
          await supabase.from('education_course_lessons').insert({
            module_id: module.id,
            title: les.title.trim(),
            duration_minutes: parseInt(les.duration) || 0,
            order_index: j,
          });
        }
      }

      Alert.alert('Success', 'Course created as draft. You can publish it later.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Course Builder</Text>
      <View style={s.stepper}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[s.step, step >= n && s.stepActive]}>
            <Text style={[s.stepNum, step >= n && s.stepNumActive]}>{n}</Text>
          </View>
        ))}
      </View>

      {step === 1 && (
        <>
          <Text style={s.label}>Course Title *</Text>
          <TextInput style={s.input} placeholder="Introduction to Python Programming" value={title} onChangeText={setTitle} />
          <Text style={s.label}>Description</Text>
          <TextInput style={[s.input, s.textarea]} multiline numberOfLines={4} placeholder="Learn Python from scratch..." value={description} onChangeText={setDescription} />
          <Text style={s.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)}>
                <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={s.label}>Level</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
            {LEVELS.map((l) => (
              <TouchableOpacity key={l} style={[s.chip, level === l && s.chipActive]} onPress={() => setLevel(l)}>
                <Text style={[s.chipText, level === l && s.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={s.label}>Duration (hours)</Text>
          <TextInput style={s.input} placeholder="40" value={duration} onChangeText={setDuration} keyboardType="numeric" />
          <Text style={s.label}>Max Students</Text>
          <TextInput style={s.input} placeholder="30" value={maxStudents} onChangeText={setMaxStudents} keyboardType="numeric" />
          <TouchableOpacity style={s.nextBtn} onPress={() => setStep(2)}>
            <Text style={s.nextText}>Next: Add Modules</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={s.sectionTitle}>Course Modules</Text>
          {modules.map((mod, i) => (
            <View key={i} style={s.moduleCard}>
              <TextInput style={s.input} placeholder={`Module ${i + 1} Title`} value={mod.title} onChangeText={(v) => updateModule(i, v)} />
              <Text style={s.subLabel}>Lessons:</Text>
              {mod.lessons.map((les, j) => (
                <View key={j} style={s.lessonRow}>
                  <TextInput style={[s.input, { flex: 2 }]} placeholder="Lesson title" value={les.title} onChangeText={(v) => updateLesson(i, j, 'title', v)} />
                  <TextInput style={[s.input, { flex: 1 }]} placeholder="Min" value={les.duration} onChangeText={(v) => updateLesson(i, j, 'duration', v)} keyboardType="numeric" />
                </View>
              ))}
              <TouchableOpacity style={s.addBtn} onPress={() => addLesson(i)}>
                <Ionicons name="add-circle-outline" size={18} color="#0ea5e9" />
                <Text style={s.addText}>Add Lesson</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={s.addBtn} onPress={addModule}>
            <Ionicons name="add-circle" size={20} color="#0ea5e9" />
            <Text style={s.addText}>Add Module</Text>
          </TouchableOpacity>
          <View style={s.navRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(1)}>
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.nextBtn} onPress={() => setStep(3)}>
              <Text style={s.nextText}>Review</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={s.sectionTitle}>Review & Publish</Text>
          <View style={s.summaryCard}>
            <Text style={s.summaryTitle}>{title}</Text>
            <Text style={s.summaryText}>{description || 'No description'}</Text>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Category:</Text><Text style={s.summaryValue}>{category}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Level:</Text><Text style={s.summaryValue}>{level}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Duration:</Text><Text style={s.summaryValue}>{duration || '0'} hours</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Max Students:</Text><Text style={s.summaryValue}>{maxStudents}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Modules:</Text><Text style={s.summaryValue}>{modules.filter((m) => m.title.trim()).length}</Text></View>
          </View>
          <View style={s.navRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(2)}>
              <Text style={s.backText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.publishBtn} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={s.publishText}>Create Course</Text></>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  stepper: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  step: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  stepActive: { backgroundColor: '#0ea5e9' },
  stepNum: { color: '#64748b', fontWeight: '700' },
  stepNumActive: { color: '#fff' },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: { marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  chipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  chipText: { fontSize: 13, color: '#475569' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  moduleCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12 },
  subLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 10, marginBottom: 6 },
  lessonRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, marginTop: 4 },
  addText: { color: '#0ea5e9', fontWeight: '600', fontSize: 14 },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  backBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  backText: { color: '#64748b', fontWeight: '600' },
  nextBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#0ea5e9', alignItems: 'center' },
  nextText: { color: '#fff', fontWeight: '700' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  summaryText: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { color: '#64748b', fontSize: 14 },
  summaryValue: { color: '#0f172a', fontWeight: '600', fontSize: 14 },
  publishBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 10, backgroundColor: '#10b981' },
  publishText: { color: '#fff', fontWeight: '700' },
});
