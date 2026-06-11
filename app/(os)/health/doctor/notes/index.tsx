import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/kernel/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, Save, Lock, Unlock, FileText, Clock, User,
  Stethoscope, ClipboardList, Search, Plus
} from 'lucide-react-native';

interface ClinicalNote {
  id: string;
  patient_id: string;
  encounter_id: string | null;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  diagnosis_codes: string[];
  author_id: string;
  author_name: string;
  signed_at: string | null;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

const TEMPLATES = [
  { name: 'General Consult', subjective: 'Patient presents with...', objective: 'Vitals stable. Physical exam...', assessment: 'Assessment pending...', plan: 'Plan pending...' },
  { name: 'Follow-up', subjective: 'Follow-up for...', objective: 'Condition stable/improving...', assessment: 'Ongoing management...', plan: 'Continue current treatment...' },
  { name: 'Acute Visit', subjective: 'Acute onset of...', objective: 'Patient appears...', assessment: 'Acute...', plan: 'Treat symptomatically...' },
];

export default function ClinicalNotesScreen() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [diagnosisCodes, setDiagnosisCodes] = useState('');

  useEffect(() => {
    loadNotes();
  }, [patientId]);

  const loadNotes = async () => {
    try {
      let query = supabase
        .from('clinical_notes')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (patientId) query = query.eq('patient_id', patientId);

      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data || []).map((n: any) => ({
        ...n,
        author_name: n.profiles?.full_name || 'Unknown',
      }));
      setNotes(formatted);
    } catch (err) {
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setSubjective(template.subjective);
    setObjective(template.objective);
    setAssessment(template.assessment);
    setPlan(template.plan);
  };

  const saveNote = async () => {
    if (!subjective.trim() && !objective.trim() && !assessment.trim() && !plan.trim()) {
      Alert.alert('Error', 'Note cannot be empty');
      return;
    }

    try {
      const payload = {
        patient_id: patientId || null,
        subjective,
        objective,
        assessment,
        plan,
        diagnosis_codes: diagnosisCodes.split(',').map((c: string) => c.trim()).filter(Boolean),
        author_id: user?.id,
        locked: false,
      };

      if (selectedNote) {
        if (selectedNote.locked) {
          Alert.alert('Locked', 'This note is signed and cannot be edited');
          return;
        }
        const { error } = await supabase.from('clinical_notes').update(payload).eq('id', selectedNote.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clinical_notes').insert(payload);
        if (error) throw error;
      }

      setShowEditor(false);
      setSelectedNote(null);
      resetEditor();
      loadNotes();
    } catch (err) {
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const signNote = async (noteId: string) => {
    Alert.alert('Sign Note', 'Once signed, this note cannot be edited. Proceed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign',
        style: 'default',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('clinical_notes')
              .update({ signed_at: new Date().toISOString(), locked: true })
              .eq('id', noteId);
            if (error) throw error;
            loadNotes();
          } catch (err) {
            Alert.alert('Error', 'Failed to sign note');
          }
        },
      },
    ]);
  };

  const resetEditor = () => {
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    setDiagnosisCodes('');
  };

  const openEditor = (note?: ClinicalNote) => {
    if (note) {
      if (note.locked) {
        Alert.alert('Locked', 'This note is signed and cannot be edited');
        return;
      }
      setSelectedNote(note);
      setSubjective(note.subjective);
      setObjective(note.objective);
      setAssessment(note.assessment);
      setPlan(note.plan);
      setDiagnosisCodes(note.diagnosis_codes?.join(', ') || '');
    } else {
      setSelectedNote(null);
      resetEditor();
    }
    setShowEditor(true);
  };

  const filteredNotes = notes.filter(n =>
    searchQuery === '' ||
    n.subjective.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.assessment.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showEditor) {
    return (
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setShowEditor(false); resetEditor(); }} style={styles.backBtn}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedNote ? 'Edit Note' : 'New Note'}</Text>
          <TouchableOpacity onPress={saveNote} style={styles.saveBtn}>
            <Save size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {!selectedNote && (
          <View style={styles.templatesRow}>
            <Text style={styles.templatesLabel}>Templates:</Text>
            {TEMPLATES.map(t => (
              <TouchableOpacity key={t.name} style={styles.templateChip} onPress={() => applyTemplate(t)}>
                <Text style={styles.templateChipText}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.editorSection}>
          <View style={styles.sectionHeader}>
            <Stethoscope size={16} color="#6366f1" />
            <Text style={styles.sectionTitle}>Subjective</Text>
          </View>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Patient's reported symptoms and history..."
            placeholderTextColor="#64748b"
            value={subjective}
            onChangeText={setSubjective}
          />
        </View>

        <View style={styles.editorSection}>
          <View style={styles.sectionHeader}>
            <ClipboardList size={16} color="#22c55e" />
            <Text style={styles.sectionTitle}>Objective</Text>
          </View>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Physical exam findings, vitals, test results..."
            placeholderTextColor="#64748b"
            value={objective}
            onChangeText={setObjective}
          />
        </View>

        <View style={styles.editorSection}>
          <View style={styles.sectionHeader}>
            <FileText size={16} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Assessment</Text>
          </View>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Diagnosis and clinical reasoning..."
            placeholderTextColor="#64748b"
            value={assessment}
            onChangeText={setAssessment}
          />
        </View>

        <View style={styles.editorSection}>
          <View style={styles.sectionHeader}>
            <ClipboardList size={16} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Plan</Text>
          </View>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Treatment plan, medications, follow-up..."
            placeholderTextColor="#64748b"
            value={plan}
            onChangeText={setPlan}
          />
        </View>

        <View style={styles.editorSection}>
          <Text style={styles.sectionTitle}>Diagnosis Codes (ICD-10)</Text>
          <TextInput
            style={styles.input}
            placeholder="J44.1, E11.9, I10..."
            placeholderTextColor="#64748b"
            value={diagnosisCodes}
            onChangeText={setDiagnosisCodes}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clinical Notes</Text>
        <TouchableOpacity onPress={() => openEditor()} style={styles.addBtn}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredNotes}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.noteCard} onPress={() => openEditor(item)}>
            <View style={styles.noteHeader}>
              <View style={styles.noteMeta}>
                <User size={14} color="#94a3b8" />
                <Text style={styles.noteAuthor}>{item.author_name}</Text>
                <Clock size={14} color="#64748b" />
                <Text style={styles.noteDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              {item.locked ? (
                <View style={styles.lockedBadge}>
                  <Lock size={12} color="#22c55e" />
                  <Text style={styles.lockedText}>Signed</Text>
                </View>
              ) : (
                <View style={styles.draftBadge}>
                  <Unlock size={12} color="#f59e0b" />
                  <Text style={styles.draftText}>Draft</Text>
                </View>
              )}
            </View>
            <Text style={styles.notePreview} numberOfLines={3}>
              {item.subjective.substring(0, 120)}...
            </Text>
            <View style={styles.noteFooter}>
              <Text style={styles.noteAssessment}>{item.assessment.substring(0, 60)}...</Text>
              {!item.locked && (
                <TouchableOpacity onPress={() => signNote(item.id)} style={styles.signBtn}>
                  <Lock size={14} color="#22c55e" />
                  <Text style={styles.signText}>Sign</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileText size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to create your first clinical note</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  saveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 12, marginLeft: 8, fontSize: 14 },
  templatesRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  templatesLabel: { color: '#94a3b8', fontSize: 13, marginRight: 4 },
  templateChip: { backgroundColor: '#1e293b', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#334155' },
  templateChipText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  editorSection: { backgroundColor: '#1e293b', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  textArea: { color: '#fff', fontSize: 14, lineHeight: 22, minHeight: 100, textAlignVertical: 'top', backgroundColor: '#0f172a', borderRadius: 10, padding: 12 },
  input: { color: '#fff', fontSize: 14, backgroundColor: '#0f172a', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#334155' },
  noteCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteAuthor: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  noteDate: { color: '#64748b', fontSize: 12 },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#064e3b', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  lockedText: { color: '#22c55e', fontSize: 11, fontWeight: '700' },
  draftBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#451a03', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  draftText: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
  notePreview: { color: '#94a3b8', fontSize: 13, lineHeight: 20, marginBottom: 10 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteAssessment: { color: '#cbd5e1', fontSize: 12, flex: 1 },
  signBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#064e3b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  signText: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#94a3b8', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: '#64748b', fontSize: 14, marginTop: 8 },
});
