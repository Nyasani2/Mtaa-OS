// @ts-nocheck

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useEducation } from '@/domains/education/hooks/useEducation';
import { supabase } from '@/lib/supabase';
import {
  Baby, CreditCard, Bell, Bus, ChevronRight
} from 'lucide-react-native';

interface Props { institutionId: string | null; }

export default function ParentDashboard({ institutionId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getFeePayments, getAnnouncements } = useEducation();
  const [children, setChildren] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: parentData } = await supabase
        .from('education_parents')
        .select('children_ids, institution_id')
        .eq('user_id', user.id)
        .maybeSingle();

      const instId = institutionId || parentData?.institution_id;
      const childIds = parentData?.children_ids || [];

      if (childIds.length > 0) {
        const { data: students } = await supabase
          .from('education_students')
          .select('id, full_name, class_id, admission_number')
          .in('id', childIds);
        setChildren(students || []);

        const [f, a] = await Promise.all([
          getFeePayments({ institution_id: instId }),
          getAnnouncements({ institution_id: instId }),
        ]);
        setFees(f.slice(0, 3));
        setAnnouncements(a.slice(0, 3));
      }
    } catch (e) { console.error('[ParentDashboard]', e); }
    finally { setLoading(false); }
  }, [user?.id, institutionId]);

  useEffect(() => { load(); }, [load]);

  const Section = ({ icon: Icon, title, color, children, onPress }: any) => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          <Icon size={18} color={color} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ChevronRight size={16} color="#475569" />
      </TouchableOpacity>
      {children}
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#38bdf8" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parent Portal</Text>
        <Text style={styles.headerSub}>{user?.email?.split('@')[0] || 'Parent'}</Text>
      </View>

      <Section icon={Baby} title="My Children" color="#38bdf8" onPress={() => router.push('/(education as any)/participants' as any)}>
        {children.length === 0 ? (
          <Text style={styles.empty}>No children linked to your account</Text>
        ) : (
          children.map((child) => (
            <View key={child.id} style={styles.row}>
              <Text style={styles.rowTitle}>{child.full_name || 'Child'}</Text>
              <Text style={styles.rowMeta}>Adm: {child.admission_number || 'N/A'}</Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={CreditCard} title="Fee Payments" color="#fbbf24" onPress={() => router.push('/(education as any)/fees' as any)}>
        {fees.length === 0 ? (
          <Text style={styles.empty}>No fee records</Text>
        ) : (
          fees.map((f) => (
            <View key={f.id} style={styles.row}>
              <Text style={styles.rowTitle}>{f.description || 'Fee Payment'}</Text>
              <Text style={[styles.rowMeta, { color: f.status === 'paid' ? '#34d399' : '#fbbf24' }]}>
                {f.amount ? `KES ${f.amount}` : ''} · {f.status || 'Pending'}
              </Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={Bell} title="Announcements" color="#f87171" onPress={() => router.push('/(education as any)/announcements' as any)}>
        {announcements.length === 0 ? (
          <Text style={styles.empty}>No announcements</Text>
        ) : (
          announcements.map((n) => (
            <View key={n.id} style={styles.row}>
              <Text style={styles.rowTitle} numberOfLines={1}>{n.title || 'Announcement'}</Text>
              <Text style={styles.rowMeta}>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={Bus} title="Transport" color="#34d399" onPress={() => router.push('/(education as any)/transport' as any)}>
        <Text style={styles.empty}>View transport routes and pickup schedules.</Text>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  headerSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  section: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#e2e8f0' },
  row: { paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e293b' },
  rowTitle: { fontSize: 14, color: '#f8fafc', fontWeight: '500' },
  rowMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  empty: { padding: 14, fontSize: 13, color: '#475569', fontStyle: 'italic' },
});

