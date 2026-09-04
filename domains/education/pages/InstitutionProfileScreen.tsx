import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useInstitutionProfile } from '@/domains/education/hooks/useInstitutionProfile';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function InstitutionProfileScreen() {
  const { institutionId } = useLocalSearchParams<{ institutionId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading, error, refreshing, refresh, isAdmin, verificationStatus } = useInstitutionProfile(institutionId);
  const [activeTab, setActiveTab] = useState<'overview' | 'facilities' | 'staff' | 'performance' | 'safety'>('overview');

  // ─── LOADING STATE ───
  if (loading && !profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading institution profile...</Text>
      </View>
    );
  }

  // ─── ERROR STATE ───
  if (error && !profile) {
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
  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="business-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Institution Not Found</Text>
        <Text style={styles.emptyText}>This institution profile does not exist or you do not have access.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const institution = profile.institution;

  // ─── MAIN RENDER ───
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#2563EB']} />
      }
    >
      {/* ─── COVER HEADER ─── */}
      <View style={styles.coverContainer}>
        {institution?.cover_image_url ? (
          <Image source={{ uri: institution.cover_image_url }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="school" size={48} color="#93C5FD" />
          </View>
        )}
        <View style={styles.coverOverlay} />

        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            {institution?.logo_url ? (
              <Image source={{ uri: institution.logo_url }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>{institution?.name?.charAt(0)}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.institutionName}>{institution?.name}</Text>
            <Text style={styles.institutionType}>{institution?.type?.toUpperCase()} • {institution?.category?.toUpperCase()}</Text>
            <View style={styles.verificationBadge}>
              <View style={[styles.verificationDot, {
                backgroundColor: verificationStatus === 'verified' ? '#10B981' :
                  verificationStatus === 'rejected' ? '#EF4444' : '#F59E0B'
              }]} />
              <Text style={[styles.verificationText, {
                color: verificationStatus === 'verified' ? '#059669' :
                  verificationStatus === 'rejected' ? '#DC2626' : '#D97706'
              }]}>
                {verificationStatus?.toUpperCase() || 'UNVERIFIED'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── QUICK STATS ─── */}
      <View style={styles.statsRow}>
        <StatBox icon="people" label="Capacity" value={institution?.capacity || '-'} />
        <StatBox icon="layers" label="Levels" value={institution?.levels_offered?.length || 0} />
        <StatBox icon="male-female" label="Gender" value={institution?.mixed_gender ? 'Mixed' : 'Single'} />
        <StatBox icon="bed" label="Boarding" value={institution?.boarding ? 'Yes' : 'No'} />
      </View>

      {/* ─── VERIFICATION ALERT ─── */}
      {verificationStatus !== 'verified' && (
        <TouchableOpacity
          style={[styles.verificationAlert, {
            backgroundColor: verificationStatus === 'rejected' ? '#FEE2E2' : '#FEF3C7'
          }]}
          onPress={() => router.push(`/education/verification-workflow?institutionId=${institutionId}` as any)}
        >
          <Ionicons
            name={verificationStatus === 'rejected' ? 'close-circle' : 'time'}
            size={20}
            color={verificationStatus === 'rejected' ? '#DC2626' : '#D97706'}
          />
          <View style={styles.verificationAlertContent}>
            <Text style={[styles.verificationAlertTitle, {
              color: verificationStatus === 'rejected' ? '#DC2626' : '#D97706'
            }]}>
              {verificationStatus === 'rejected' ? 'Verification Rejected' : 'Verification Pending'}
            </Text>
            <Text style={styles.verificationAlertText}>
              {verificationStatus === 'rejected'
                ? 'Your institution was rejected. Tap to view details and reapply.'
                : 'Complete verification to unlock all features. Tap to continue.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      {/* ─── TABS ─── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll}>
        <View style={styles.tabBar}>
          {(['overview', 'facilities', 'staff', 'performance', 'safety'] as const).map((tab: any) => (
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
      </ScrollView>

      {/* ─── TAB CONTENT ─── */}
      {activeTab === 'overview' && <OverviewTab profile={profile} institution={institution} />}
      {activeTab === 'facilities' && <FacilitiesTab profile={profile} />}
      {activeTab === 'staff' && <StaffTab profile={profile} />}
      {activeTab === 'performance' && <PerformanceTab profile={profile} />}
      {activeTab === 'safety' && <SafetyTab profile={profile} />}

      {/* ─── CONTACT ACTIONS ─── */}
      <View style={styles.actionSection}>
        {institution?.phone && (
          <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(`tel:${institution.phone}`)}>
            <Ionicons name="call-outline" size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
        )}
        {institution?.email && (
          <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(`mailto:${institution.email}`)}>
            <Ionicons name="mail-outline" size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
        )}
        {institution?.website && (
          <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(institution.website)}>
            <Ionicons name="globe-outline" size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>Website</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── ADMIN ACTIONS ─── */}
      {isAdmin && (
        <View style={styles.adminSection}>
          <Text style={styles.adminTitle}>Administration</Text>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push(`/education/verification-workflow?institutionId=${institutionId}` as any)}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#7C3AED" />
            <Text style={styles.adminButtonText}>Verification Workflow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push(`/education/teachers?institutionId=${institutionId}` as any)}
          >
            <Ionicons name="people-outline" size={20} color="#7C3AED" />
            <Text style={styles.adminButtonText}>Manage Teachers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push(`/education/payroll?institutionId=${institutionId}` as any)}
          >
            <Ionicons name="cash-outline" size={20} color="#7C3AED" />
            <Text style={styles.adminButtonText}>Payroll</Text>
          </TouchableOpacity>
        </View>
      )}
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

function OverviewTab({ profile, institution }: { profile: any; institution: any }) {
  return (
    <View style={styles.tabContent}>
      {(profile.motto || profile.vision || profile.mission) && (
        <InfoCard title="About" icon="information-circle">
          {profile.motto && <Text style={styles.mottoText}>"{profile.motto}"</Text>}
          {profile.vision && (
            <>
              <Text style={styles.sectionLabel}>Vision</Text>
              <Text style={styles.sectionText}>{profile.vision}</Text>
            </>
          )}
          {profile.mission && (
            <>
              <Text style={styles.sectionLabel}>Mission</Text>
              <Text style={styles.sectionText}>{profile.mission}</Text>
            </>
          )}
        </InfoCard>
      )}

      <InfoCard title="Basic Information" icon="school">
        <InfoRow label="Registration Number" value={institution?.registration_number} />
        <InfoRow label="KRA PIN" value={institution?.kra_pin} />
        <InfoRow label="Founded" value={profile.founding_year?.toString()} />
        <InfoRow label="Founder" value={profile.founder_name} />
        <InfoRow label="Ministry Approved" value={institution?.ministry_approved ? 'Yes' : 'No'} />
        {institution?.approved_at && (
          <InfoRow label="Approved On" value={new Date(institution.approved_at).toLocaleDateString()} />
        )}
      </InfoCard>

      <InfoCard title="Location" icon="location">
        <InfoRow label="Address" value={institution?.address} />
        <InfoRow label="City" value={institution?.city} />
        <InfoRow label="County" value={institution?.county} />
        <InfoRow label="Sub-County" value={institution?.sub_county} />
        <InfoRow label="Ward" value={institution?.ward} />
      </InfoCard>

      <InfoCard title="Contact" icon="call">
        <InfoRow label="Phone" value={institution?.phone} />
        <InfoRow label="Email" value={institution?.email} />
        <InfoRow label="Website" value={institution?.website} />
        <InfoRow label="Head Teacher" value={institution?.head_teacher_name} />
        <InfoRow label="Head Phone" value={institution?.head_teacher_phone} />
      </InfoCard>

      <InfoCard title="Settings" icon="settings">
        <InfoRow label="Boarding" value={institution?.boarding ? 'Yes' : 'No'} />
        <InfoRow label="Day School" value={institution?.day_school ? 'Yes' : 'No'} />
        <InfoRow label="Mixed Gender" value={institution?.mixed_gender ? 'Yes' : 'No'} />
        <InfoRow label="Levels Offered" value={institution?.levels_offered?.join(', ') || 'Not set'} />
      </InfoCard>
    </View>
  );
}

function FacilitiesTab({ profile }: { profile: any }) {
  const facilities = profile.facilities || [];
  const labs = profile.labs || [];

  return (
    <View style={styles.tabContent}>
      <InfoCard title="Infrastructure" icon="business">
        <InfoRow label="Internet Available" value={profile.internet_available ? 'Yes' : 'No'} />
        <InfoRow label="Electricity Source" value={profile.electricity_source} />
        <InfoRow label="Water Source" value={profile.water_source} />
        <InfoRow label="Library Books" value={profile.library_books?.toLocaleString()} />
        <InfoRow label="Computers" value={profile.computer_count?.toString()} />
      </InfoCard>

      <InfoCard title="Facilities" icon="cube">
        {facilities.length === 0 ? (
          <Text style={styles.emptyTabText}>No facilities recorded.</Text>
        ) : (
          facilities.map((f: any, i: number) => (
            <View key={i} style={styles.facilityRow}>
              <Ionicons name="cube-outline" size={18} color="#2563EB" />
              <View style={styles.facilityInfo}>
                <Text style={styles.facilityName}>{f.name}</Text>
                <Text style={styles.facilityMeta}>{f.type} • Capacity: {f.capacity} • {f.condition}</Text>
              </View>
            </View>
          ))
        )}
      </InfoCard>

      <InfoCard title="Laboratories" icon="flask">
        {labs.length === 0 ? (
          <Text style={styles.emptyTabText}>No labs recorded.</Text>
        ) : (
          labs.map((lab: any, i: number) => (
            <View key={i} style={styles.labRow}>
              <Ionicons name="flask-outline" size={18} color="#7C3AED" />
              <View style={styles.labInfo}>
                <Text style={styles.labName}>{lab.subject}</Text>
                <Text style={styles.labMeta}>Equipment: {lab.equipment_count} • {lab.status}</Text>
              </View>
            </View>
          ))
        )}
      </InfoCard>
    </View>
  );
}

function StaffTab({ profile }: { profile: any }) {
  const vacancies = profile.vacancies || [];
  const board = profile.board_members || [];

  return (
    <View style={styles.tabContent}>
      <InfoCard title="Staffing Overview" icon="people">
        <InfoRow label="Total Teachers" value={profile.total_teachers?.toString()} />
        <InfoRow label="Support Staff" value={profile.total_support_staff?.toString()} />
        <InfoRow label="Teacher-Student Ratio" value={profile.teacher_student_ratio} />
      </InfoCard>

      <InfoCard title="Vacancies" icon="briefcase">
        {vacancies.length === 0 ? (
          <Text style={styles.emptyTabText}>No vacancies posted.</Text>
        ) : (
          vacancies.map((v: any, i: number) => (
            <View key={i} style={styles.vacancyRow}>
              <View style={styles.vacancyInfo}>
                <Text style={styles.vacancyPosition}>{v.position}</Text>
                <Text style={styles.vacancyMeta}>{v.subject} • Deadline: {v.deadline}</Text>
              </View>
              <TouchableOpacity style={styles.applyButton} onPress={() => Alert.alert('Apply', 'Application flow coming soon')}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </InfoCard>

      <InfoCard title="Board Members" icon="people-circle">
        {board.length === 0 ? (
          <Text style={styles.emptyTabText}>No board members recorded.</Text>
        ) : (
          board.map((member: any, i: number) => (
            <View key={i} style={styles.boardRow}>
              <Ionicons name="person-circle" size={20} color="#6B7280" />
              <View style={styles.boardInfo}>
                <Text style={styles.boardName}>{member.name}</Text>
                <Text style={styles.boardMeta}>{member.role} • Since {member.since}</Text>
              </View>
            </View>
          ))
        )}
      </InfoCard>

      <InfoCard title="PTA" icon="hand-left">
        <InfoRow label="Active" value={profile.pta_active ? 'Yes' : 'No'} />
        <InfoRow label="Chair Name" value={profile.pta_chair_name} />
        <InfoRow label="Chair Phone" value={profile.pta_chair_phone} />
      </InfoCard>
    </View>
  );
}

function PerformanceTab({ profile }: { profile: any }) {
  return (
    <View style={styles.tabContent}>
      <InfoCard title="Rankings" icon="trophy">
        <InfoRow label="National Ranking" value={profile.national_ranking ? `#${profile.national_ranking}` : 'Not ranked'} />
        <InfoRow label="County Ranking" value={profile.county_ranking ? `#${profile.county_ranking}` : 'Not ranked'} />
      </InfoCard>

      <InfoCard title="Academic Performance" icon="trending-up">
        <InfoRow label="Mean Score (Last Exam)" value={profile.mean_score_last_exam?.toFixed(2) || '-'} />
        <InfoRow label="Pass Rate" value={`${profile.pass_rate?.toFixed(1) || 0}%`} />
        <InfoRow label="Transition Rate" value={`${profile.transition_rate?.toFixed(1) || 0}%`} />
      </InfoCard>

      <InfoCard title="Fee Structure" icon="cash">
        {profile.fee_structure?.length === 0 ? (
          <Text style={styles.emptyTabText}>No fee structure set.</Text>
        ) : (
          profile.fee_structure.map((fee: any, i: number) => (
            <View key={i} style={styles.feeRow}>
              <Text style={styles.feeLevel}>{fee.level}</Text>
              <Text style={styles.feeAmount}>KES {fee.amount?.toLocaleString()}</Text>
              {fee.breakdown && <Text style={styles.feeBreakdown}>{fee.breakdown}</Text>}
            </View>
          ))
        )}
      </InfoCard>
    </View>
  );
}

function SafetyTab({ profile }: { profile: any }) {
  return (
    <View style={styles.tabContent}>
      <InfoCard title="Safety Infrastructure" icon="shield-checkmark">
        <InfoRow label="Perimeter Wall" value={profile.has_perimeter_wall ? 'Yes' : 'No'} />
        <InfoRow label="Security Guard" value={profile.has_security_guard ? 'Yes' : 'No'} />
        <InfoRow label="CCTV" value={profile.has_cctv ? 'Yes' : 'No'} />
        <InfoRow label="Fire Extinguishers" value={profile.has_fire_extinguisher ? 'Yes' : 'No'} />
        <InfoRow label="First Aid Kit" value={profile.has_first_aid_kit ? 'Yes' : 'No'} />
        <InfoRow label="Emergency Exits" value={profile.emergency_exits?.toString() || '0'} />
        <InfoRow label="Assembly Point" value={profile.assembly_point} />
      </InfoCard>
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

  coverContainer: { height: 200, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  headerContent: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-end', padding: 16 },
  logoContainer: { marginRight: 12 },
  logo: { width: 64, height: 64, borderRadius: 12, borderWidth: 3, borderColor: '#FFF' },
  logoPlaceholder: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  logoText: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  headerInfo: { flex: 1, marginBottom: 4 },
  institutionName: { fontSize: 18, fontWeight: '700', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  institutionType: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  verificationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8 },
  verificationDot: { width: 8, height: 8, borderRadius: 4 },
  verificationText: { fontSize: 10, fontWeight: '700' },

  statsRow: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', marginBottom: 8, justifyContent: 'space-around' },
  statBox: { alignItems: 'center', padding: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  verificationAlert: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 10, gap: 10 },
  verificationAlertContent: { flex: 1 },
  verificationAlertTitle: { fontSize: 14, fontWeight: '700' },
  verificationAlertText: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  tabBarScroll: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 10 },
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

  mottoText: { fontSize: 16, fontStyle: 'italic', color: '#4B5563', marginBottom: 12, textAlign: 'center' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#2563EB', marginTop: 8, textTransform: 'uppercase' },
  sectionText: { fontSize: 13, color: '#4B5563', marginTop: 4, lineHeight: 18 },

  emptyTabText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },

  facilityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  facilityInfo: { flex: 1 },
  facilityName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  facilityMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  labRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  labInfo: { flex: 1 },
  labName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  labMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  vacancyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  vacancyInfo: { flex: 1 },
  vacancyPosition: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  vacancyMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  applyButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#DBEAFE', borderRadius: 6 },
  applyButtonText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },

  boardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  boardInfo: { flex: 1 },
  boardName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  boardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  feeRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  feeLevel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  feeAmount: { fontSize: 16, fontWeight: '700', color: '#2563EB', marginTop: 2 },
  feeBreakdown: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  actionSection: { flexDirection: 'row', padding: 16, gap: 10, marginBottom: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: '#FFF', borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },

  adminSection: { backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 24, padding: 16, borderRadius: 12 },
  adminTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  adminButton: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  adminButtonText: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },
});
