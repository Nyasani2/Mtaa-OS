import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface ResourceDetail {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  subject_name?: string;
  teacher_name: string;
  teacher_verified: boolean;
  grade_level?: string;
  language?: string;
  country?: string;
  curriculum?: string;
  created_at: string;
  view_count: number;
  content_url?: string;
  mstudio_content_id?: string;
}

export default function ResourceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) fetchResource();
  }, [id]);

  const fetchResource = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('education_resources')
        .select(`
          id, title, description, resource_type, grade_level, language, country, curriculum,
          created_at, view_count, content_url, mstudio_content_id,
          subject:subject_id(name),
          teacher:teacher_id(full_name, verification_status)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setResource({
        id: data.id,
        title: data.title,
        description: data.description,
        resource_type: data.resource_type,
        subject_name: data.subject?.name,
        teacher_name: data.teacher?.full_name || 'Teacher',
        teacher_verified: data.teacher?.verification_status === 'verified',
        grade_level: data.grade_level,
        language: data.language,
        country: data.country,
        curriculum: data.curriculum,
        created_at: data.created_at,
        view_count: data.view_count || 0,
        content_url: data.content_url,
        mstudio_content_id: data.mstudio_content_id,
      });

      // Check if saved
      const { data: savedData } = await supabase
        .from('education_saved_resources')
        .select('id')
        .eq('resource_id', id)
        .eq('user_id', user?.id)
        .single();
      setSaved(!!savedData);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load resource');
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async () => {
    try {
      if (saved) {
        await supabase
          .from('education_saved_resources')
          .delete()
          .eq('resource_id', id)
          .eq('user_id', user?.id);
        setSaved(false);
      } else {
        await supabase.from('education_saved_resources').insert({
          resource_id: id,
          user_id: user?.id,
          created_at: new Date().toISOString(),
        });
        setSaved(true);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save resource');
    }
  };

  const openContent = () => {
    if (resource?.content_url) {
      Linking.openURL(resource.content_url);
    } else if (resource?.mstudio_content_id) {
      router.push(`/(studio)/content/${resource.mstudio_content_id}` as any);
    } else {
      Alert.alert('No Content', 'This resource does not have an attached file or link.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!resource) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>Resource not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={2}>{resource.title}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{resource.teacher_name}</Text>
            {resource.teacher_verified && <Ionicons name="checkmark-circle" size={14} color="#22c55e" />}
          </View>
        </View>
        <TouchableOpacity onPress={toggleSave}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        {/* Type Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{resource.resource_type}</Text>
          </View>
          {resource.subject_name && (
            <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.badgeText, { color: '#D97706' }]}>{resource.subject_name}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.text }]}>{resource.description}</Text>

        {/* Metadata */}
        <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.metaItem}>
            <Ionicons name="globe-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Country</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{resource.country || 'Not specified'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="school-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Grade</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{resource.grade_level || 'All grades'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="language-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Language</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{resource.language || 'English'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Curriculum</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{resource.curriculum || 'General'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Views</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{resource.view_count}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Published</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{new Date(resource.created_at).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Open Content Button */}
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={openContent}>
          <Ionicons name="play-circle" size={22} color="#fff" />
          <Text style={styles.actionBtnText}>Open Content</Text>
        </TouchableOpacity>

        {/* Teacher Profile Link */}
        <TouchableOpacity style={[styles.teacherCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.teacherAvatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.teacherAvatarText, { color: colors.primary }]}>{resource.teacher_name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.teacherName, { color: colors.text }]}>{resource.teacher_name}</Text>
            <Text style={[styles.teacherSub, { color: colors.textSecondary }]}>Verified Teacher</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  metaCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  metaItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  metaLabel: { fontSize: 13, marginLeft: 10, width: 100 },
  metaValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginTop: 16 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  teacherCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 16 },
  teacherAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  teacherAvatarText: { fontSize: 18, fontWeight: '700' },
  teacherName: { fontSize: 15, fontWeight: '600' },
  teacherSub: { fontSize: 12, marginTop: 2 },
});
