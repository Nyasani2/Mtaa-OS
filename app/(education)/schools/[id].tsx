// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { School, MapPin, Users, BookOpen, ChevronRight, Phone, Mail } from 'lucide-react-native';

export default function SchoolDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [school, setSchool] = useState<any>(null);
  const [stats, setStats] = useState({ students: 0, staff: 0, classes: 0, courses: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: schoolData } = await supabase
        .from("education_institutions").select("*").eq("id", id).maybeSingle();
      const { count: studentCount } = await supabase
        .from("education_students").select("*", { count: 'exact', head: true }).eq("institution_id", id);
      const { count: staffCount } = await supabase
        .from("education_staff").select("*", { count: 'exact', head: true }).eq("institution_id", id);
      const { count: classCount } = await supabase
        .from("education_classes").select("*", { count: 'exact', head: true }).eq("institution_id", id);
      const { count: courseCount } = await supabase
        .from("education_courses").select("*", { count: 'exact', head: true }).eq("institution_id", id);

      setSchool(schoolData);
      setStats({ students: studentCount || 0, staff: staffCount || 0, classes: classCount || 0, courses: courseCount || 0 });
    } catch (e: any) {
      console.error('[SchoolDetail]', e);
      Alert.alert('Error', e.message || 'Failed to load school');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!school) return <View style={styles.center}><Text>School not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronRight size={24} color="#1e293b" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.title}>School</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.detailCard}>
        <View style={styles.cardRow}>
          <School size={24} color="#6366f1" />
          <Text style={styles.detailTitle}>{school.name || 'Unnamed School'}</Text>
        </View>
        <Text style={styles.detailDesc}>{school.description || 'No description available'}</Text>
        <View style={styles.metaRow}>
          <MapPin size={14} color="#64748b" /><Text style={styles.metaText}>{school.address || 'No address'} · {school.city || ''} · {school.country || ''}</Text>
        </View>
        <View style={styles.metaRow}>
          <Phone size={14} color="#64748b" /><Text style={styles.metaText}>{school.phone || 'No phone'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Mail size={14} color="#64748b" /><Text style={styles.metaText}>{school.email || 'No email'}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#6366f120' }]}>
          <Users size={20} color="#6366f1" />
          <Text style={styles.statValue}>{stats.students}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
          <Users size={20} color="#22c55e" />
          <Text style={styles.statValue}>{stats.staff}</Text>
          <Text style={styles.statLabel}>Staff</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <BookOpen size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.classes}</Text>
          <Text style={styles.statLabel}>Classes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ef444420' }]}>
          <BookOpen size={20} color="#ef4444" />
          <Text style={styles.statValue}>{stats.courses}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/(education as any)/students?institution=${id}` as any)}>
        <Users size={18} color="#6366f1" /><Text style={styles.actionText}>View Students</Text>
        <ChevronRight size={16} color="#9ca3af" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/(education as any)/staff?institution=${id}` as any)}>
        <Users size={18} color="#22c55e" /><Text style={styles.actionText}>View Staff</Text>
        <ChevronRight size={16} color="#9ca3af" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/(education as any)/classes?institution=${id}` as any)}>
        <BookOpen size={18} color="#f59e0b" /><Text style={styles.actionText}>View Classes</Text>
        <ChevronRight size={16} color="#9ca3af" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/(education as any)/courses?institution=${id}` as any)}>
        <BookOpen size={18} color="#ef4444" /><Text style={styles.actionText}>View Courses</Text>
        <ChevronRight size={16} color="#9ca3af" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  detailCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginLeft: 8 },
  detailDesc: { fontSize: 14, color: '#64748b', marginTop: 8, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaText: { fontSize: 12, color: '#64748b' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1e293b' },
});
