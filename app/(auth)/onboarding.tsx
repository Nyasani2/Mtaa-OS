// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '@/lib/supabase';

export default function UnifiedOnboarding() {
  const router = useRouter();
  const { user, setPin, profile } = useAuthStore();
  
  const [enteredPin, setEnteredPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // SECURITY FIX: If user already has a PIN, skip onboarding and go home
    if (profile?.pin_set) {
      router.replace('/');
      return;
    }
    checkBiometricSupport();
  }, [profile]);

  const checkBiometricSupport = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (hasHardware) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types & LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
        setBiometricType('Face ID');
      } else if (types & LocalAuthentication.AuthenticationType.FINGERPRINT) {
        setBiometricType('Fingerprint');
      } else {
        setBiometricType('Biometric');
      }
    }
  };

  const handlePinContinue = () => {
    if (enteredPin.length !== 4 || !/^\d{4}$/.test(enteredPin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    if (enteredPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleComplete = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No user found. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      // 1. Save PIN securely via your existing pinEngine
      await setPin(enteredPin);

      // 2. Enable biometrics if selected and supported
      if (biometricEnabled && biometricType) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Enable ${biometricType} for MTAA`,
          fallbackLabel: 'Use PIN',
        });

        if (result.success) {
          await supabase
            .from('user_profiles')
            .update({ biometric_enabled: true })
            .eq('user_id', user.id);
        } else {
          setBiometricEnabled(false);
        }
      }

      // 3. Mark onboarding complete in DB (This stops it from asking again!)
      await supabase
        .from('user_profiles')
        .update({ pin_set: true, onboarding_complete: true })
        .eq('user_id', user.id);

      // 4. Redirect to home
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Secure Your Account</Text>
          <Text style={styles.subtitle}>Step {step} of 2</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconBox}>
              <Ionicons name="lock-closed" size={48} color="#00d4ff" />
            </View>
            <Text style={styles.stepTitle}>Create Your PIN</Text>
            <Text style={styles.stepDesc}>Choose a 4-digit PIN to secure your MTAA wallet and transactions</Text>

            <View style={styles.pinContainer}>
              <Text style={styles.label}>Enter PIN</Text>
              <TextInput style={styles.pinInput} placeholder="••••" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="number-pad" maxLength={4} value={enteredPin} onChangeText={setEnteredPin} secureTextEntry />
            </View>

            <View style={styles.pinContainer}>
              <Text style={styles.label}>Confirm PIN</Text>
              <TextInput style={styles.pinInput} placeholder="••••" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="number-pad" maxLength={4} value={confirmPin} onChangeText={setConfirmPin} secureTextEntry />
            </View>

            <TouchableOpacity style={styles.continueBtn} onPress={handlePinContinue}>
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconBox}>
              <Ionicons name={biometricType === 'Face ID' ? 'scan' : 'finger-print'} size={48} color="#10b981" />
            </View>
            <Text style={styles.stepTitle}>Enable {biometricType || 'Biometric'}</Text>
            <Text style={styles.stepDesc}>Quickly unlock your account and approve transactions</Text>

            <View style={styles.biometricCard}>
              <View style={styles.biometricRow}>
                <View style={styles.biometricIcon}>
                  <Ionicons name={biometricType === 'Face ID' ? 'scan' : 'finger-print'} size={28} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.biometricLabel}>Enable {biometricType || 'Biometric'}</Text>
                  <Text style={styles.biometricDesc}>Faster access to your account</Text>
                </View>
                <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} trackColor={{ false: '#334155', true: '#10b981' }} thumbColor={biometricEnabled ? '#fff' : '#94a3b8'} />
              </View>
            </View>

            <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.completeBtnText}>Complete Setup</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleComplete} disabled={loading}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color="#10b981" />
          <Text style={styles.noteText}>Your data is encrypted and secure</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 24, paddingTop: 40, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  progressBar: { height: 4, backgroundColor: '#1a1a2e', borderRadius: 2, marginBottom: 32 },
  progressFill: { height: '100%', backgroundColor: '#00d4ff', borderRadius: 2 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ef444415', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#ef444430' },
  errorText: { color: '#ef4444', fontSize: 14, flex: 1 },
  stepContainer: { alignItems: 'center' },
  iconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  stepDesc: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  pinContainer: { width: '100%', marginBottom: 20 },
  label: { color: '#94a3b8', fontSize: 13, marginBottom: 8, fontWeight: '600' },
  pinInput: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 18, color: '#fff', fontSize: 24, fontWeight: '600', textAlign: 'center', letterSpacing: 8, borderWidth: 1, borderColor: '#2a2a3e' },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00d4ff', borderRadius: 14, padding: 18, marginTop: 8, gap: 8 },
  continueBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  biometricCard: { width: '100%', backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#2a2a3e' },
  biometricRow: { flexDirection: 'row', alignItems: 'center' },
  biometricIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#10b98120', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  biometricLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  biometricDesc: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', borderRadius: 14, padding: 18, marginTop: 8, gap: 8, width: '100%' },
  completeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: { marginTop: 16, padding: 12 },
  skipText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, gap: 6 },
  noteText: { color: '#10b981', fontSize: 12, fontWeight: '600' },
});
