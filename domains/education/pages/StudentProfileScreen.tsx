import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStudentIdentity } from '@/domains/education/hooks/useStudentIdentity';
import { StudentIdentityCard } from '@/domains/education/components/StudentIdentityCard';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function StudentProfileScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { identity, loading, error, refreshing, refresh, isOwner, isGuardian } = useStudentIdentity(studentId);
  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'safety' | 'guardians'>('overview');

  // ─── LOADING STATE ───
  if (loading && !identity) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading student profile...</Text>
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
        <Text style={styles.emptyTitle}>Student Not Found</Text>
        <Text style={styles.emptyText}>This student profile does not exist or you do not have access.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const student = identity.student;
  const institution = student?.institution;

  // ─── OFFLINE INDICATOR ───
  const isOffline = false; // Hook into network status if available

  // ─── MAIN RENDER ───
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#2563EB']} />
      }
    >
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#F59E0B" />
          <Text style={styles.offlineText}>You are offline. Showing cached data.</Text>
        </View>
      )}

      {/* ─── HEADER CARD ─── */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{student?.full_name?.charAt(0) || '?'}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: student?.enrollment_status === 'active' ? '#10B981' : '#EF4444' }]} />
          </View>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.name}>{student?.full_name}</Text>
          <Text style={styles.admission}>Adm: {student?.admission_number}</Text>
          <Text style={styles.institution}>{institution?.name}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{student?.current_level} {student?.stream}</Text>
          </View>
        </View>

        {(isOwner || isGuardian) && (
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => router.push(`/education/identity-card?studentId=${studentId}` as any)}
          >
            <Ionicons name="qr-code" size={24} color="#2563EB" />
            <Text style={styles.qrButtonText}>ID Card</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── SAFETY ALERT ─── */}
      {identity.safety_status !== 'safe' && (
        <View style={[styles.alertBanner, { backgroundColor: identity.safety_status === 'missing' ? '#FEE2E2' : '#FEF3C7' }]}>
          <Ionicons
            name={identity.safety_status === 'missing' ? 'warning' : 'alert'}
            size={20}
            color={identity.safety_status === 'missing' ? '#DC2626' : '#D97706'}
          />
          <Text style={[styles.alertText, { color: identity.safety_status === 'missing' ? '#DC2626' : '#D97706' }]}>
            Safety Status: {identity.safety_status?.toUpperCase()}
          </Text>
          {identity.last_location?.lat && (
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => {
                // Open map with location
                Alert.alert('Location', `Lat: ${identity.last_location.lat}, Lng: ${identity.last_location.lng}`);
              }}
            >
              <Ionicons name="location" size={16} color="#2563EB" />
              <Text style={styles.locationText}>View Location</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─── TABS ─── */}
      <View style={styles.tabBar}>
        {(['overview', 'academic', 'safety', 'guardians'] as const).map((tab: any) => (
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
      {activeTab === 'overview' && <OverviewTab identity={identity} />}
      {activeTab === 'academic' && <AcademicTab identity={identity} />}
      {activeTab === 'safety' && <SafetyTab identity={identity} studentId={studentId} />}
      {activeTab === 'guardians' && <GuardiansTab identity={identity} />}

      {/* ─── ACTION BUTTONS ─── */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/education/messages?to=${identity.primary_guardian_id || student?.user_id}` as any)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#2563EB" />
          <Text style={styles.actionButtonText}>Send Message</Text>
        </TouchableOpacity>

        {(isOwner || isGuardian) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => router.push(`/education/identity-card?studentId=${studentId}` as any)}
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

function OverviewTab({ identity }: { identity: any }) {
  const student = identity.student;

  return (
    <View style={styles.tabContent}>
      <InfoCard title="Basic Information" icon="person">
        <InfoRow label="Full Name" value={student?.full_name} />
        <InfoRow label="Admission Number" value={student?.admission_number} />
        <InfoRow label="Date of Birth" value={student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not set'} />
        <InfoRow label="Gender" value={student?.gender?.charAt(0).toUpperCase() + student?.gender?.slice(1)} />
        <InfoRow label="Enrollment Status" value={student?.enrollment_status?.toUpperCase()} />
        <InfoRow label="Enrolled Since" value={student?.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString() : '-'} />
      </InfoCard>

      <InfoCard title="Institution" icon="school">
        <InfoRow label="School" value={student?.institution?.name} />
        <InfoRow label="Type" value={student?.institution?.type?.toUpperCase()} />
        <InfoRow label="Current Level" value={student?.current_level} />
        <InfoRow label="Stream" value={student?.stream || 'Not assigned'} />
      </InfoCard>

      <InfoCard title="Identity Card" icon="card">
        <InfoRow label="Card Number" value={identity.card_number || 'Not issued'} />
        <InfoRow label="Card Status" value={identity.card_status?.toUpperCase()} />
        <InfoRow label="Issued" value={identity.card_issued_at ? new Date(identity.card_issued_at).toLocaleDateString() : '-'} />
        <InfoRow label="Expires" value={identity.card_expires_at ? new Date(identity.card_expires_at).toLocaleDateString() : 'No expiry'} />
      </InfoCard>

      {identity.medical_conditions?.length > 0 && (
        <InfoCard title="Medical Information" icon="medical" alert>
          {identity.medical_conditions.map((condition: any, i: number) => (
            <View key={i} style={styles.medicalRow}>
              <Text style={styles.medicalCondition}>{condition.condition}</Text>
              <Text style={styles.medicalSeverity}>{condition.severity}</Text>
              {condition.notes && <Text style={styles.medicalNotes}>{condition.notes}</Text>}
            </View>
          ))}
        </InfoCard>
      )}
    </View>
  );
}

function AcademicTab({ identity }: { identity: any }) {
  const history = identity.academic_history || [];
  const achievements = identity.achievements || [];
  const certificates = identity.certificates || [];

  return (
    <View style={styles.tabContent}>
      <InfoCard title="Academic History" icon="trending-up">
        {history.length === 0 ? (
          <Text style={styles.emptyTabText}>No academic history recorded yet.</Text>
        ) : (
          history.map((term: any, i: number) => (
            <View key={i} style={styles.historyRow}>
              <View style={styles.historyTerm}>
                <Text style={styles.historyTermText}>{term.term}</Text>
                <Text style={styles.historyClass}>{term.class}</Text>
              </View>
              <View style={styles.historyScores}>
                <Text style={styles.historyAverage}>{term.average}%</Text>
                <Text style={styles.historyRank}>Rank: {term.rank}</Text>
              </View>
              {term.remarks && <Text style={styles.historyRemarks}>{term.remarks}</Text>}
            </View>
          ))
        )}
      </InfoCard>

      <InfoCard title="Achievements" icon="trophy">
        {achievements.length === 0 ? (
          <Text style={styles.emptyTabText}>No achievements recorded yet.</Text>
        ) : (
          achievements.map((ach: any, i: number) => (
            <View key={i} style={styles.achievementRow}>
              <MaterialCommunityIcons name="medal" size={20} color="#F59E0B" />
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{ach.title}</Text>
                <Text style={styles.achievementMeta}>{ach.category} • {new Date(ach.date).toLocaleDateString()}</Text>
                {ach.description && <Text style={styles.achievementDesc}>{ach.description}</Text>}
              </View>
            </View>
          ))
        )}
      </InfoCard>

      <InfoCard title="Certificates" icon="document-text">
        {certificates.length === 0 ? (
          <Text style={styles.emptyTabText}>No certificates issued yet.</Text>
        ) : (
          certificates.map((cert: any, i: number) => (
            <View key={i} style={styles.certificateRow}>
              <Ionicons name="checkmark-circle" size={20} color={cert.verified ? '#10B981' : '#9CA3AF'} />
              <View style={styles.certificateInfo}>
                <Text style={styles.certificateTitle}>{cert.title}</Text>
                <Text style={styles.certificateMeta}>{cert.issuer} • {new Date(cert.date).toLocaleDateString()}</Text>
              </View>
              {cert.qr_url && (
                <TouchableOpacity onPress={() => Alert.alert('Certificate QR', cert.qr_url)}>
                  <Ionicons name="qr-code" size={20} color="#2563EB" />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </InfoCard>

      {identity.discipline_records?.length > 0 && (
        <InfoCard title="Discipline Records" icon="warning" alert>
          {identity.discipline_records.map((record: any, i: number) => (
            <View key={i} style={styles.disciplineRow}>
              <Text style={styles.disciplineDate}>{new Date(record.date).toLocaleDateString()}</Text>
              <Text style={styles.disciplineIncident}>{record.incident}</Text>
              <Text style={styles.disciplineAction}>Action: {record.action}</Text>
            </View>
          ))}
        </InfoCard>
      )}
    </View>
  );
}

function SafetyTab({ identity, studentId }: { identity: any; studentId: string }) {
  const logs = identity.entry_exit_logs || [];

  return (
    <View style={styles.tabContent}>
      <InfoCard title="Current Safety Status" icon="shield-check">
        <View style={styles.safetyStatusRow}>
          <View style={[styles.safetyDot, { backgroundColor: identity.safety_status === 'safe' ? '#10B981' : identity.safety_status === 'alert' ? '#F59E0B' : '#EF4444' }]} />
          <Text style={styles.safetyStatusText}>{identity.safety_status?.toUpperCase()}</Text>
        </View>
        {identity.last_location?.lat && (
          <InfoRow label="Last Known Location" value={`${identity.last_location.lat.toFixed(4)}, ${identity.last_location.lng.toFixed(4)}`} />
        )}
        {identity.last_location?.timestamp && (
          <InfoRow label="Location Updated" value={new Date(identity.last_location.timestamp).toLocaleString()} />
        )}
      </InfoCard>

      <InfoCard title="Entry / Exit Logs" icon="log-in">
        {logs.length === 0 ? (
          <Text style={styles.emptyTabText}>No entry/exit logs recorded.</Text>
        ) : (
          logs.slice(0, 20).map((log: any, i: number) => (
            <View key={i} style={styles.logRow}>
              <Ionicons
                name={log.direction === 'in' ? 'arrow-forward-circle' : 'arrow-back-circle'}
                size={20}
                color={log.direction === 'in' ? '#10B981' : '#EF4444'}
              />
              <View style={styles.logInfo}>
                <Text style={styles.logGate}>{log.gate}</Text>
                <Text style={styles.logMethod}>{log.method}</Text>
              </View>
              <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
            </View>
          ))
        )}
      </InfoCard>

      <InfoCard title="Transport" icon="bus">
        <InfoRow label="Route ID" value={identity.transport_route_id || 'Not assigned'} />
        <InfoRow label="Stop" value={identity.transport_stop || 'Not assigned'} />
      </InfoCard>
    </View>
  );
}

function GuardiansTab({ identity }: { identity: any }) {
  return (
    <View style={styles.tabContent}>
      <InfoCard title="Primary Guardian" icon="people">
        <InfoRow label="Name" value={identity.primary_guardian_name || 'Not set'} />
        <InfoRow label="Phone" value={identity.primary_guardian_phone || 'Not set'} />
        <InfoRow label="Relationship" value={identity.primary_guardian_relationship?.charAt(0).toUpperCase() + identity.primary_guardian_relationship?.slice(1) || 'Not set'} />
      </InfoCard>

      {identity.secondary_guardian_name && (
        <InfoCard title="Secondary Guardian" icon="people-outline">
          <InfoRow label="Name" value={identity.secondary_guardian_name} />
          <InfoRow label="Phone" value={identity.secondary_guardian_phone || 'Not set'} />
          <InfoRow label="Relationship" value={identity.secondary_guardian_relationship?.charAt(0).toUpperCase() + identity.secondary_guardian_relationship?.slice(1) || 'Not set'} />
        </InfoCard>
      )}

      <InfoCard title="Emergency Contact" icon="call">
        <InfoRow label="Name" value={identity.emergency_contact_name || 'Not set'} />
        <InfoRow label="Phone" value={identity.emergency_contact_phone || 'Not set'} />
        <InfoRow label="Relationship" value={identity.emergency_contact_relationship || 'Not set'} />
      </InfoCard>

      <InfoCard title="Medical Details" icon="fitness">
        <InfoRow label="Blood Group" value={identity.blood_group || 'Not set'} />
        <InfoRow
          label="Allergies"
          value={identity.allergies?.length > 0 ? identity.allergies.join(', ') : 'None recorded'}
        />
      </InfoCard>
    </View>
  );
}

// ─── HELPER COMPONENTS ───

function InfoCard({ title, icon, alert, children }: { title: string; icon: string; alert?: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.infoCard, alert && styles.infoCardAlert]}>
      <View style={styles.infoCardHeader}>
        <Ionicons name={icon as any} size={18} color={alert ? '#DC2626' : '#2563EB'} />
        <Text style={[styles.infoCardTitle, alert && { color: '#DC2626' }]}>{title}</Text>
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
  offlineBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, backgroundColor: '#FEF3C7', gap: 6 },
  offlineText: { fontSize: 12, color: '#D97706' },

  headerCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', marginBottom: 8 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#2563EB' },
  statusBadge: { position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  headerInfo: { flex: 1, marginLeft: 12 },
  name: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  admission: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  institution: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  levelBadge: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#DBEAFE', borderRadius: 12 },
  levelText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  qrButton: { alignItems: 'center', padding: 8 },
  qrButtonText: { fontSize: 11, color: '#2563EB', marginTop: 4 },

  alertBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 16, marginBottom: 8, borderRadius: 8, gap: 8 },
  alertText: { flex: 1, fontSize: 14, fontWeight: '600' },
  locationButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: '#2563EB' },

  tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2563EB' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#2563EB', fontWeight: '600' },

  tabContent: { padding: 16 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  infoCardAlert: { borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoCardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  infoCardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#6B7280', flex: 1 },
  infoValue: { fontSize: 13, color: '#1F2937', fontWeight: '500', flex: 1, textAlign: 'right' },

  emptyTabText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },

  historyRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  historyTerm: { flexDirection: 'row', justifyContent: 'space-between' },
  historyTermText: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  historyClass: { fontSize: 12, color: '#6B7280' },
  historyScores: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  historyAverage: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  historyRank: { fontSize: 12, color: '#6B7280' },
  historyRemarks: { fontSize: 12, color: '#6B7280', marginTop: 4, fontStyle: 'italic' },

  achievementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  achievementInfo: { flex: 1 },
  achievementTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  achievementMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  achievementDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  certificateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  certificateInfo: { flex: 1 },
  certificateTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  certificateMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  disciplineRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  disciplineDate: { fontSize: 12, color: '#6B7280' },
  disciplineIncident: { fontSize: 14, color: '#DC2626', marginTop: 2 },
  disciplineAction: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  medicalRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#FEE2E2' },
  medicalCondition: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  medicalSeverity: { fontSize: 12, color: '#EF4444', marginTop: 2 },
  medicalNotes: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  safetyStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  safetyDot: { width: 14, height: 14, borderRadius: 7 },
  safetyStatusText: { fontSize: 16, fontWeight: '700' },

  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  logInfo: { flex: 1 },
  logGate: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  logMethod: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  logTime: { fontSize: 12, color: '#6B7280' },

  actionSection: { flexDirection: 'row', padding: 16, gap: 10, marginBottom: 24 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: '#DBEAFE', borderRadius: 10 },
  actionButtonSecondary: { backgroundColor: '#EDE9FE' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
});
