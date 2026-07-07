import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';

interface EvidenceViewerProps {
  evidence: {
    id: string; evidence_type: string; title: string; description?: string;
    severity: string; is_locked: boolean; locked_at?: string;
    lock_reason?: string; reviewed_at?: string; review_notes?: string;
    case_number?: string; police_report_id?: string; insurance_claim_id?: string;
    share_token?: string; download_count: number;
    clip_start_seconds?: number; clip_end_seconds?: number; created_at: string;
  };
  recording?: { duration_seconds?: number };
  onLock?: (reason: string) => void;
  onUnlock?: () => void;
  onReview?: (notes: string) => void;
  onShare?: () => void;
  onDownload?: () => void;
  onLinkCase?: () => void;
}

export default function EvidenceViewer({ evidence, recording, onLock, onUnlock, onReview, onShare, onDownload, onLinkCase }: EvidenceViewerProps) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [showLockInput, setShowLockInput] = useState(false);

  const sevColors: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
  const icons: Record<string, string> = { crash: '💥', emergency_brake: '🛑', rollover: '🔄', airbag: '💨', sos: '🆘', panic_button: '🚨', hijack: '🔫', forced_entry: '🚪', overspeed: '⚡', harsh_acceleration: '🚀', harsh_cornering: '↩️', harsh_braking: '🛑', driver_fatigue: '😴', medical_emergency: '🏥', bodycam_emergency: '👮', inspection_complete: '✅', collision: '💥', near_miss: '⚠️', theft: '🦹' };

  const handleLock = () => {
    if (!lockReason.trim()) { Alert.alert('Reason Required', 'Please provide a reason for locking this evidence'); return; }
    onLock?.(lockReason);
    setShowLockInput(false);
    setLockReason('');
  };

  const handleReview = () => {
    if (!reviewNotes.trim()) { Alert.alert('Notes Required', 'Please provide review notes'); return; }
    onReview?.(reviewNotes);
    setShowReviewInput(false);
    setReviewNotes('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icons[evidence.evidence_type] || '📋'}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{evidence.title}</Text>
          <View style={styles.badges}>
            <View style={[styles.sevBadge, { backgroundColor: sevColors[evidence.severity] || '#6b7280' }]}>
              <Text style={styles.sevText}>{evidence.severity}</Text>
            </View>
            {evidence.is_locked && <View style={styles.lockBadge}><Text style={styles.lockText}>🔒 LOCKED</Text></View>}
          </View>
        </View>
      </View>

      {evidence.description && <Section title="Description"><Text style={styles.desc}>{evidence.description}</Text></Section>}

      {recording && <Section title="Recording"><View style={styles.recInfo}><Text style={styles.recText}>Duration: {recording.duration_seconds}s</Text>{evidence.clip_start_seconds !== undefined && <Text style={styles.recText}>Clip: {evidence.clip_start_seconds}s - {evidence.clip_end_seconds}s</Text>}</View></Section>}

      {evidence.case_number && <Section title="Case Information"><InfoGrid><InfoRow label="Case #" value={evidence.case_number} />{evidence.police_report_id && <InfoRow label="Police Report" value={evidence.police_report_id} />}{evidence.insurance_claim_id && <InfoRow label="Insurance Claim" value={evidence.insurance_claim_id} />}</InfoGrid></Section>}

      {evidence.is_locked && <Section title="Lock Details"><InfoGrid><InfoRow label="Locked at" value={evidence.locked_at ? new Date(evidence.locked_at).toLocaleString() : '—'} /><InfoRow label="Reason" value={evidence.lock_reason || '—'} /></InfoGrid></Section>}

      {evidence.reviewed_at && <Section title="Review"><InfoGrid><InfoRow label="Reviewed at" value={new Date(evidence.reviewed_at).toLocaleString()} /><InfoRow label="Notes" value={evidence.review_notes || '—'} /></InfoGrid></Section>}

      <Section title="Metadata"><InfoGrid><InfoRow label="Downloads" value={`${evidence.download_count}`} /><InfoRow label="Created" value={new Date(evidence.created_at).toLocaleString()} />{evidence.share_token && <InfoRow label="Share Token" value={evidence.share_token.substring(0, 8) + '...'} />}</InfoGrid></Section>

      <View style={styles.actions}>
        {!evidence.is_locked ? (
          <>
            <ActionBtn label="🔒 Lock" onPress={() => setShowLockInput(!showLockInput)} />
            <ActionBtn label="✅ Review" onPress={() => setShowReviewInput(!showReviewInput)} />
            <ActionBtn label="🔗 Share" onPress={onShare} />
            <ActionBtn label="⬇️ Download" onPress={onDownload} />
          </>
        ) : (
          <ActionBtn label="🔓 Unlock" onPress={onUnlock} />
        )}
      </View>

      {showLockInput && (
        <View style={styles.inputBox}>
          <TextInput style={styles.input} value={lockReason} onChangeText={setLockReason} placeholder="Reason for locking..." placeholderTextColor="#64748b" multiline />
          <TouchableOpacity style={styles.confirmBtn} onPress={handleLock}><Text style={styles.confirmText}>Confirm Lock</Text></TouchableOpacity>
        </View>
      )}

      {showReviewInput && (
        <View style={styles.inputBox}>
          <TextInput style={styles.input} value={reviewNotes} onChangeText={setReviewNotes} placeholder="Review notes..." placeholderTextColor="#64748b" multiline />
          <TouchableOpacity style={styles.confirmBtn} onPress={handleReview}><Text style={styles.confirmText}>Submit Review</Text></TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.gridRow}><Text style={styles.gridLabel}>{label}</Text><Text style={styles.gridValue}>{value}</Text></View>;
}

function ActionBtn({ label, onPress }: { label: string; onPress?: () => void }) {
  return <TouchableOpacity style={styles.actionBtn} onPress={onPress}><Text style={styles.actionText}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  icon: { fontSize: 32, marginRight: 12 },
  headerInfo: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  badges: { flexDirection: 'row', gap: 8 },
  sevBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sevText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  lockBadge: { backgroundColor: '#7f1d1d', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  lockText: { color: '#fca5a5', fontSize: 11, fontWeight: '700' },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase' },
  desc: { fontSize: 14, color: '#e2e8f0', lineHeight: 20 },
  recInfo: { backgroundColor: '#1e293b', borderRadius: 8, padding: 12 },
  recText: { fontSize: 13, color: '#e2e8f0', marginBottom: 4 },
  grid: { backgroundColor: '#1e293b', borderRadius: 8, padding: 12 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#334155' },
  gridLabel: { fontSize: 13, color: '#94a3b8' },
  gridValue: { fontSize: 13, color: '#e2e8f0', fontWeight: '600', flex: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  actionBtn: { backgroundColor: '#334155', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', minWidth: 80 },
  actionText: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  inputBox: { padding: 16, backgroundColor: '#1e293b', margin: 16, borderRadius: 12 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: '#334155' },
  confirmBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 },
  confirmText: { color: '#fff', fontWeight: '700' },
});
