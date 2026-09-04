import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Share, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStudentIdentity } from '@/domains/education/hooks/useStudentIdentity';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

export default function StudentIdentityCard() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { identity, loading, error, refreshing, refresh, generateQR, isOwner, isGuardian } = useStudentIdentity(studentId);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [showBack, setShowBack] = useState(false);

  // ─── HANDLE GENERATE QR ───
  const handleGenerateQR = useCallback(async () => {
    if (!studentId || !identity?.institution_id) {
      Alert.alert('Error', 'Missing student or institution information');
      return;
    }
    try {
      setGeneratingQR(true);
      await generateQR();
      Alert.alert('Success', 'Identity card generated successfully');
      refresh();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  }, [studentId, identity, generateQR, refresh]);

  // ─── HANDLE SHARE ───
  const handleShare = useCallback(async () => {
    if (!identity) return;
    try {
      await Share.share({
        message: `Student ID: ${identity.card_number}\nName: ${student?.full_name}\nSchool: ${institution?.name}\nLevel: ${student?.current_level}`,
        title: `${student?.full_name} - Student ID`,
      });
    } catch {
      // User cancelled
    }
  }, [identity, student, institution]);

  // ─── HANDLE COPY CARD NUMBER ───
  const handleCopyCardNumber = useCallback(async () => {
    if (identity?.card_number) {
      await Clipboard.setStringAsync(identity.card_number);
      Alert.alert('Copied', 'Card number copied to clipboard');
    }
  }, [identity?.card_number]);

  const student = identity?.student;
  const institution = student?.institution;

  // ─── LOADING STATE ───
  if (loading && !identity) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading identity card...</Text>
      </View>
    );
  }

  // ─── ERROR STATE ───
  if (error && !identity) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="id-card-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Card Unavailable</Text>
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
        <Ionicons name="id-card-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No Identity Card</Text>
        <Text style={styles.emptyText}>This student does not have an identity card issued yet.</Text>
        {(isOwner || isGuardian) && (
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateQR}>
            <Text style={styles.generateButtonText}>Generate Card</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── SUCCESS STATE (Card Display) ───
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* ─── FLIP CARD ─── */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setShowBack(!showBack)}
        style={styles.flipCardContainer}
      >
        <View style={[styles.card, showBack && styles.cardBack]}>
          {!showBack ? (
            // ─── FRONT OF CARD ───
            <>
              <View style={styles.cardHeader}>
                <View style={styles.institutionBadge}>
                  <Text style={styles.institutionBadgeText}>{institution?.type?.toUpperCase()}</Text>
                </View>
                <Text style={styles.cardTitle}>STUDENT IDENTITY CARD</Text>
                {institution?.logo_url ? (
                  <Image source={{ uri: institution.logo_url }} style={styles.logo} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="school" size={24} color="#2563EB" />
                  </View>
                )}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.photoSection}>
                  <View style={styles.photo}>
                    <Text style={styles.photoText}>{student?.full_name?.charAt(0)}</Text>
                  </View>
                  <View style={styles.statusChip}>
                    <View style={[styles.statusDot, { backgroundColor: student?.enrollment_status === 'active' ? '#10B981' : '#EF4444' }]} />
                    <Text style={styles.statusText}>{student?.enrollment_status?.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.studentName}>{student?.full_name}</Text>
                  <Text style={styles.admissionNumber}>Adm: {student?.admission_number}</Text>
                  <Text style={styles.institutionName}>{institution?.name}</Text>

                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Level</Text>
                      <Text style={styles.detailValue}>{student?.current_level}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Stream</Text>
                      <Text style={styles.detailValue}>{student?.stream || '-'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Gender</Text>
                      <Text style={styles.detailValue}>{student?.gender?.charAt(0).toUpperCase() + student?.gender?.slice(1) || '-'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.qrSection}>
                  {identity.qr_code_url ? (
                    <Image source={{ uri: identity.qr_code_url }} style={styles.qrImage} />
                  ) : (
                    <View style={styles.qrPlaceholder}>
                      <Ionicons name="qr-code" size={48} color="#9CA3AF" />
                      <Text style={styles.qrPlaceholderText}>No QR Code</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardNumberSection}>
                  <Text style={styles.cardNumberLabel}>CARD NUMBER</Text>
                  <Text style={styles.cardNumber}>{identity.card_number || 'PENDING'}</Text>
                  <Text style={styles.cardMeta}>
                    Issued: {identity.card_issued_at ? new Date(identity.card_issued_at).toLocaleDateString() : '-'}
                    {'  '}•{'  '}
                    Expires: {identity.card_expires_at ? new Date(identity.card_expires_at).toLocaleDateString() : 'No expiry'}
                  </Text>
                </View>
              </View>

              <View style={styles.tapHint}>
                <Ionicons name="sync" size={14} color="#9CA3AF" />
                <Text style={styles.tapHintText}>Tap to flip</Text>
              </View>
            </>
          ) : (
            // ─── BACK OF CARD ───
            <>
              <View style={styles.cardHeaderBack}>
                <Text style={styles.cardTitleBack}>{institution?.name}</Text>
                <Text style={styles.cardSubtitleBack}>Student Identity Card</Text>
              </View>

              <View style={styles.cardBodyBack}>
                <InfoBlock label="Emergency Contact" value={identity.emergency_contact_name || 'Not set'} />
                <InfoBlock label="Emergency Phone" value={identity.emergency_contact_phone || 'Not set'} />
                <InfoBlock label="Blood Group" value={identity.blood_group || 'Not set'} />
                <InfoBlock
                  label="Allergies"
                  value={identity.allergies?.length > 0 ? identity.allergies.join(', ') : 'None'}
                />
                <InfoBlock label="Primary Guardian" value={identity.primary_guardian_name || 'Not set'} />
                <InfoBlock label="Guardian Phone" value={identity.primary_guardian_phone || 'Not set'} />

                {identity.medical_conditions?.length > 0 && (
                  <View style={styles.medicalAlert}>
                    <Ionicons name="medical" size={16} color="#DC2626" />
                    <Text style={styles.medicalAlertText}>Medical conditions on file</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooterBack}>
                <Text style={styles.termsText}>
                  This card is property of {institution?.name}. If found, please return to the institution.
                  Misuse is punishable by law. Verified by MTAA AFRIQ Education System.
                </Text>
                <Text style={styles.verifyText}>Verify at: mtaa.afriq/education/verify</Text>
              </View>

              <View style={styles.tapHint}>
                <Ionicons name="sync" size={14} color="#9CA3AF" />
                <Text style={styles.tapHintText}>Tap to flip back</Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* ─── ACTIONS ─── */}
      <View style={styles.actionsContainer}>
        {!identity.qr_code_url && (isOwner || isGuardian) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleGenerateQR}
            disabled={generatingQR}
          >
            {generatingQR ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="qr-code" size={20} color="#FFF" />
                <Text style={styles.actionButtonTextPrimary}>Generate QR Code</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {identity.qr_code_url && (
          <>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#2563EB" />
              <Text style={styles.actionButtonText}>Share Card</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleCopyCardNumber}>
              <Ionicons name="copy-outline" size={20} color="#2563EB" />
              <Text style={styles.actionButtonText}>Copy Card Number</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/education/student-profile?studentId=${studentId}` as any)}
            >
              <Ionicons name="person-outline" size={20} color="#2563EB" />
              <Text style={styles.actionButtonText}>View Full Profile</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={refresh}>
          <Ionicons name="refresh" size={20} color="#DC2626" />
          <Text style={styles.actionButtonTextDanger}>Refresh Card</Text>
        </TouchableOpacity>
      </View>

      {/* ─── VERIFICATION STATUS ─── */}
      <View style={styles.verificationSection}>
        <Text style={styles.verificationTitle}>Card Verification</Text>
        <View style={styles.verificationRow}>
          <View style={styles.verificationItem}>
            <Ionicons
              name={identity.card_status === 'active' ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={identity.card_status === 'active' ? '#10B981' : '#EF4444'}
            />
            <Text style={styles.verificationLabel}>Status</Text>
            <Text style={[styles.verificationValue, { color: identity.card_status === 'active' ? '#10B981' : '#EF4444' }]}>
              {identity.card_status?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.verificationItem}>
            <Ionicons name="time-outline" size={24} color="#6B7280" />
            <Text style={styles.verificationLabel}>Issued</Text>
            <Text style={styles.verificationValue}>
              {identity.card_issued_at ? new Date(identity.card_issued_at).toLocaleDateString() : '-'}
            </Text>
          </View>
          <View style={styles.verificationItem}>
            <Ionicons name="calendar-outline" size={24} color="#6B7280" />
            <Text style={styles.verificationLabel}>Expires</Text>
            <Text style={styles.verificationValue}>
              {identity.card_expires_at ? new Date(identity.card_expires_at).toLocaleDateString() : 'Never'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── HELPERS ───

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoBlockLabel}>{label}</Text>
      <Text style={styles.infoBlockValue}>{value}</Text>
    </View>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#1F2937' },
  errorText: { marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptyText: { marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' },
  retryButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#2563EB', borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  generateButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#10B981', borderRadius: 8 },
  generateButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  flipCardContainer: { alignItems: 'center', marginBottom: 20 },
  card: {
    width: width - 32,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardBack: { backgroundColor: '#1E3A5F' },

  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#2563EB', gap: 10 },
  institutionBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
  institutionBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: 1 },
  logo: { width: 36, height: 36, borderRadius: 18 },
  logoPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },

  cardBody: { flexDirection: 'row', padding: 16, gap: 16 },
  photoSection: { alignItems: 'center' },
  photo: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#2563EB' },
  photoText: { fontSize: 28, fontWeight: '700', color: '#2563EB' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#ECFDF5', borderRadius: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '600', color: '#059669' },

  infoSection: { flex: 1 },
  studentName: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  admissionNumber: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  institutionName: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  detailRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginTop: 2 },

  cardFooter: { flexDirection: 'row', padding: 16, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  qrSection: { marginRight: 16 },
  qrImage: { width: 100, height: 100, borderRadius: 8 },
  qrPlaceholder: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  qrPlaceholderText: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  cardNumberSection: { flex: 1, justifyContent: 'center' },
  cardNumberLabel: { fontSize: 10, color: '#9CA3AF', letterSpacing: 1 },
  cardNumber: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 4, fontFamily: 'monospace' },
  cardMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  tapHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, backgroundColor: '#F8FAFC' },
  tapHintText: { fontSize: 11, color: '#9CA3AF' },

  // Back of card
  cardHeaderBack: { padding: 16, backgroundColor: '#1E3A5F', borderBottomWidth: 1, borderBottomColor: '#2D4A6F' },
  cardTitleBack: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  cardSubtitleBack: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  cardBodyBack: { padding: 16, gap: 12 },
  infoBlock: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2D4A6F' },
  infoBlockLabel: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoBlockValue: { fontSize: 14, color: '#FFF', marginTop: 2, fontWeight: '500' },
  medicalAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#FEE2E2', borderRadius: 8, marginTop: 8 },
  medicalAlertText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
  cardFooterBack: { padding: 16, backgroundColor: '#152A45' },
  termsText: { fontSize: 10, color: '#64748B', lineHeight: 16, textAlign: 'center' },
  verifyText: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8 },

  // Actions
  actionsContainer: { gap: 10, marginBottom: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionButtonPrimary: { backgroundColor: '#2563EB' },
  actionButtonDanger: { backgroundColor: '#FEE2E2' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  actionButtonTextPrimary: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  actionButtonTextDanger: { fontSize: 14, fontWeight: '600', color: '#DC2626' },

  // Verification
  verificationSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 16 },
  verificationTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  verificationRow: { flexDirection: 'row', justifyContent: 'space-around' },
  verificationItem: { alignItems: 'center', gap: 4 },
  verificationLabel: { fontSize: 11, color: '#9CA3AF' },
  verificationValue: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
});