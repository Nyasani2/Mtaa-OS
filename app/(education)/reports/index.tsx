import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function ReportsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'attendance' | 'grades' | 'fees'>('attendance');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'attendance') {
        const { data } = await supabase.from('education_attendance').select('*, student:education_students(full_name)').order('date', { ascending: false }).limit(20);
        setData(data || []);
      } else if (activeTab === 'grades') {
        const { data } = await supabase.from('education_grades').select('*, student:education_students(full_name), subject:education_subjects(name)').order('created_at', { ascending: false }).limit(20);
        setData(data || []);
      } else {
        const { data } = await supabase.from('education_fee_payments').select('*, student:education_students(full_name)').order('paid_at', { ascending: false }).limit(20);
        setData(data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.tabs}>
        {(['attendance', 'grades', 'fees'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {data.map((item, idx) => (
          <View key={idx} style={styles.card}>
            {activeTab === 'attendance' && (
              <>
                <Text style={styles.cardTitle}>{item.student?.full_name}</Text>
                <Text style={styles.cardMeta}>Date: {new Date(item.date).toLocaleDateString()}</Text>
                <View style={[styles.badge, { backgroundColor: item.status === 'present' ? '#10b98120' : '#ef444420' }]}>
                  <Text style={[styles.badgeText, { color: item.status === 'present' ? '#10b981' : '#ef4444' }]}>{item.status.toUpperCase()}</Text>
                </View>
              </>
            )}
            {activeTab === 'grades' && (
              <>
                <Text style={styles.cardTitle}>{item.student?.full_name}</Text>
                <Text style={styles.cardMeta}>{item.subject?.name}</Text>
                <Text style={[styles.badgeText, { color: '#10b981', fontWeight: '800' as const, fontSize: 16 }]}>Score: {item.score}/{item.max_score || 100} ({item.grade})</Text>
              </>
            )}
            {activeTab === 'fees' && (
              <>
                <Text style={styles.cardTitle}>{item.student?.full_name}</Text>
                <Text style={styles.cardMeta}>Amount: KES {item.amount?.toLocaleString()}</Text>
                <Text style={[styles.badgeText, { color: '#10b981', fontWeight: '700' as const }]}>{item.status?.toUpperCase()}</Text>
              </>
            )}
          </View>
        ))}
        {data.length === 0 && !loading && <Text style={styles.emptyText}>No {activeTab} records found</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#8b5cf6' },
  tabText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardMeta: { color: '#64748b', fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40 },
});
