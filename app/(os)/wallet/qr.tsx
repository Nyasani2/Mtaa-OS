// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-native-qrcode-svg';

export default function QRDisplayScreen() {
  const { user } = useAuthStore();
  const [qrPayload, setQrPayload] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [lastError, setLastError] = useState('');

  const fetchQRCode = async () => {
    if (!user?.id) {
      setLastError('No user ID');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const startTime = Date.now();
    
    try {
      console.log('[QR] Calling edge function...');
      const { data, error } = await supabase.functions.invoke('qr-generate', {
        body: { user_id: user.id }
      });
      
      const duration = Date.now() - startTime;
      console.log(`[QR] Response in ${duration}ms:`, { data, error });
      
      if (error || !data?.payload) {
        console.warn('[QR] Edge function failed:', error);
        setLastError(error?.message || 'No payload');
        setUseLocalFallback(true);
        setQrPayload(`mtaa://pay?uid=${user.id}&ts=${Date.now()}&local=true`);
      } else {
        setLastError('');
        setUseLocalFallback(false);
        setQrPayload(`mtaa://pay?nonce=${data.payload.nonce}&uid=${user.id}&exp=${data.payload.exp}`);
      }
      setTimeLeft(60);
    } catch (err: any) {
      console.error('[QR] Exception:', err);
      setLastError(err.message);
      setUseLocalFallback(true);
      setQrPayload(`mtaa://pay?uid=${user.id}&ts=${Date.now()}&local=true`);
      setTimeLeft(60);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRCode();
    const interval = setInterval(fetchQRCode, 50000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchQRCode();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !qrPayload) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Generating QR Code...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan to Pay</Text>
      <View style={styles.qrContainer}>
        {qrPayload ? (
          <QRCode value={qrPayload} size={250} color="#0f172a" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No QR Code Available</Text>
          </View>
        )}
      </View>
      {useLocalFallback && (
        <View style={styles.errorContainer}>
          <Text style={styles.warningText}>⚠️ Using local QR (Edge function unavailable)</Text>
          {lastError && <Text style={styles.errorText}>Error: {lastError}</Text>}
          <Text style={styles.hintText}>Check browser console for details</Text>
        </View>
      )}
      <Text style={styles.timer}>Refreshes in: {timeLeft}s</Text>
      <Text style={styles.instruction}>Have the merchant scan this code.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', marginTop: 16, fontSize: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 30 },
  qrContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20 },
  placeholder: { width: 250, height: 250, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: 8 },
  placeholderText: { color: '#64748b', fontSize: 14, textAlign: 'center' },
  timer: { fontSize: 16, color: '#60a5fa', fontWeight: '600', marginBottom: 10 },
  instruction: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  warningText: { fontSize: 12, color: '#f59e0b', textAlign: 'center', marginBottom: 8 },
  errorContainer: { marginBottom: 10 },
  errorText: { fontSize: 11, color: '#ef4444', textAlign: 'center', marginBottom: 4 },
  hintText: { fontSize: 10, color: '#64748b', textAlign: 'center' },
});
