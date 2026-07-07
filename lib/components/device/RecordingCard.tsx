import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface RecordingCardProps {
  recording: {
    id: string; recording_type: string; duration_seconds: number;
    file_size_bytes?: number; resolution?: string; start_lat?: number;
    start_lng?: number; started_at: string; upload_status: string;
    processing_status: string; has_audio: boolean; encrypted: boolean;
  };
  onPress?: () => void; onDownload?: () => void; onShare?: () => void; onDelete?: () => void;
}

export default function RecordingCard({ recording, onPress, onDownload, onShare, onDelete }: RecordingCardProps) {
  const typeColors: Record<string, string> = { continuous: '#3b82f6', event: '#ef4444', manual: '#f59e0b', emergency: '#dc2626', inspection: '#22c55e', trip: '#8b5cf6' };
  const uploadColors: Record<string, string> = { pending: '#f59e0b', uploading: '#3b82f6', uploaded: '#22c55e', failed: '#ef4444', archived: '#6b7280' };
  const fmtDur = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, '0')}`; };
  const fmtSize = (b?: number) => { if (!b) return '—'; return b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`; };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Badge text={recording.recording_type} color={typeColors[recording.recording_type] || '#6b7280'} />
        <Badge text={recording.upload_status} color={uploadColors[recording.upload_status] || '#6b7280'} />
      </View>
      <View style={styles.details}>
        <Row label="⏱ Duration" value={fmtDur(recording.duration_seconds)} />
        <Row label="💾 Size" value={fmtSize(recording.file_size_bytes)} />
        {recording.resolution && <Row label="📐 Resolution" value={recording.resolution} />}
        <Row label="🔊 Audio" value={recording.has_audio ? 'Yes' : 'No'} />
        <Row label="🔒 Encrypted" value={recording.encrypted ? 'Yes' : 'No'} />
      </View>
      <Text style={styles.timestamp}>{new Date(recording.started_at).toLocaleString()}</Text>
      <View style={styles.actions}>
        <ActionBtn label="⬇️ Download" onPress={onDownload} />
        <ActionBtn label="🔗 Share" onPress={onShare} />
        <ActionBtn label="🗑️" onPress={onDelete} danger />
      </View>
    </TouchableOpacity>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return <View style={[styles.badge, { backgroundColor: color }]}><Text style={styles.badgeText}>{text}</Text></View>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}

function ActionBtn({ label, onPress, danger }: { label: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={[styles.btn, danger && styles.btnDanger]} onPress={onPress}>
      <Text style={[styles.btnText, danger && styles.btnTextDanger]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  details: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#334155' },
  rowLabel: { fontSize: 13, color: '#94a3b8' },
  rowValue: { fontSize: 13, color: '#e2e8f0', fontWeight: '600' },
  timestamp: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, backgroundColor: '#334155', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnDanger: { flex: 0.5, backgroundColor: '#7f1d1d' },
  btnText: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  btnTextDanger: { color: '#fca5a5' },
});
