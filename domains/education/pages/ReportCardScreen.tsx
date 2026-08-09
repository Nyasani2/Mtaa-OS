import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface GradeItem {
  id: string;
  subject_name: string;
  term: string;
  score: number;
  grade: string;
  teacher_name: string;
  created_at: string;
}

interface TermSummary {
  term: string;
  average: number;
  totalSubjects: number;
}

export default function ReportCardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [terms, setTerms] = useState<TermSummary[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('all');

  const fetchGrades = useCallback(async () => {
    try {
      const { data: student } = await supabase
        .from('education_students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!student?.id) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error } = await supabase
        .from('education_grades')
        .select('id, term, score, grade, created_at, subject:subject_id(name), teacher:teacher_id(full_name)')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: GradeItem[] = (data || []).map((g: any) => ({
        id: g.id,
        subject_name: g.subject?.name || 'General',
        term: g.term,
        score: g.score,
        grade: g.grade,
        teacher_name: g.teacher?.full_name || 'Teacher',
        created_at: g.created_at,
      }));

      setGrades(mapped);

      // Calculate term summaries
      const termMap = new Map<string, { scores: number[] }>();
      mapped.forEach(g => {
        if (!termMap.has(g.term)) termMap.set(g.term, { scores: [] });
        termMap.get(g.term)!.scores.push(g.score);
      });

      const summaries: TermSummary[] = Array.from(termMap.entries()).map(([term, data]) => ({
        term,
        average: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        totalSubjects: data.scores.length,
      }));

      setTerms(summaries);
    } catch (e) {
      console.error('[ReportCard]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);
  const onRefresh = () => { setRefreshing(true); fetchGrades(); };

  const filtered = selectedTerm === 'all' ? grades : grades.filter(g => g.term === selectedTerm);

  const getGradeColor = (grade: string) => {
    if (['A', 'A+', 'A-'].includes(grade)) return '#059669';
    if (['B', 'B+', 'B-'].includes(grade)) return '#2563EB';
    if (['C', 'C+', 'C-'].includes(grade)) return '#D97706';
    if (['D', 'D+'].includes(grade)) return '#F59E0B';
    return '#DC2626';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#059669';
    if (score >= 70) return '#2563EB';
    if (score >= 60) return '#D97706';
    if (score >= 50) return '#F59E0B';
    return '#DC2626';
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Report Card</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{grades.length} grades recorded</Text>
      </View>

      {/* Term Summary */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.termBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        <TouchableOpacity
          style={[styles.termChip, selectedTerm === 'all' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedTerm('all')}
        >
          <Text style={[styles.termChipText, { color: selectedTerm === 'all' ? '#fff' : colors.text }]}>All Terms</Text>
        </TouchableOpacity>
        {terms.map(t => (
          <TouchableOpacity
            key={t.term}
            style={[styles.termChip, selectedTerm === t.term && { backgroundColor: colors.primary }]}
            onPress={() => setSelectedTerm(t.term)}
          >
            <Text style={[styles.termChipText, { color: selectedTerm === t.term ? '#fff' : colors.text }]}>
              {t.term} · {t.average}%
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 16 }}>
        {filtered.map(g => (
          <View key={g.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{g.subject_name}</Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                  {g.term} · {g.teacher_name}
                </Text>
              </View>
              <View style={[styles.gradeCircle, { borderColor: getGradeColor(g.grade) }]}>
                <Text style={[styles.gradeText, { color: getGradeColor(g.grade) }]}>{g.grade}</Text>
              </View>
            </View>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreFill, { width: `${Math.min(g.score, 100)}%`, backgroundColor: getScoreColor(g.score) }]} />
            </View>
            <Text style={[styles.scoreText, { color: getScoreColor(g.score) }]}>{g.score}%</Text>
          </View>
        ))}
        {filtered.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No grades recorded yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  termBar: { maxHeight: 52, marginVertical: 8 },
  termChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  termChipText: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  gradeCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  gradeText: { fontSize: 16, fontWeight: '800' },
  scoreBar: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, marginTop: 8 },
  scoreFill: { height: '100%', borderRadius: 4 },
  scoreText: { fontSize: 14, fontWeight: '700', marginTop: 6, textAlign: 'right' },
  emptyText: { marginTop: 12, fontSize: 14 },
});
