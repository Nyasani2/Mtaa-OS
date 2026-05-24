import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { ConsentToken, HealthCategory, AccessLevel } from '../types';

interface Props { visible: boolean; token: ConsentToken | null; onApprove: (pin: string) => void; onReject: () => void; onClose: () => void; }

export const ConsentModal: React.FC<Props> = ({ visible, token, onApprove, onReject, onClose }) => {
  const [pin, setPin] = useState('');
  if (!token) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>🔒 Access Request</Text>
          <Text style={styles.provider}>{token.requesterName || token.requesterId} wants access to your health data</Text>
          <View style={styles.details}>
            <Text style={styles.detailRow}>📁 Categories: {token.categories.join(', ')}</Text>
            <Text style={styles.detailRow}>🔑 Level: {token.accessLevel}</Text>
            <Text style={styles.detailRow}>⏱️ Expires: {new Date(token.expiresAt).toLocaleString()}</Text>
          </View>
          <Text style={styles.pinLabel}>Enter your PIN to approve:</Text>
          <TextInput style={styles.pinInput} value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={6} secureTextEntry placeholder="••••" />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => { setPin(''); onReject(); }}><Text style={styles.rejectText}>❌ Reject</Text></TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => { if (pin.length >= 4) { onApprove(pin); setPin(''); } }}><Text style={styles.approveText}>✅ Approve</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', textAlign: 'center' },
  provider: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  details: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginTop: 16, gap: 8 },
  detailRow: { fontSize: 13, color: '#374151' },
  pinLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 20 },
  pinInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 18, textAlign: 'center', marginTop: 8, letterSpacing: 8 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  rejectBtn: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, alignItems: 'center' },
  rejectText: { color: '#DC2626', fontWeight: '600' },
  approveBtn: { flex: 1, backgroundColor: '#10B981', borderRadius: 12, padding: 14, alignItems: 'center' },
  approveText: { color: '#FFFFFF', fontWeight: '600' },
  closeBtn: { marginTop: 12, alignItems: 'center' },
  closeText: { color: '#9CA3AF', fontSize: 13 },
});
