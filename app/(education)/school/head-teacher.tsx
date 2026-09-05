// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { getSchools, getTeachers, getStudents, getClasses, getPayroll, getEvents } from '@/lib/services/education-service';

export default function HeadTeacherScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0, payroll: 0 });
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      setLoading(true);
      const allTeachers = await getTeachers('').catch(() => []);
      const t = allTeachers?.find((teach: any) => teach.user_id === user.id) || null;

      if (t?.institution_id) {
        const [s, cls, teachs, studs, payroll, evts] = await Promise.all([
          getSchools().then(schools => schools?.find((sch: any) => sch.id === t.institution_id)).catch(() => null),
          getClasses(t.institution_id).catch(() => []),
          getTeachers(t.institution_id).catch(() => []),
          getStudents(t.institution_id).catch(() => []),
          getPayroll(t.institution_id).catch(() => []),
          getEvents(t.institution_id).catch(() => []),
        ]);
        setSchool(s);
        setStats({ teachers: teachs?.length || 0, students: studs?.length || 0, classes: cls?.length || 0, payroll: payroll?.length || 0 });
        setEvents(evts || []);
      }
    } catch (e) { console.log('Head teacher load error:', e); }
    finally { setLoading(false); }
  };

  const StatCard = ({ icon, value, label, color }: any) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const ActionCard = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 12, color: '#94a3b8' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Head Teacher</Text>
        <TouchableOpacity onPress={() => router.push('/(education as any)/school/assign-role' as any)}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName}>{school?.name || 'Your School'}</Text>
          <Text style={styles.schoolSub}>{school?.address || 'Set up your school profile'}</Text>
        </View>
        <View style={styles.statsRow}>
          <StatCard icon="people-outline" value={stats.teachers} label="Teachers" color="#3b82f6" />
          <StatCard icon="school-outline" value={stats.students} label="Students" color="#10b981" />
          <StatCard icon="grid-outline" value={stats.classes} label="Classes" color="#f59e0b" />
          <StatCard icon="wallet-outline" value={stats.payroll} label="Payroll" color="#8b5cf6" />
        </View>
        <Text style={styles.sectionTitle}>School Management</Text>
        <View style={styles.actionGrid}>
          <ActionCard icon="person-add-outline" label="Invite Teachers" color="#3b82f6" onPress={() => router.push('/(education as any)/schools/invite-teacher' as any)} />
          <ActionCard icon="people-outline" label="Manage Staff" color="#10b981" onPress={() => router.push('/(education as any)/teachers' as any)} />
          <ActionCard icon="cash-outline" label="Fee Structure" color="#f59e0b" onPress={() => router.push('/(education as any)/school/fees' as any)} />
          <ActionCard icon="wallet-outline" label="Approve Payroll" color="#8b5cf6" onPress={() => router.push('/(education as any)/payroll' as any)} />
          <ActionCard icon="calendar-outline" label="Calendar" color="#0ea5e9" onPress={() => router.push('/(education as any)/timetable' as any)} />
          <ActionCard icon="document-text-outline" label="Policies" color="#64748b" onPress={() => Alert.alert("School Policies", "Policies management coming soon.")} />
          <ActionCard icon="shield-checkmark-outline" label="Permissions" color="#059669" onPress={() => router.push('/(education as any)/school/assign-role' as any)} />
          <ActionCard icon="arrow-redo-outline" label="Transfer Ownership" color="#ef4444" onPress={() => Alert.alert("Transfer Ownership", "Ownership transfer requires admin approval.")} />
        </View>
        <Text style={styles.sectionTitle}>Reports & Analytics</Text>
        <View style={styles.reportRow}>
          <View style={styles.reportCard}>
            <Ionicons name="trending-up-outline" size={20} color="#10b981" />
            <Text style={styles.reportLabel}>Attendance</Text>
            <Text style={styles.reportValue}>94%</Text>
          </View>
          <View style={styles.reportCard}>
            <Ionicons name="trending-up-outline" size={20} color="#3b82f6" />
            <Text style={styles.reportLabel}>Performance</Text>
            <Text style={styles.reportValue}>B+</Text>
          </View>
        </View>
        <View style={styles.reportRow}>
          <View style={styles.reportCard}>
            <Ionicons name="trending-down-outline" size={20} color="#ef4444" />
            <Text style={styles.reportLabel}>Incidents</Text>
            <Text style={styles.reportValue}>2</Text>
          </View>
          <View style={styles.reportCard}>
            <Ionicons name="trending-up-outline" size={20} color="#10b981" />
            <Text style={styles.reportLabel}>Fee Collection</Text>
            <Text style={styles.reportValue}>87%</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {events.length === 0 ? (
          <View style={styles.emptyEvents}>
            <Ionicons name="calendar-outline" size={32} color="#cbd5e1" />
            <Text style={styles.emptyEventsText}>No upcoming events</Text>
          </View>
        ) : events.slice(0, 3).map((event: any) => (
          <TouchableOpacity key={event.id} style={styles.eventCard}>
            <View style={styles.eventDateBox}>
              <Text style={styles.eventMonth}>{new Date(event.date).toLocaleString('default', { month: 'short' })}</Text>
              <Text style={styles.eventDay}>{new Date(event.date).getDate()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventMeta}>{event.location} · {event.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  schoolInfo: { backgroundColor: '#1e3a5f', paddingHorizontal: 16, paddingBottom: 20 },
  schoolName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  schoolSub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  actionCard: { width: '23%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 10, color: '#475569', textAlign: 'center', fontWeight: '500' },
  reportRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  reportCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  reportLabel: { fontSize: 12, color: '#94a3b8', flex: 1 },
  reportValue: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  emptyEvents: { alignItems: 'center', paddingVertical: 30 },
  emptyEventsText: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12 },
  eventDateBox: { width: 48, height: 48, backgroundColor: '#3b82f6', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  eventMonth: { fontSize: 10, color: '#fff', textTransform: 'uppercase', fontWeight: '600' },
  eventDay: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  eventMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
});
