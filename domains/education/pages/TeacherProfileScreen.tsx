import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTeacherIdentity } from '@/domains/education/hooks/useTeacherIdentity';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function TeacherProfileScreen() {
  const { teacherId } = useLocalSearchParams<{ teacherId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { identity, loading, error, refreshing, refresh, isOwner, isAdmin, recordCheckIn, recordCheckOut } = useTeacherIdentity(teacherId);
  const [activeTab, setActiveTab] = useState<'overview' | 'professional' | 'performance' | 'economy'>('overview');
  const [checkingIn, setCheckingIn] = useState(false);

  // ─── LOADING STATE ───
  if (loading && !identity) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading teacher profile...</Text>
      </View>
    );
  }

  // ─── ERROR STATE ───
  if (error && !identity) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to Load Profile</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── EMPTY STATE ───
  if (!identity) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Teacher Not Found</Text>
        <Text style={styles.emptyText}>This teacher profile does not exist or you do not have access.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const teacher = identity.teacher;
  const institution = teacher?.institution;

  // ─── HANDLE CHECK IN/OUT ───
  const handleCheckInOut = async (action: 'check_in' | 'check_out') => {
    try {
      setCheckingIn(true);
      if (action === 'check_in') await recordCheckIn();
      else await recordCheckOut();
      Alert.alert('Success', action === 'check_in' ? 'Checked in successfully' : 'Checked out successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record attendance');
    } finally {
      setCheckingIn(false);
    }
  };

  // ─── MAIN RENDER ───
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#2563EB']} />
      }
    >
      {/* ─── HEADER CARD ─── */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{teacher?.full_name?.charAt(0) || '?'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: teacher?.is_active ? '#10B981' : '#EF4444' }]}>
            <Text style={styles.statusBadgeText}>{teacher?.is_active ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.name}>{teacher?.full_name}</Text>
          <Text style={styles.tscNumber}>TSC: {teacher?.tsc_number || 'Not registered'}</Text>
          <Text style={styles.institution}>{institution?.name}</Text>
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{teacher?.employment_type?.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.badge, styles.badgeSecondary]}>
              <Text style={[styles.badgeText, styles.badgeTextSecondary]}>{identity.access_level}</Text>
            </View>
          </View>
        </View>

        {(isOwner || isAdmin) && (
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => router.push(`/education/teacher-identity-card?teacherId=${teacherId}` as any)}
          >
            <Ionicons name="qr-code" size={24} color="#2563EB" />
            <Text style={styles.qrButtonText}>ID Card</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── QUICK STATS ─── */}
      <View style={styles.statsRow}>
        <StatBox icon="book-open" label="Subjects" value={teacher?.subjects_taught?.length || 0} />
        <StatBox icon="people" label="Classes" value={teacher?.classes_assigned?.length || 0} />
        <StatBox icon="time" label="Experience" value={`${teacher?.years_experience || 0}y`} />
        <StatBox icon="star" label="Rating" value={identity.average_rating?.toFixed(1) || '0.0'} />
      </View>

      {/* ─── CHECK IN/OUT (Owner only) ─── */}
      {isOwner && (
        <View style={styles.checkInSection}>
          <TouchableOpacity
            style={[styles.checkInButton, checkingIn && styles.checkInButtonDisabled]}
            onPress={() => handleCheckInOut('check_in')}
            disabled={checkingIn}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFF" />
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkOutButton, checkingIn && styles.checkInButtonDisabled]}
            onPress={() => handleCheckInOut('check_out')}
            disabled={checkingIn}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFF" />
            <Text style={styles.checkOutButtonText}>Check Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── LAST ACTIVITY ─── */}
      {(identity.last_check_in || identity.last_check_out) && (
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          {identity.last_check_in && (
            <View style={styles.activityRow}>
              <Ionicons name="log-in" size={16} color="#10B981" />
              <Text style={styles.activityText}>Last check-in: {new Date(identity.last_check_in).toLocaleString()}</Text>
            </View>
          )}
          {identity.last_check_out && (
            <View style={styles.activityRow}>
              <Ionicons name="log-out" size={16} color="#EF4444" />
              <Text style={styles.activityText}>Last check-out: {new Date(identity.last_check_out).toLocaleString()}</Text>
            </View>
          )}
        </View>
      )}

      {/* ─── TABS ─── */}
      <View style={styles.tabBar}>
        {(['overview', 'professional', 'performance', 'economy'] as const).map((tab: any) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── TAB CONTENT ─── */}
      {activeTab === 'overview' && <OverviewTab identity={identity} teacher={teacher} />}
      {activeTab === 'professional' && <ProfessionalTab identity={identity} teacher={teacher} />}
      {activeTab === 'performance' && <PerformanceTab identity={identity} />}
      {activeTab === 'economy' && <EconomyTab identity={identity} />}

      {/* ─── ACTION BUTTONS ─── */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/education/messages?to=${teacher?.user_id}` as any)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#2563EB" />
          <Text style={styles.actionButtonText}>Send Message</Text>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => router.push(`/education/teacher-identity-card?teacherId=${teacherId}` as any)}
          >
            <Ionicons name="id-card-outline" size={20} color="#7C3AED" />
            <Text style={[styles.actionButtonText, { color: '#7C3AED' }]}>View ID Card</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

// ─── SUB-COMPONENTS ───

function StatBox({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon as any} size={20} color="#2563EB" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OverviewTab({ identity, teacher }: { identity: any; teacher: any }) {
  return (
    <View style={styles.tabContent}>
      <InfoCard title="Basic Information" icon="person">
        <InfoRow label="Full Name" value={teacher?.full_name} />
        <InfoRow label="TSC Number" value={teacher?.tsc_number} />
        <InfoRow label="License Number" value={teacher?.license_number} />
        <InfoRow label="ID Number" value={teacher?.id_number} />
        <InfoRow label="Phone" value={teacher?.phone} />
        <InfoRow label="Email" value={teacher?.email} />
        <InfoRow label="Employment Type" value={teacher?.employment_type?.replace('_', ' ')} />
        <InfoRow label="Joined" value={teacher?.joined_at ? new Date(teacher.joined_at).toLocaleDateString() : '-'} />
      </InfoCard>

      <InfoCard title="Teaching Assignment" icon="school">
        <InfoRow label="Subjects" value={teacher?.subjects_taught?.join(', ') || 'Not assigned'} />
        <InfoRow label="Classes" value={teacher?.classes_assigned?.join(', ') || 'Not assigned'} />
        <InfoRow label="Class Teacher" value={teacher?.is_class_teacher ? 'Yes' : 'No'} />
        <InfoRow label="Specialization" value={teacher?.specialization?.join(', ') || 'Not set'} />
      </InfoCard>

      <InfoCard title="Identity Card" icon="card">
        <InfoRow label="Card Number" value={identity.card_number || 'Not issued'} />
        <InfoRow label="Card Status" value={identity.card_status?.toUpperCase()} />
        <InfoRow label="Access Level" value={identity.access_level?.toUpperCase()} />
        <InfoRow label="Biometric Enrolled" value={identity.biometric_enrolled ? 'Yes' : 'No'} />
      </InfoCard>
    </View>
  );
}

function ProfessionalTab({ identity, teacher }: { identity: any; teacher: any }) {
  const quals = teacher?.qualifications || [];
  const pubs = identity.publications || [];
  const awards = identity.awards || [];
  const memberships = identity.professional_memberships || [];
  const conferences = identity.conferences || [];

  return (
    <View style={styles.tabContent}>
      {identity.professional_bio && (
        <InfoCard title="Professional Bio" icon="document-text">
          <Text style={styles.bioText}>{identity.professional_bio}</Text>
        </InfoCard>
      )}

      <InfoCard title="Qualifications" icon="school">
        {quals.length === 0 ? (
          <Text style={styles.emptyTabText}>No qualifications recorded.</Text>
        ) : (
          quals.map((q: any, i: number) => (
            <View key={i} style={styles.qualRow}>
              <MaterialCommunityIcons name="certificate" size={18} color="#2563EB" />
              <View style={styles.qualInfo}>
                <Text style={styles.qualDegree}>{q.degree}</Text>
                <Text style={styles.qualMeta}>{q.institution} • {q.year}</Text>
              </View>
            </View>
          ))
        )}
      </InfoCard>

      <InfoCard title="Publications" icon="book">
        {pubs.length === 0 ? (
          <Text style={styles.emptyTabText}>No publications recorded.</Text>
        ) : (
          pubs.map((pub: any, i: number) => (
            <View key={i} style={styles.pubRow}>
              <Ionicons name="document-text" size={18} color="#7C3AED" />
              <View style={styles.pubInfo}>
                <Text style={styles.pubTitle}>{pub.title}</Text>
                <Text style={styles.pubMeta}>{pub.journal} • {pub.year}</Text>
              </View>
            </View>
          ))
        )}
      </InfoCard>

      <InfoCard title="Awards & Recognition" icon="trophy">
        {awards.length === 0 ? (
          <Text style={styles.emptyTabText}>No awards recorded.</Text>
        ) : (
          awards.map((award: any, i: number) => (
            <View key={i} style={styles.awardRow}>
              <Ionicons name="medal" size={18} color="#F59E0B" />
              <View style={styles.awardInfo}>
                <Text style={styles.awardTitle}>{award.title}</Text>
                <Text style={styles.awardMeta}>{award.issuer} • {award.year}</Text>
                {award.description && <Text style={styles.awardDesc}>{award.description}</Text>}
              </View>
            </View>
          ))
        )}
      </InfoCard>

      <InfoCard title="Professional Memberships" icon="people-circle">
        {memberships.length === 0 ? (
          <Text style={styles.emptyTabText}>No memberships recorded.</Text>
        ) : (
          memberships.map((m: any, i: number) => (
            <View key={i} style={styles.memberRow}>
              <Ionicons name="business" size={18} color="#059669" />
              <View style={styles.memberInfo}>
                <Text style={styles.memberOrg}>{m.organization}</Text>
                <Text style={styles.memberMeta}>ID: {m.membership_id} • Since {m.since}</Text>
              </View>
            </View>
          ))
        )}
      </InfoCard>

      <InfoCard title="Conferences" icon="mic">
        {conferences.length === 0 ? (
          <Text style={styles.emptyTabText}>No conferences recorded.</Text>
        ) : (
          conferences.map((c: any, i: number) => (
            <View key={i} style={styles.confRow}>
              <Ionicons name="megaphone" size={18} color="#DC2626" />
              <View style={styles.confInfo}>
                <Text style={styles.confName}>{c.name}</Text>
                <Text style={styles.confMeta}>{c.location} • {c.year} • {c.role}</Text>
              </View>
            </View>
          ))
        )}
      </InfoCard>
    </View>
  );
}

function PerformanceTab({ identity }: { identity: any }) {
  const metrics = [
    { label: 'Attendance Rate', value: identity.attendance_rate, icon: 'calendar', color: '#10B981' },
    { label: 'Punctuality', value: identity.punctuality_rate, icon: 'time', color: '#2563EB' },
    { label: 'Student Progress', value: identity.student_progress_rate, icon: 'trending-up', color: '#7C3AED' },
    { label: 'Parent Satisfaction', value: identity.parent_satisfaction_rate, icon: 'happy', color: '#F59E0B' },
    { label: 'Peer Review', value: identity.peer_review_score, icon: 'people', color: '#DC2626' },
  ];

  return (
    <View style={styles.tabContent}>
      <InfoCard title="Performance Metrics" icon="analytics">
        {metrics.map((m, i) => (
          <View key={i} style={styles.metricRow}>
            <View style={styles.metricHeader}>
              <Ionicons name={m.icon as any} size={18} color={m.color} />
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={[styles.metricValue, { color: m.color }]}>{m.value?.toFixed(1) || '0.0'}%</Text>
            </View>
            <View style={styles.metricBarBg}>
              <View style={[styles.metricBar, { width: `${Math.min(m.value || 0, 100)}%`, backgroundColor: m.color }]} />
            </View>
          </View>
        ))}
      </InfoCard>

      <InfoCard title="Teaching Impact" icon="stats-chart">
        <InfoRow label="Total Lessons Delivered" value={identity.total_lessons_delivered?.toString() || '0'} />
        <InfoRow label="Total Students Taught" value={identity.total_students_taught?.toString() || '0'} />
        <InfoRow label="Total Reviews" value={identity.total_reviews?.toString() || '0'} />
        <InfoRow label="Average Rating" value={`${identity.average_rating?.toFixed(1) || '0.0'} / 5.0`} />
      </InfoCard>
    </View>
  );
}

function EconomyTab({ identity }: { identity: any }) {
  return (
    <View style={styles.tabContent}>
      <InfoCard title="Revenue Dashboard" icon="wallet">
        <View style={styles.revenueRow}>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueAmount}>KES {identity.revenue_earned?.toLocaleString() || '0'}</Text>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
          </View>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueAmount}>KES {identity.wallet_balance?.toLocaleString() || '0'}</Text>
            <Text style={styles.revenueLabel}>Wallet Balance</Text>
          </View>
        </View>
      </InfoCard>

      <InfoCard title="Content Stats" icon="videocam">
        <InfoRow label="Published Content" value={identity.content_count?.toString() || '0'} />
        <InfoRow label="Total Subscribers" value="Coming soon" />
        <InfoRow label="MTAA TV Views" value="Coming soon" />
      </InfoCard>

      <TouchableOpacity style={styles.studioButton} onPress={() => Alert.alert('Teacher Studio', 'Navigate to content studio')}>
        <Ionicons name="create-outline" size={20} color="#FFF" />
        <Text style={styles.studioButtonText}>Open Content Studio</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── HELPERS ───

function InfoCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoCardHeader}>
        <Ionicons name={icon as any} size={18} color="#2563EB" />
        <Text style={styles.infoCardTitle}>{title}</Text>
      </View>
      <View style={styles.infoCardBody}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#1F2937' },
  errorText: { marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptyText: { marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' },
  retryButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#2563EB', borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  headerCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', marginBottom: 8 },
  avatarContainer: { position: 'relative', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#2563EB' },
  statusBadge: { position: 'absolute', bottom: -4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  statusBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFF' },
  headerInfo: { flex: 1, marginLeft: 12 },
  name: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  tscNumber: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  institution: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  badgesRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#DBEAFE', borderRadius: 4 },
  badgeSecondary: { backgroundColor: '#EDE9FE' },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#2563EB' },
  badgeTextSecondary: { color: '#7C3AED' },
  qrButton: { alignItems: 'center', padding: 8 },
  qrButtonText: { fontSize: 11, color: '#2563EB', marginTop: 4 },

  statsRow: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', marginBottom: 8, justifyContent: 'space-around' },
  statBox: { alignItems: 'center', padding: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  checkInSection: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', marginBottom: 8, gap: 10 },
  checkInButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#10B981', borderRadius: 8 },
  checkOutButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#EF4444', borderRadius: 8 },
  checkInButtonDisabled: { opacity: 0.5 },
  checkInButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  checkOutButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  activityCard: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  activityTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  activityText: { fontSize: 13, color: '#6B7280' },

  tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2563EB' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#2563EB', fontWeight: '600' },

  tabContent: { padding: 16 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoCardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  infoCardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#6B7280', flex: 1 },
  infoValue: { fontSize: 13, color: '#1F2937', fontWeight: '500', flex: 1, textAlign: 'right' },

  emptyTabText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },
  bioText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },

  qualRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  qualInfo: { flex: 1 },
  qualDegree: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  qualMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  pubRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  pubInfo: { flex: 1 },
  pubTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  pubMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  awardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  awardInfo: { flex: 1 },
  awardTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  awardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  awardDesc: { fontSize: 12, color: '#6B7280', marginTop: 2, fontStyle: 'italic' },

  memberRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  memberInfo: { flex: 1 },
  memberOrg: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  memberMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  confRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  confInfo: { flex: 1 },
  confName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  confMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  metricRow: { paddingVertical: 10 },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  metricLabel: { flex: 1, fontSize: 13, color: '#4B5563' },
  metricValue: { fontSize: 14, fontWeight: '700' },
  metricBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  metricBar: { height: '100%', borderRadius: 4 },

  revenueRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  revenueItem: { alignItems: 'center' },
  revenueAmount: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  revenueLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },

  studioButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#7C3AED', borderRadius: 12, marginTop: 8 },
  studioButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  actionSection: { flexDirection: 'row', padding: 16, gap: 10, marginBottom: 24 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: '#DBEAFE', borderRadius: 10 },
  actionButtonSecondary: { backgroundColor: '#EDE9FE' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
});
