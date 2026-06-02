import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useReport } from '../hooks/useReport';

const REASONS = ['spam', 'harassment', 'misinformation', 'violence', 'hate_speech', 'other'];

export function ReportModal() {
  const { showReportModal, reportTarget, selectedReason, setSelectedReason, details, setDetails, closeReport, submit, isSubmitting } = useReport();

  return (
    <Modal visible={showReportModal} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Report {reportTarget?.type}</Text>
          <Text style={styles.subtitle}>Why are you reporting this?</Text>

          {REASONS.map(reason => (
            <Pressable
              key={reason}
              style={[styles.reason, selectedReason === reason && styles.selectedReason]}
              onPress={() => setSelectedReason(reason as any)}
            >
              <Text style={[styles.reasonText, selectedReason === reason && styles.selectedText]}>
                {reason.replace('_', ' ').toUpperCase()}
              </Text>
            </Pressable>
          ))}

          <Pressable style={styles.submitBtn} onPress={submit} disabled={!selectedReason || isSubmitting}>
            <Text style={styles.submitText}>{isSubmitting ? 'Submitting...' : 'Submit Report'}</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={closeReport}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  sheet: { backgroundColor: '#fff', width: '90%', borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  reason: { padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8 },
  selectedReason: { borderColor: '#E91E63', backgroundColor: '#FCE4EC' },
  reasonText: { fontSize: 14, textTransform: 'capitalize' },
  selectedText: { color: '#E91E63', fontWeight: '700' },
  submitBtn: { backgroundColor: '#E91E63', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  submitText: { color: '#fff', fontWeight: '700' },
  cancelBtn: { padding: 14, alignItems: 'center', marginTop: 8 },
  cancelText: { color: '#888' },
});
