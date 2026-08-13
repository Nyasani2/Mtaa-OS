import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface FeedItem {
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
}

const DEMO_FILTERS: Record<string, string[]> = {
  country: ['Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia'],
  curriculum: ['CBC', '8-4-4', 'WAEC', 'CAPS', 'IGCSE', 'GCE'],
  subject: ['Mathematics', 'Science', 'English', 'Kiswahili', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'],
  grade: ['1','2','3','4','5','6','7','8','9','10','11','12'],
  language: ['English', 'Swahili', 'French', 'Arabic', 'Zulu', 'Amharic'],
  category: ['Lesson', 'Video', 'Worksheet', 'Exam Prep', 'Reading', 'Quiz'],
};

export default function AfricanFeedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filterKey, setFilterKey] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('education_resources')
        .select(`
          id, title, description, resource_type, grade_level, language, country, curriculum,
          created_at, view_count, is_public,
          subject:subject_id(name),
          teacher:teacher_id(full_name, verification_status)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (filterValues.country) query = query.eq('country', filterValues.country);
      if (filterValues.curriculum) query = query.eq('curriculum', filterValues.curriculum);
      if (filterValues.grade) query = query.eq('grade_level', filterValues.grade);
      if (filterValues.language) query = query.eq('language', filterValues.language);
      if (filterValues.category) query = query.eq('resource_type', filterValues.category);

      const { data, error } = await query.limit(50);
      if (error) throw error;

      const mapped: FeedItem[] = (data || [])
        .filter((item: any) => item.teacher?.verification_status === 'verified')
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          resource_type: item.resource_type,
          subject_name: item.subject?.name,
          teacher_name: item.teacher?.full_name || 'Teacher',
          teacher_verified: item.teacher?.verification_status === 'verified',
          grade_level: item.grade_level,
          language: item.language,
          country: item.country,
          curriculum: item.curriculum,
          created_at: item.created_at,
          view_count: item.view_count || 0,
        }));

      setItems(mapped);
    } catch (e: any) {
      console.error('[AfricanFeed]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterValues]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const onRefresh = () => { setRefreshing(true); fetchFeed(); };

  const incrementView = async (id: string) => {
    try {
      await supabase.rpc('increment_resource_view', { resource_id: id });
    } catch (e) { /* silent */ }
  };

  const renderItem = ({ item }: { item: FeedItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        incrementView(item.id);
        router.push(`/(education)/resource-detail?id=${item.id}` as any);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="book" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{item.teacher_name}</Text>
            {item.teacher_verified && <Ionicons name="checkmark-circle" size={14} color="#22c55e" />}
          </View>
        </View>
      </View>
      <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
      <View style={styles.tagRow}>
        {item.subject_name && <View style={[styles.tag, { backgroundColor: colors.primary + '15' }]}><Text style={[styles.tagText, { color: colors.primary }]}>{item.subject_name}</Text></View>}
        {item.grade_level && <View style={[styles.tag, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.tagText, { color: '#D97706' }]}>Grade {item.grade_level}</Text></View>}
        {item.country && <View style={[styles.tag, { backgroundColor: '#ECFDF5' }]}><Text style={[styles.tagText, { color: '#059669' }]}>{item.country}</Text></View>}
        {item.curriculum && <View style={[styles.tag, { backgroundColor: '#DBEAFE' }]}><Text style={[styles.tagText, { color: '#2563EB' }]}>{item.curriculum}</Text></View>}
      </View>
      <View style={styles.footerRow}>
        <Ionicons name="eye-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>{item.view_count} views</Text>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>· {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>African Education</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Verified teachers only · {items.length} resources</Text>
      </View>

      {/* Active Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: Object.keys(filterValues).length > 0 ? colors.primary : colors.card, borderColor: colors.border }]}
          onPress={() => setShowFilterPicker(!showFilterPicker)}
        >
          <Ionicons name="options" size={14} color={Object.keys(filterValues).length > 0 ? '#fff' : colors.textSecondary} />
          <Text style={[styles.filterText, { color: Object.keys(filterValues).length > 0 ? '#fff' : colors.textSecondary }]}>Filter</Text>
        </TouchableOpacity>
        {Object.entries(filterValues).map(([k, v]) => (
          <View key={k} style={[styles.activeFilter, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.activeFilterText, { color: colors.primary }]}>{v}</Text>
            <TouchableOpacity onPress={() => { const n = { ...filterValues }; delete n[k]; setFilterValues(n); }}>
              <Ionicons name="close" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ))}
        {Object.keys(filterValues).length > 0 && (
          <TouchableOpacity onPress={() => setFilterValues({})}>
            <Text style={[styles.clear, { color: colors.error }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Filter Picker Panel */}
      {showFilterPicker && (
        <View style={[styles.filterPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.filterPanelTitle, { color: colors.text }]}>Filter By</Text>
          <View style={styles.filterGrid}>
            {Object.keys(DEMO_FILTERS).map((k: any) => (
              <TouchableOpacity
                key={k}
                style={[styles.filterOption, filterKey === k && { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                onPress={() => setFilterKey(filterKey === k ? null : k)}
              >
                <Text style={[styles.filterOptionText, { color: filterKey === k ? colors.primary : colors.text }]}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {filterKey && (
            <View style={styles.valueList}>
              <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Select {filterKey}</Text>
              {DEMO_FILTERS[filterKey].map((v: any) => (
                <TouchableOpacity key={v} style={styles.valueItem} onPress={() => { setFilterValues(prev => ({ ...prev, [filterKey]: v })); setFilterKey(null); }}>
                  <Text style={{ color: colors.text }}>{v}</Text>
                  {filterValues[filterKey] === v && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {loading && items.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Content Found</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Adjust filters or check back later.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  filterBar: { maxHeight: 52, marginVertical: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '600' },
  activeFilter: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  activeFilterText: { fontSize: 12, fontWeight: '600' },
  clear: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  filterPanel: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  filterPanelTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  filterOptionText: { fontSize: 13, fontWeight: '500' },
  valueList: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  valueLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  valueItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700' },
  emptySub: { marginTop: 4, fontSize: 14, textAlign: 'center', maxWidth: 280 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  typeIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardMeta: { fontSize: 12 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '600' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  footerText: { fontSize: 12 },
});
