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

interface FeedItem {
  id: string;
  type: 'announcement' | 'homework' | 'class_update' | 'event';
  title: string;
  content: string;
  author: string;
  created_at: string;
  subject_name?: string;
  due_date?: string;
}

export default function SchoolFeedScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const { data: student } = await supabase
        .from('education_students')
        .select('institution_id')
        .eq('user_id', user?.id)
        .single();

      const instId = student?.institution_id;
      if (!instId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setInstitutionId(instId);

      // Fetch announcements
      const { data: announcements } = await supabase
        .from('education_announcements')
        .select('id, title, content, created_at, teacher:teacher_id(full_name)')
        .eq('institution_id', instId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch assignments/homework
      const { data: assignments } = await supabase
        .from('education_assignments')
        .select('id, title, description, due_date, created_at, subject:subject_id(name), teacher:teacher_id(full_name)')
        .eq('class_id', student?.class_id)
        .order('created_at', { ascending: false })
        .limit(10);

      const feedItems: FeedItem[] = [];

      (announcements || []).forEach((a: any) => {
        feedItems.push({
          id: `ann-${a.id}`,
          type: 'announcement',
          title: a.title,
          content: a.content,
          author: a.teacher?.full_name || 'School Admin',
          created_at: a.created_at,
        });
      });

      (assignments || []).forEach((a: any) => {
        feedItems.push({
          id: `hw-${a.id}`,
          type: 'homework',
          title: a.title,
          content: a.description,
          author: a.teacher?.full_name || 'Teacher',
          created_at: a.created_at,
          subject_name: a.subject?.name,
          due_date: a.due_date,
        });
      });

      feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(feedItems);
    } catch (e) {
      console.error('[SchoolFeed]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);
  const onRefresh = () => { setRefreshing(true); fetchFeed(); };

  const filtered = filter === 'all' ? items : items.filter((i: any) => i.type === filter);

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement': return 'megaphone';
      case 'homework': return 'book';
      case 'class_update': return 'people';
      case 'event': return 'calendar';
      default: return 'document-text';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'announcement': return '#D97706';
      case 'homework': return '#2563EB';
      case 'class_update': return '#7C3AED';
      case 'event': return '#059669';
      default: return colors.primary;
    }
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>School Feed</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{items.length} updates</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {['all', 'announcement', 'homework'].map((f: any) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && { backgroundColor: colors.primary }]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, { color: filter === f ? '#fff' : colors.textSecondary }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 16 }}>
        {filtered.map((item: any) => (
          <TouchableOpacity key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {
            if (item.type === 'homework') router.push(`/(education)/homework?id=${item.id.replace('hw-', '')}` as any);
          }}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: getColor(item.type) + '15' }]}>
                <Ionicons name={getIcon(item.type) as any} size={18} color={getColor(item.type)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{item.author} · {new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
            <Text style={[styles.cardContent, { color: colors.textSecondary }]} numberOfLines={3}>{item.content}</Text>
            {item.due_date && (
              <View style={styles.dueRow}>
                <Ionicons name="time-outline" size={14} color="#EF4444" />
                <Text style={[styles.dueText, { color: '#EF4444' }]}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="newspaper-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No {filter !== 'all' ? filter : ''} updates</Text>
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
  filterBar: { maxHeight: 52, marginVertical: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterText: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  cardContent: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  dueText: { fontSize: 12, fontWeight: '600' },
  emptyText: { marginTop: 12, fontSize: 14 },
});
