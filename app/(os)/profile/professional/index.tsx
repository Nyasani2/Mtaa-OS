// app/(os)/profile/professional/index.tsx — Professional CV
// Reads from profiles table (headline, profession, skills, education, experience)

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export default function ProfessionalScreen() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuth();
  const [profData, setProfData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { initialize(); }, []);
  useEffect(() => {
    if (isAuthenticated && user?.id) loadProfessionalData();
  }, [isAuthenticated, user?.id]);

  async function loadProfessionalData() {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Try professional_profiles table first, fallback to profiles
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setProfData(data);
      } else {
        // Fallback: use profiles table data
        setProfData({
          headline: user.headline,
          summary: user.bio,
          profession: user.profession,
          skills: user.skills || [],
          experience: [],
          education: [],
          certificates: [],
          portfolio: [],
          availability: 'available',
        });
      }
    } catch (err) {
      console.error('[Professional] Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="briefcase-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Sign in to view your Professional CV</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/sign-in')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional CV</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/professional/edit')}>
          <Ionicons name="create-outline" size={22} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#f59e0b" />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Headline */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Headline</Text>
            <Text style={styles.cardText}>{profData?.headline || user?.headline || 'No headline set'}</Text>
          </View>

          {/* Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Summary</Text>
            <Text style={styles.cardText}>{profData?.summary || user?.bio || 'No summary yet'}</Text>
          </View>

          {/* Profession */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profession</Text>
            <Text style={styles.cardText}>{profData?.profession || user?.profession || 'Not specified'}</Text>
          </View>

          {/* Skills */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Skills</Text>
            {profData?.skills?.length > 0 ? (
              <View style={styles.tagsRow}>
                {profData.skills.map((skill: string, i: number) => (
                  <View key={i} style={styles.tag}><Text style={styles.tagText}>{skill}</Text></View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No skills added yet</Text>
            )}
          </View>

          {/* Experience */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Experience</Text>
            {profData?.experience?.length > 0 ? (
              profData.experience.map((exp: any, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listTitle}>{exp.title}</Text>
                  <Text style={styles.listSub}>{exp.company} • {exp.duration}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No experience added yet</Text>
            )}
          </View>

          {/* Education */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Education</Text>
            {profData?.education?.length > 0 ? (
              profData.education.map((edu: any, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listTitle}>{edu.degree}</Text>
                  <Text style={styles.listSub}>{edu.institution} • {edu.year}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No education added yet</Text>
            )}
          </View>

          {/* Availability */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Availability</Text>
            <View style={[styles.availabilityBadge, { backgroundColor: profData?.availability === 'available' ? '#d1fae5' : '#fee2e2' }]}>
              <Text style={[styles.availabilityText, { color: profData?.availability === 'available' ? '#059669' : '#dc2626' }]}>
                {profData?.availability === 'available' ? '✓ Available for work' : '✗ Not available'}
              </Text>
            </View>
          </View>

          {/* QR Hire */}
          <TouchableOpacity style={styles.qrCard} onPress={() => router.push('/(os)/profile/qr')}>
            <Ionicons name="qr-code-outline" size={24} color="#f59e0b" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.qrTitle}>Share Professional Card</Text>
              <Text style={styles.qrSub}>Scan QR to view CV, Portfolio, and Hire</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 8 },
  cardText: { fontSize: 15, color: '#333', lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  tagText: { fontSize: 12, color: '#6366f1', fontWeight: '500' },
  listItem: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  listSub: { fontSize: 13, color: '#888', marginTop: 2 },
  emptyText: { fontSize: 14, color: '#aaa', fontStyle: 'italic' },
  availabilityBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  availabilityText: { fontSize: 13, fontWeight: '600' },
  qrCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24 },
  qrTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  qrSub: { fontSize: 12, color: '#888', marginTop: 2 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 16, textAlign: 'center' },
  button: { backgroundColor: '#f59e0b', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
