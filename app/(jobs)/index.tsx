import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth/useAuth';
import { supabase } from '@/lib/supabase';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_min: number;
  salary_max: number;
  type: string;
  posted_at: string;
}

interface JobSeeker {
  id: string;
  full_name: string;
  headline: string;
  is_available: boolean;
}

export default function JobsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myProfile, setMyProfile] = useState<JobSeeker | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'fulltime' | 'parttime' | 'remote'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data: mine } = await supabase
          .from('job_seekers')
          .select('id, full_name, headline, is_available')
          .eq('user_id', user.id)
          .maybeSingle();
        setMyProfile(mine);
      }

      const { data: all } = await supabase
        .from('jobs')
        .select('id, title, company, location, salary_min, salary_max, type, posted_at')
        .eq('status', 'active')
        .order('posted_at', { ascending: false })
        .limit(20);
      setJobs(all || []);
    } catch (err) {
      console.error('Jobs load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'all' ||
      (activeFilter === 'fulltime' && j.type === 'Full-time') ||
      (activeFilter === 'parttime' && j.type === 'Part-time') ||
      (activeFilter === 'remote' && j.type === 'Remote');
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { key: 'all', label: 'All Jobs', icon: 'briefcase' },
    { key: 'fulltime', label: 'Full-time', icon: 'time' },
    { key: 'parttime', label: 'Part-time', icon: 'timer-outline' },
    { key: 'remote', label: 'Remote', icon: 'globe' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jobs</Text>
        <TouchableOpacity onPress={() => router.push('/(jobs)/applications' as any)}>
          <Ionicons name="document-text-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search jobs, companies..."
          placeholderTextColor="#64748b"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key as any)}
          >
            <Ionicons name={f.icon as any} size={14} color={activeFilter === f.key ? '#fff' : '#94a3b8'} />
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* My Profile / Onboarding CTA */}
      {myProfile ? (
        <TouchableOpacity style={styles.myProfileCard} onPress={() => router.push({ pathname: '/(jobs)/profile', params: { id: myProfile.id } } as any)}>
          <View style={styles.myProfHeader}>
            <Ionicons name="person-circle" size={28} color="#3B82F6" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.myProfName}>{myProfile.full_name}</Text>
              <Text style={styles.myProfHeadline}>{myProfile.headline}</Text>
            </View>
            <View style={[styles.statusBadge, myProfile.is_available ? styles.statusOpen : styles.statusClosed]}>
              <Text style={styles.statusText}>{myProfile.is_available ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.onboardCard} onPress={() => router.push('/(jobs)/onboarding' as any)}>
          <Ionicons name="briefcase-outline" size={32} color="#3B82F6" />
          <Text style={styles.onboardTitle}>Create Your Profile</Text>
          <Text style={styles.onboardDesc}>Build your professional profile, add your skills, and start applying to jobs.</Text>
          <View style={styles.onboardBtn}>
            <Text style={styles.onboardBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={16} color="#0f172a" />
          </View>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Latest Jobs</Text>
      {loading ? (
        <ActivityIndicator color="#3B82F6" style={{ marginTop: 20 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={48} color="#475569" />
          <Text style={styles.emptyText}>No jobs found</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {filtered.map(job => (
            <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => router.push({ pathname: '/(jobs)/detail', params: { id: job.id } } as any)}>
              <View style={styles.jobHeader}>
                <View style={styles.jobAvatar}>
                  <Ionicons name="business" size={18} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobCompany}>{job.company}</Text>
                </View>
                <Text style={styles.jobType}>{job.type}</Text>
              </View>
              <View style={styles.jobFooter}>
                <Text style={styles.jobLocation}>📍 {job.location}</Text>
                <Text style={styles.jobSalary}>KES {job.salary_min?.toLocaleString()} - {job.salary_max?.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, marginLeft: 8 },
  filterScroll: { paddingHorizontal: 20, marginBottom: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  filterChipActive: { backgroundColor: '#3B82F6' },
  filterText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  onboardCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  onboardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  onboardDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  onboardBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 14 },
  onboardBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  myProfileCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  myProfHeader: { flexDirection: 'row', alignItems: 'center' },
  myProfName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  myProfHeadline: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusOpen: { backgroundColor: '#10B981' },
  statusClosed: { backgroundColor: '#EF4444' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginHorizontal: 20, marginBottom: 10 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#64748b', fontSize: 14, marginTop: 12 },
  jobCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  jobHeader: { flexDirection: 'row', alignItems: 'center' },
  jobAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e3a5f', alignItems: 'center', justifyContent: 'center' },
  jobTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  jobCompany: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  jobType: { color: '#3B82F6', fontSize: 11, fontWeight: '600', backgroundColor: '#1e3a5f', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  jobLocation: { color: '#94a3b8', fontSize: 12 },
  jobSalary: { color: '#10B981', fontSize: 12, fontWeight: '600' },
});
