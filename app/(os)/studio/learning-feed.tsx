import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface Course {
  id: string;
  title: string;
  type: string;
  subject: string;
  grade: string;
  creator_name: string;
  price_kes: number;
  is_public: boolean;
}

const SUBJECTS = ['All', 'Mathematics', 'Science', 'English', 'Kiswahili', 'History', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
const GRADES = ['All', 'Primary', 'Secondary', 'University', 'Adult'];

export default function LearningFeedScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');

  const fetchCourses = async () => {
    setLoading(true);
    let query = supabase
      .from('mstudio_education_content')
      .select('id, title, type, subject, grade_level, price_kes, is_public, creator:creator_id (full_name)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(40);

    if (selectedSubject !== 'All') query = query.eq('subject', selectedSubject);
    if (selectedGrade !== 'All') query = query.eq('grade_level', selectedGrade);

    const { data, error } = await query;

    if (!error) {
      setCourses((data || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        subject: c.subject,
        grade: c.grade_level,
        creator_name: c.creator?.full_name || 'Unknown',
        price_kes: c.price_kes || 0,
        is_public: c.is_public,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, [selectedSubject, selectedGrade]);

  const renderCourse = ({ item }: { item: Course }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(os)/studio/education-player?id=${item.id}`)}
      style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ backgroundColor: '#ff000020', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
              <Text style={{ color: '#ff6b6b', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>{item.type}</Text>
            </View>
            <View style={{ backgroundColor: '#1DA1F220', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: '#1DA1F2', fontSize: 10 }}>{item.subject}</Text>
            </View>
          </View>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }} numberOfLines={2}>{item.title}</Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{item.creator_name} • {item.grade}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {item.price_kes > 0 ? (
            <Text style={{ color: '#00ff00', fontSize: 14, fontWeight: 'bold' }}>KES {item.price_kes}</Text>
          ) : (
            <View style={{ backgroundColor: '#00ff0020', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: '#00ff00', fontSize: 11, fontWeight: '600' }}>FREE</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Learning</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/studio/education-upload')}>
          <Feather name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Subject Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 8 }}>
        {SUBJECTS.map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setSelectedSubject(s)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 16,
              marginRight: 8,
              backgroundColor: selectedSubject === s ? '#1DA1F2' : '#1a1a1a',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11 }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grade Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 12 }}>
        {GRADES.map(g => (
          <TouchableOpacity
            key={g}
            onPress={() => setSelectedGrade(g)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 16,
              marginRight: 8,
              backgroundColor: selectedGrade === g ? '#ff0000' : '#1a1a1a',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11 }}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCourses().then(() => setRefreshing(false)); }} tintColor="#ff0000" />}
        renderItem={renderCourse}
        ListEmptyComponent={
          <View style={{ padding: 60, alignItems: 'center' }}>
            <MaterialCommunityIcons name="school-outline" size={48} color="#333" />
            <Text style={{ color: '#666', marginTop: 16 }}>No courses found</Text>
            <Text style={{ color: '#444', marginTop: 4 }}>Be the first to create educational content</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
