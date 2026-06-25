import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const JOB_CATEGORIES = [
  { icon: 'briefcase', label: 'Creator Gigs', desc: 'Short-term content creation jobs' },
  { icon: 'people', label: 'Brand Collabs', desc: 'Partner with brands for sponsored content' },
  { icon: 'star', label: 'Talent Marketplace', desc: 'Discover and hire creative talent' },
  { icon: 'megaphone', label: 'Influencer Campaigns', desc: 'Join brand marketing campaigns' },
  { icon: 'camera', label: 'Production Crew', desc: 'Film, edit, and production roles' },
  { icon: 'musical-notes', label: 'Music & Audio', desc: 'Sound design and music production' },
];

export default function JobsScreen() {
  const router = useRouter();

  const openJobs = useCallback(() => {
    router.push('/(os)/jobs');
  }, [router]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Streets Jobs</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="briefcase" size={48} color="#2196F3" />
        </View>
        <Text style={styles.heroTitle}>Creator Economy</Text>
        <Text style={styles.heroSubtitle}>
          Find gigs, brand deals, and collaboration opportunities. All powered by MTAA Jobs.
        </Text>
        <TouchableOpacity style={styles.heroBtn} onPress={openJobs}>
          <Text style={styles.heroBtnText}>Open MTAA Jobs</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Opportunities</Text>
      {JOB_CATEGORIES.map((cat, idx) => (
        <TouchableOpacity key={idx} style={styles.card} onPress={openJobs}>
          <View style={styles.cardIcon}>
            <Ionicons name={cat.icon as any} size={24} color="#2196F3" />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{cat.label}</Text>
            <Text style={styles.cardDesc}>{cat.desc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      ))}

      <View style={styles.tipCard}>
        <Ionicons name="bulb" size={20} color="#FFD700" />
        <Text style={styles.tipText}>
          Connect your Streets profile to your MTAA Jobs resume for better visibility to brands and recruiters.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  hero: {
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0d1f33',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  heroSubtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  heroBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardDesc: { color: '#888', fontSize: 13, marginTop: 2 },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1500',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#332200',
    gap: 10,
  },
  tipText: { color: '#ccc', fontSize: 13, flex: 1, lineHeight: 18 },
});
