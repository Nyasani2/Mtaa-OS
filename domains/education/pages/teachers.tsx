// domains/education/pages/teachers.tsx
// Education teachers directory page
// Imported by: app/(education)/teachers.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export interface Teacher {
  id: string;
  user_id: string;
  school_id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  subjects: string[];
  qualifications?: string[];
  experience_years?: number;
  bio?: string;
  rating?: number;
  verified: boolean;
  avatar_url?: string;
  created_at: string;
}

export default function EducationTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('education_teachers')
        .select(`
          *,
          profile:user_profiles(full_name, email, phone, avatar_url)
        `)
        .eq('status', 'active');

      if (searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,subjects.cs.{${searchQuery}}`);
      }

      const { data, error } = await query.order('full_name', { ascending: true });
      if (error) throw error;
      setTeachers((data || []).map((t: any) => ({
        ...t,
        full_name: t.profile?.full_name || t.full_name,
        email: t.profile?.email || t.email,
        phone: t.profile?.phone || t.phone,
        avatar_url: t.profile?.avatar_url || t.avatar_url,
      })));
    } catch (e: any) {
      console.error('[EducationTeachers]', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeachers();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const renderTeacher = ({ item }: { item: Teacher }) => (
    <TouchableOpacity style={styles.teacherCard}>
      <View style={styles.teacherHeader}>
        <View style={styles.avatar}>
          {item.avatar_url ? (
            <Text style={styles.avatarText}>👤</Text>
          ) : (
            <Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>{item.full_name}</Text>
          <Text style={styles.teacherSubjects}>{item.subjects?.join(', ') || 'No subjects'}</Text>
        </View>
        {item.verified && (
          <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
        )}
      </View>
      {item.bio && <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>}
      <View style={styles.teacherStats}>
        {item.experience_years !== undefined && (
          <Text style={styles.statText}>📅 {item.experience_years} years exp</Text>
        )}
        {item.rating && <Text style={styles.statText}>⭐ {item.rating}</Text>}
        {item.qualifications && item.qualifications.length > 0 && (
          <Text style={styles.statText}>🎓 {item.qualifications[0]}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teachers</Text>
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search teachers or subjects..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchTeachers}
          returnKeyType="search"
        />
      </View>
      <FlatList
        data={teachers}
        keyExtractor={(item) => item.id}
        renderItem={renderTeacher}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No teachers found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0a0a0a' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#0a0a0a' },
  list: { padding: 12 },
  teacherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  teacherHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  teacherInfo: { flex: 1 },
  teacherName: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  teacherSubjects: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  bio: { fontSize: 13, color: '#374151', marginTop: 8, lineHeight: 18 },
  teacherStats: { flexDirection: 'row', marginTop: 10, gap: 16 },
  statText: { fontSize: 12, color: '#6b7280' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
});
