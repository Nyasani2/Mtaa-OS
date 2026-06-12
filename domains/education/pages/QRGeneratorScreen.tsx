import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Share,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQRSession } from '@/domains/education/hooks/useQRSession';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const QR_TYPES = [
  { value: 'student_id', label: 'Student ID', icon: 'person', description: 'Identity verification' },
  { value: 'teacher_id', label: 'Teacher ID', icon: 'school', description: 'Staff verification' },
  { value: 'attendance', label: 'Attendance', icon: 'calendar', description: 'Mark attendance' },
  { value: 'transport_boarding', label: 'Boarding Pass', icon: 'bus', description: 'Board vehicle' },
  { value: 'transport_alighting', label: 'Alighting', icon: 'exit', description: 'Exit vehicle' },
  { value: 'entry_gate', label: 'Entry Gate', icon: 'log-in', description: 'Enter premises' },
  { value: 'exit_gate', label: 'Exit Gate', icon: 'log-out', description: 'Exit premises' },
  { value: 'certificate', label: 'Certificate', icon: 'document-text', description: 'Verify certificate' },
  { value: 'event_checkin', label: 'Event Check-in', icon: 'ticket', description: 'Event entry' },
  { value: 'library_access', label: 'Library', icon: 'book', description: 'Library access' },
  { value: 'lab_access', label: 'Laboratory', icon: 'flask', description: 'Lab access' },
  { value: 'dorm_access', label: 'Dormitory', icon: 'home', description: 'Dorm access' },
  { value: 'general', label: 'General', icon: 'qr-code', description: 'Custom purpose' },
];

export default function QRGeneratorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { sessions, generateQR, revokeSession, generating, refresh } = useQRSession();
  const [selectedType, setSelectedType] = useState('student_id');
  const [validMinutes, setValidMinutes] = useState('30');
  const [maxScans, setMaxScans] = useState('1');
  const [generatedSession, setGeneratedSession] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  // ─── HANDLE GENERATE ───
  const handleGenerate = useCallback(async () => {
    try {
      const session = await generateQR({
        qr_type: selectedType,
        valid_minutes: parseInt(validMinutes) || 30,
        max_scans: parseInt(maxScans) || 1,
        target_id: user?.id,
        target_type: 'student',
      });
      setGeneratedSession(session);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate QR');
    }
  }, [selectedType, validMinutes, maxScans, user?.id, generateQR]);

  // ─── HANDLE SHARE ───
  const handleShare = useCallback(async () => {
    if (!generatedSession?.qr_image_url) return;
    try {
      await Share.share({
        message: `QR Code: ${generatedSession.qr_type}\nValid until: ${generatedSession.valid_until ? new Date(generatedSession.valid_until).toLocaleString() : 'No expiry'}`,
      });
    } catch {
      // Cancelled
    }
  }, [generatedSession]);

  // ─── HANDLE COPY DATA ───
  const handleCopyData = useCallback(async () => {
    if (!generatedSession?.qr_data) return;
    await Clipboard.setStringAsync(generatedSession.qr_data);
    Alert.alert('Copied', 'QR data copied to clipboard');
  }, [generatedSession]);

  // ─── HANDLE REVOKE ───
  const handleRevoke = useCallback(async (sessionId: string) => {
    Alert.alert(
      'Revoke QR Code',
      'This will invalidate the QR code immediately. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeSession(sessionId);
              if (generatedSession?.id === sessionId) setGeneratedSession(null);
              Alert.alert('Revoked', 'QR code has been invalidated');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  }, [revokeSession, generatedSession]);

  // ─── MAIN RENDER ───
  return (
    <ScrollView style={styles.container}>
      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QR Code Generator</Text>
        <Text style={styles.headerSubtitle}>Generate scannable QR codes for any purpose</Text>
      </View>

      {/* ─── TYPE SELECTOR ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select QR Type</Text>
        <View style={styles.typeGrid}>
          {QR_TYPES.map(type => (
            <TouchableOpacity
              key={type.value}
              style={[styles.typeCard, selectedType === type.value && styles.typeCardActive]}
              onPress={() => setSelectedType(type.value)}
            >
              <Ionicons
                name={type.icon as any}
                size={24}
                color={selectedType === type.value ? '#2563EB' : '#6B7280'}
              />
              <Text style={[styles.typeLabel, selectedType === type.value && styles.typeLabelActive]}>
                {type.label}
              </Text>
              <Text style={styles.typeDesc}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ─── SETTINGS ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Valid For (minutes)</Text>
          <TextInput
            style={styles.settingInput}
            value={validMinutes}
            onChangeText={setValidMinutes}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Max Scans</Text>
          <TextInput
            style={styles.settingInput}
            value={maxScans}
            onChangeText={setMaxScans}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
      </View>

      {/* ─── GENERATE BUTTON ─── */}
      <TouchableOpacity
        style={[styles.generateButton, generating && styles.generateButtonDisabled]}
        onPress={handleGenerate}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Ionicons name="qr-code" size={20} color="#FFF" />
            <Text style={styles.generateButtonText}>Generate QR Code</Text>
          </>
        )}
      </TouchableOpacity>

      {/* ─── GENERATED QR DISPLAY ─── */}
      {generatedSession && (
        <View style={styles.qrDisplaySection}>
          <View style={styles.qrCard}>
            <Text style={styles.qrCardTitle}>Your QR Code</Text>
            <Text style={styles.qrCardType}>{QR_TYPES.find(t => t.value === generatedSession.qr_type)?.label}</Text>

            {generatedSession.qr_image_url ? (
              <Image source={{ uri: generatedSession.qr_image_url }} style={styles.qrImage} />
            ) : (
              <View style={styles.qrPlaceholder}>
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            )}

            <View style={styles.qrMeta}>
              <View style={styles.qrMetaItem}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.qrMetaText}>
                  Expires: {generatedSession.valid_until ? new Date(generatedSession.valid_until).toLocaleString() : 'Never'}
                </Text>
              </View>
              <View style={styles.qrMetaItem}>
                <Ionicons name="scan-outline" size={14} color="#6B7280" />
                <Text style={styles.qrMetaText}>
                  Scans: {generatedSession.scan_count} / {generatedSession.max_scans || '∞'}
                </Text>
              </View>
            </View>

            <View style={styles.qrActions}>
              <TouchableOpacity style={styles.qrActionButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color="#2563EB" />
                <Text style={styles.qrActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qrActionButton} onPress={handleCopyData}>
                <Ionicons name="copy-outline" size={18} color="#2563EB" />
                <Text style={styles.qrActionText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.qrActionButton, styles.qrActionDanger]} onPress={() => handleRevoke(generatedSession.id)}>
                <Ionicons name="close-circle" size={18} color="#DC2626" />
                <Text style={styles.qrActionDangerText}>Revoke</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ─── HISTORY ─── */}
      <TouchableOpacity style={styles.historyToggle} onPress={() => setShowHistory(!showHistory)}>
        <Text style={styles.historyToggleText}>
          {showHistory ? 'Hide' : 'Show'} QR History ({sessions.length})
        </Text>
        <Ionicons name={showHistory ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" />
      </TouchableOpacity>

      {showHistory && (
        <View style={styles.historySection}>
          {sessions.length === 0 ? (
            <Text style={styles.emptyHistory}>No QR codes generated yet</Text>
          ) : (
            sessions.map((session: any) => (
              <View key={session.id} style={[styles.historyItem, session.status !== 'active' && styles.historyItemInactive]}>
                <View style={styles.historyIcon}>
                  <Ionicons
                    name={QR_TYPES.find(t => t.value === session.qr_type)?.icon as any || 'qr-code'}
                    size={20}
                    color={session.status === 'active' ? '#2563EB' : '#9CA3AF'}
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyType}>
                    {QR_TYPES.find(t => t.value === session.qr_type)?.label || session.qr_type}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {session.scan_count} scans • {session.status}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(session.created_at).toLocaleString()}
                  </Text>
                </View>
                {session.status === 'active' && (
                  <TouchableOpacity onPress={() => handleRevoke(session.id)}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 16, backgroundColor: '#FFF', marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  section: { backgroundColor: '#FFF', marginBottom: 8, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard: { width: '23%', alignItems: 'center', padding: 10, backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  typeCardActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  typeLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 6, textAlign: 'center' },
  typeLabelActive: { color: '#2563EB' },
  typeDesc: { fontSize: 9, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  settingLabel: { fontSize: 14, color: '#4B5563' },
  settingInput: { width: 80, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 8, fontSize: 14, color: '#1F2937', textAlign: 'center' },

  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginVertical: 16, paddingVertical: 14, backgroundColor: '#2563EB', borderRadius: 12 },
  generateButtonDisabled: { opacity: 0.6 },
  generateButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  qrDisplaySection: { paddingHorizontal: 16, marginBottom: 16 },
  qrCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  qrCardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  qrCardType: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  qrImage: { width: 220, height: 220, marginVertical: 16 },
  qrPlaceholder: { width: 220, height: 220, marginVertical: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12 },
  qrMeta: { width: '100%', gap: 6 },
  qrMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qrMetaText: { fontSize: 12, color: '#6B7280' },
  qrActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  qrActionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#DBEAFE', borderRadius: 8 },
  qrActionText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  qrActionDanger: { backgroundColor: '#FEE2E2' },
  qrActionDangerText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },

  historyToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', marginBottom: 8 },
  historyToggleText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },

  historySection: { backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 24, borderRadius: 12, padding: 12 },
  emptyHistory: { textAlign: 'center', paddingVertical: 24, color: '#9CA3AF', fontSize: 14 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  historyItemInactive: { opacity: 0.6 },
  historyIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  historyInfo: { flex: 1 },
  historyType: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  historyMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  historyDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
});
