// domains/education/pages/schools.tsx
// Education schools directory page
// Imported by: app/(education)/schools.tsx

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

export interface School {
  id: string;
  name: string;
  type: string;
  level: string;
  location: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  student_count?: number;
  teacher_count?: number;
  rating?: number;
  verified: boolean;
  created_at: string;
}

export default function EducationSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('education_schools')
        .select('*')
        .eq('status', 'active');

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      setSchools((data || []) as School[]);
    } catch (e: any) {
      console.error('[EducationSchools]', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchools();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const renderSchool = ({ item }: { item: School }) => (
    <TouchableOpacity style={styles.schoolCard}>
      <View style={styles.schoolHeader}>
        <View style={styles.schoolIcon}>
          <Ionicons name="school-outline" size={24} color="#2563eb" />
        </View>
        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName}>{item.name}</Text>
          <Text style={styles.schoolType}>{item.type} · {item.level}</Text>
        </View>
        {item.verified && (
          <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
        )}
      </View>
      <Text style={styles.schoolLocation}>
        <Ionicons name="location-outline" size={14} color="#6b7280" /> {item.location}
      </Text>
      <View style={styles.schoolStats}>
        <Text style={styles.statText}>👨‍🎓 {item.student_count || 0} students</Text>
        <Text style={styles.statText}>👨‍🏫 {item.teacher_count || 0} teachers</Text>
        {item.rating && <Text style={styles.statText}>⭐ {item.rating}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schools</Text>
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search schools..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchSchools}
          returnKeyType="search"
        />
      </View>
      <FlatList
        data={schools}
        keyExtractor={(item) => item.id}
        renderItem={renderSchool}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="school-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No schools found</Text>
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
  schoolCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  schoolHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  schoolIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  schoolInfo: { flex: 1 },
  schoolName: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  schoolType: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  schoolLocation: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  schoolStats: { flexDirection: 'row', marginTop: 8, gap: 16 },
  statText: { fontSize: 12, color: '#6b7280' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
});
