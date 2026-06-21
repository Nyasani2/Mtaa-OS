import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth/useAuth';

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const handleGoToStreets = () => router.push('/streets');
  const handleEditProfile = () => router.push('/(os)/profile/edit');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Creator Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your content and profile</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}><Text style={styles.statNumber}>0</Text><Text style={styles.statLabel}>Posts</Text></View>
          <View style={styles.statCard}><Text style={styles.statNumber}>0</Text><Text style={styles.statLabel}>Followers</Text></View>
          <View style={styles.statCard}><Text style={styles.statNumber}>0</Text><Text style={styles.statLabel}>Following</Text></View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3B82F6' }]} onPress={handleGoToStreets}>
            <Text style={styles.actionButtonText}>Go to Streets</Text>
            <Text style={styles.actionButtonSubtext}>Create and manage posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10B981' }]} onPress={handleEditProfile}>
            <Text style={styles.actionButtonText}>Edit Profile</Text>
            <Text style={styles.actionButtonSubtext}>Update your profile information</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Getting Started</Text>
          <Text style={styles.infoText}>Start creating content on Streets to build your audience. Share photos, videos, and articles with the MTAA community.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 32 },
  header: { paddingHorizontal: 20, paddingVertical: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  actionsContainer: { paddingHorizontal: 16, gap: 12 },
  actionButton: { borderRadius: 12, padding: 16, alignItems: 'center' },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  actionButtonSubtext: { color: '#FFFFFF', fontSize: 12, opacity: 0.8, marginTop: 4 },
  infoCard: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
});
