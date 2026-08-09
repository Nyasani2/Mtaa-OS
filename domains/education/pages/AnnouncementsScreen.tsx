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

interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: string;
  created_at: string;
  author_name: string;
  is_admin: boolean;
}

export default function AnnouncementsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data: student } = await supabase
        .from('education_students')
        .select('institution_id, class_id')
        .eq('user_id', user?.id)
        .single();

      const institutionId = student?.institution_id;
      if (!institutionId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Check if user is admin
      const { data: adminCheck } = await supabase
        .from('education_teachers')
        .select('id, role')
        .eq('user_id', user?.id)
        .in('role', ['admin', 'principal', 'headteacher'])
        .single();
      setIsAdmin(!!adminCheck);

      const { data, error } = await supabase
        .from('education_announcements')
        .select('id, title, content, audience, created_at, teacher:teacher_id(full_name, role)')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: Announcement[] = (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        audience: a.audience || 'entire_school',
        created_at: a.created_at,
        author_name: a.teacher?.full_name || 'School Administration',
        is_admin: ['admin', 'principal', 'headteacher'].includes(a.teacher?.role),
      }));

      setAnnouncements(mapped);
    } catch (e) {
      console.error('[Announcements]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);
  const onRefresh = () => { setRefreshing(true); fetchAnnouncements(); };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Announcements</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{announcements.length} announcements</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {announcements.map(a => (
          <View key={a.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: a.is_admin ? '#FEE2E2' : '#DBEAFE' }]}>
                <Ionicons name={a.is_admin ? 'shield' : 'megaphone'} size={18} color={a.is_admin ? '#DC2626' : '#2563EB'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{a.title}</Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                  {a.author_name} · {new Date(a.created_at).toLocaleDateString()}
                </Text>
              </View>
              {a.is_admin && (
                <View style={[styles.adminBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.adminText, { color: '#DC2626' }]}>Official</Text>
                </View>
              )}
            </View>
            <Text style={[styles.cardContent, { color: colors.textSecondary }]}>{a.content}</Text>
            <View style={styles.audienceRow}>
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.audienceText, { color: colors.textSecondary }]}>
                Audience: {a.audience.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        ))}
        {announcements.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="megaphone-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No announcements yet</Text>
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
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  adminBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  adminText: { fontSize: 11, fontWeight: '700' },
  cardContent: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  audienceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  audienceText: { fontSize: 12 },
  emptyText: { marginTop: 12, fontSize: 14 },
});
