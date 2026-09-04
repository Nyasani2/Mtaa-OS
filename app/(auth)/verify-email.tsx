// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { verifyEmail, resendVerification, user } = useAuthStore();

  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const checkVerification = async () => {
    setChecking(true);
    setError(null);
    const isVerified = await verifyEmail();
    setChecking(false);
    if (isVerified) {
      setVerified(true);
    } else {
      setError('Email not verified yet. Please check your inbox and tap the confirmation link.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setMessage(null);
    const { error: resendError } = await resendVerification();
    setResending(false);
    if (resendError) {
      setError(resendError.message || 'Failed to resend. Please try again later.');
    } else {
      setMessage('Verification email resent. Check your inbox.');
    }
  };

  useEffect(() => {
    // Auto-check once on mount
    checkVerification();
  }, []);

  if (verified) {
    return (
      <View style={styles.container}>
        <Ionicons name="checkmark-circle" size={72} color="#22c55e" />
        <Text style={styles.title}>Email Verified</Text>
        <Text style={styles.subtitle}>Your account is now active.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/create-pin')}>
          <Text style={styles.primaryBtnText}>Create PIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="mail-unread-outline" size={64} color="#00d4ff" />
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        We sent a link to {user?.email || 'your email'}. Tap the link to verify, then press Check below.
      </Text>
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {message && (
        <View style={styles.messageBox}>
          <Ionicons name="information-circle" size={18} color="#22c55e" />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.primaryBtn} onPress={checkVerification} disabled={checking}>
        {checking ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Check Verification</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={handleResend} disabled={resending}>
        {resending ? <ActivityIndicator color="#00d4ff" /> : <Text style={styles.secondaryBtnText}>Resend Email</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/login')} style={styles.linkRow}>
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 24, marginBottom: 10 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ef444415', borderRadius: 12, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#ef444430', width: '100%',
  },
  errorText: { color: '#ef4444', fontSize: 14, flex: 1 },
  messageBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#22c55e15', borderRadius: 12, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#22c55e30', width: '100%',
  },
  messageText: { color: '#22c55e', fontSize: 14, flex: 1 },
  primaryBtn: {
    backgroundColor: '#00d4ff', borderRadius: 14, padding: 18, alignItems: 'center',
    width: '100%', marginBottom: 12, shadowColor: '#00d4ff', shadowOpacity: 0.3, shadowRadius: 12,
  },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderRadius: 14, padding: 16, alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: '#00d4ff', marginBottom: 20,
  },
  secondaryBtnText: { color: '#00d4ff', fontSize: 15, fontWeight: '600' },
  linkRow: { marginTop: 12 },
  linkText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
});
