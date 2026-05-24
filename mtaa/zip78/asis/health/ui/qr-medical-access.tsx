import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HealthQRSystem } from '../health-qr-system';

interface Props { userId: string; providerId: string; qrSystem: HealthQRSystem; }

export const QRMedicalAccess: React.FC<Props> = ({ userId, providerId, qrSystem }) => {
  const [qrData, setQrData] = useState<{ qrCode: string; sessionId: string; expiresAt: string } | null>(null);
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'scanned' | 'approved' | 'closed'>('idle');

  const generate = async () => {
    setStatus('generating');
    const data = await qrSystem.generateQR(userId, providerId);
    setQrData(data); setStatus('ready');
  };

  const close = async () => {
    if (qrData) { await qrSystem.endSession(qrData.sessionId); setStatus('closed'); setQrData(null); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏥 QR Medical Access</Text>
      <Text style={styles.subtitle}>Show this QR to your healthcare provider</Text>
      {status === 'idle' && (
        <TouchableOpacity style={styles.btn} onPress={generate}><Text style={styles.btnText}>Generate QR Code</Text></TouchableOpacity>
      )}
      {status === 'generating' && <Text style={styles.loading}>Generating...</Text>}
      {status === 'ready' && qrData && (
        <View style={styles.qrBox}>
          <View style={styles.qrPlaceholder}><Text style={styles.qrText}>📱 QR CODE</Text><Text style={styles.qrCode}>{qrData.qrCode.substring(0, 20)}...</Text></View>
          <Text style={styles.expiry}>⏱️ Expires: {new Date(qrData.expiresAt).toLocaleTimeString()}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={close}><Text style={styles.closeText}>🔒 End Session</Text></TouchableOpacity>
        </View>
      )}
      {status === 'closed' && <Text style={styles.closed}>✅ Session closed. Access revoked.</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, margin: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  btn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  btnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  loading: { fontSize: 16, color: '#6B7280' },
  qrBox: { alignItems: 'center', width: '100%' },
  qrPlaceholder: { backgroundColor: '#F3F4F6', borderRadius: 16, padding: 40, alignItems: 'center', width: '100%' },
  qrText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  qrCode: { fontSize: 11, color: '#9CA3AF', marginTop: 8, fontFamily: 'monospace' },
  expiry: { fontSize: 13, color: '#F59E0B', marginTop: 12, fontWeight: '500' },
  closeBtn: { marginTop: 16, backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  closeText: { color: '#DC2626', fontWeight: '600' },
  closed: { fontSize: 16, color: '#10B981', fontWeight: '600' },
});
