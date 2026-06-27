import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  subject: string;
  grade_level: string;
  file_url: string | null;
  download_count: number;
  created_at: string;
  uploader_name: string;
}

export default function EducationLibraryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterType, setFilterType] = useState('');

  const resourceTypes = ['pdf', 'video', 'audio', 'image', 'document', 'worksheet', 'exam', 'notes'];
  const subjects = ['All', 'Mathematics', 'Science', 'English', 'Kiswahili', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];

  const fetchResources = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('education_resources')
      .select(`
        id, title, description, resource_type, subject, grade_level,
        file_url, download_count, created_at,
        profiles:uploaded_by(display_name)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (filterSubject && filterSubject !== 'All') query = query.eq('subject', filterSubject);
    if (filterType) query = query.eq('resource_type', filterType);
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);

    const { data, error } = await query.limit(50);
    if (error) { console.error(error); setLoading(false); return; }

    const mapped = (data || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      resource_type: d.resource_type,
      subject: d.subject,
      grade_level: d.grade_level,
      file_url: d.file_url,
      download_count: d.download_count || 0,
      created_at: d.created_at,
      uploader_name: d.profiles?.display_name || 'Unknown',
    }));

    setResources(mapped);
    setLoading(false);
  }, [filterSubject, filterType, searchQuery]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      pdf: 'document-text', video: 'videocam', audio: 'musical-notes',
      image: 'image', document: 'document', worksheet: 'grid',
      exam: 'school', notes: 'clipboard',
    };
    return icons[type] || 'document';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pdf: '#ff4444', video: '#ff00ff', audio: '#00ff88',
      image: '#00d4ff', document: '#ffaa00', worksheet: '#aa00ff',
      exam: '#ff6600', notes: '#00ccff',
    };
    return colors[type] || '#888';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity onPress={() => router.push('/education/library/upload')}>
          <Ionicons name="cloud-upload" size={24} color="#00d4ff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search resources..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {subjects.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filterSubject === s && styles.filterChipActive]}
            onPress={() => setFilterSubject(s === 'All' ? '' : s)}
          >
            <Text style={[styles.filterChipText, filterSubject === s && styles.filterChipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#00d4ff" /></View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {resources.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>No resources found</Text>
            </View>
          ) : (
            resources.map(res => (
              <TouchableOpacity key={res.id} style={styles.resourceCard} onPress={() => {}}>
                <View style={[styles.typeIcon, { backgroundColor: getTypeColor(res.resource_type) + '15' }]}>
                  <Ionicons name={getTypeIcon(res.resource_type)} size={22} color={getTypeColor(res.resource_type)} />
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{res.title}</Text>
                  <Text style={styles.resourceMeta}>{res.subject} · {res.grade_level}</Text>
                  <View style={styles.resourceFooter}>
                    <Text style={styles.resourceUploader}>{res.uploader_name}</Text>
                    <View style={styles.downloadBadge}>
                      <Ionicons name="download-outline" size={12} color="#888" />
                      <Text style={styles.downloadCount}>{res.download_count}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 12, backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 12 },
  filterScroll: { maxHeight: 40, paddingHorizontal: 16, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#111', borderWidth: 1, borderColor: '#1a1a1a', marginRight: 8 },
  filterChipActive: { backgroundColor: '#00d4ff15', borderColor: '#00d4ff' },
  filterChipText: { color: '#888', fontSize: 12 },
  filterChipTextActive: { color: '#00d4ff', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  resourceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1a1a1a' },
  typeIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  resourceInfo: { flex: 1 },
  resourceTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  resourceMeta: { color: '#888', fontSize: 11, marginBottom: 6 },
  resourceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resourceUploader: { color: '#666', fontSize: 11 },
  downloadBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  downloadCount: { color: '#888', fontSize: 11 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 16, marginTop: 12 },
});
