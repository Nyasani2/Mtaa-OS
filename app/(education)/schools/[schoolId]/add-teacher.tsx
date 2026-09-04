// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, useEducation } from '@/domains/education/hooks/useEducation';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function AddTeacher() {
  const router = useRouter();
  const { schoolId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { getInstitutionById, getInstitutionClasses, createTeacher } = useEducation();
  const [school, setSchool] = useState(null);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_id: '',
    qualification: '',
    specialization: '',
    years_experience: '',
    salary: '',
    subjects: [],
    class_teacher_of: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchool();
  }, [schoolId]);

  const loadSchool = async () => {
    if (!schoolId) return;
    const s = await getInstitutionById(schoolId);
    setSchool(s);
    const c = await getInstitutionClasses(schoolId);
    setClasses(c || []);
  };

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleSubject = (subject) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s: any) => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.phone) {
      Alert.alert('Required', 'Please fill name, email, and phone');
      return;
    }
    setLoading(true);
    try {
      await createTeacher({
        ...form,
        institution_id: schoolId,
        created_by: user?.id,
        status: 'active',
        years_experience: parseInt(form.years_experience) || 0,
        salary: parseFloat(form.salary) || 0,
      });
      Alert.alert(
        'Teacher Added!',
        `${form.full_name} has been added to ${school?.name}.`,
        [
          { text: 'Add Another', onPress: () => setForm({ full_name: '', email: '', phone: '', employee_id: '', qualification: '', specialization: '', years_experience: '', salary: '', subjects: [], class_teacher_of: '' }) },
          { text: 'Done', onPress: () => router.back() },
        ]
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const commonSubjects = ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Studies', 'Agriculture', 'Business Studies', 'Music', 'Art', 'PE'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Add Teacher</Text>
          <Text style={styles.headerSub}>{school?.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Input label="Full Name *" value={form.full_name} onChange={v => update('full_name', v)} placeholder="e.g. John Doe" />
        <Input label="Email *" value={form.email} onChange={v => update('email', v)} placeholder="teacher@school.edu" keyboardType="email-address" />
        <Input label="Phone *" value={form.phone} onChange={v => update('phone', v)} placeholder="+254 700 000 000" keyboardType="phone-pad" />
        <Input label="Employee ID" value={form.employee_id} onChange={v => update('employee_id', v)} placeholder="TCH/2024/001" />
        <Input label="Qualification" value={form.qualification} onChange={v => update('qualification', v)} placeholder="e.g. B.Ed, M.Ed" />
        <Input label="Specialization" value={form.specialization} onChange={v => update('specialization', v)} placeholder="e.g. Mathematics Education" />
        <Input label="Years Experience" value={form.years_experience} onChange={v => update('years_experience', v)} placeholder="5" keyboardType="numeric" />
        <Input label="Monthly Salary (KSh)" value={form.salary} onChange={v => update('salary', v)} placeholder="50000" keyboardType="numeric" />

        {/* Class Teacher Assignment */}
        <Text style={styles.sectionLabel}>Class Teacher Of</Text>
        <View style={styles.pickerRow}>
          <TouchableOpacity style={[styles.pickerOption, !form.class_teacher_of && styles.pickerOptionActive]} onPress={() => update('class_teacher_of', '')}>
            <Text style={[!form.class_teacher_of && styles.pickerOptionTextActive]}>None</Text>
          </TouchableOpacity>
          {classes.map((c: any) => (
            <TouchableOpacity key={c.id} style={[styles.pickerOption, form.class_teacher_of === c.id && styles.pickerOptionActive]} onPress={() => update('class_teacher_of', c.id)}>
              <Text style={[form.class_teacher_of === c.id && styles.pickerOptionTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subjects */}
        <Text style={styles.sectionLabel}>Subjects Taught</Text>
        <View style={styles.subjectsGrid}>
          {commonSubjects.map((sub: any) => (
            <TouchableOpacity
              key={sub}
              style={[styles.subjectChip, form.subjects.includes(sub) && styles.subjectChipActive]}
              onPress={() => toggleSubject(sub)}
            >
              <Text style={[styles.subjectChipText, form.subjects.includes(sub) && styles.subjectChipTextActive]}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitBtnText}>{loading ? 'Adding...' : 'Add Teacher'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Input({ label, value, onChange, placeholder, keyboardType }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  form: { flex: 1, padding: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 10 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  pickerOptionActive: { backgroundColor: '#ede9fe', borderColor: '#6366f1' },
  pickerOptionTextActive: { color: '#6366f1', fontWeight: '600' },
  subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  subjectChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  subjectChipActive: { backgroundColor: '#ede9fe', borderColor: '#6366f1' },
  subjectChipText: { fontSize: 12, color: '#6b7280' },
  subjectChipTextActive: { color: '#6366f1', fontWeight: '600' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  submitBtn: { backgroundColor: '#6366f1', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#c7d2fe' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

