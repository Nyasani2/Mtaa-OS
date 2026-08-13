import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { checkBiometricStatus, authenticateBiometric, setBiometricEnabled } from '@/lib/security/biometric-engine';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function BiometricEnrollScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<{ available: boolean; enrolled: boolean; types: string[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    checkBiometricStatus().then((s: any) => {
      setStatus(s);
      setLoading(false);
    });
  }, []);

  const handleEnable = async () => {
    setEnrolling(true);
    const result = await authenticateBiometric();
    setEnrolling(false);

    if (result.success) {
      await setBiometricEnabled(user?.id || '', true);
      if (user?.id) {
        await supabase.from('user_profiles').update({
          biometric_enabled: true,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      }
      Alert.alert('Biometric Enabled', 'You can now unlock MTAA with your biometric.', [
        { text: 'Continue', onPress: () => router.replace('/(os)') }
      ]);
    } else {
      Alert.alert('Failed', result.error || 'Could not verify biometric');
    }
  };

  const handleSkip = () => {
    router.replace('/(os)');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!status?.available) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="phone-portrait-outline" size={64} color="#64748b" />
          <Text style={styles.title}>No Biometric Hardware</Text>
          <Text style={styles.subtitle}>This device does not support fingerprint or face unlock. You will use your PIN instead.</Text>
          <TouchableOpacity style={styles.btn} onPress={handleSkip}>
            <Text style={styles.btnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!status?.enrolled) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="finger-print-outline" size={64} color="#f59e0b" />
          <Text style={styles.title}>No Biometric Enrolled</Text>
          <Text style={styles.subtitle}>Please set up fingerprint or face unlock in your device settings first, then return here.</Text>
          <TouchableOpacity style={styles.btn} onPress={handleSkip}>
            <Text style={styles.btnText}>Continue with PIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const typeLabel = status.types.includes('face') ? 'Face ID' :
                    status.types.includes('fingerprint') ? 'Fingerprint' :
                    status.types.includes('iris') ? 'Iris Scan' : 'Biometric';

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Ionicons name="finger-print" size={80} color="#10b981" />
        <Text style={styles.title}>Enable {typeLabel}</Text>
        <Text style={styles.subtitle}>
          Use {typeLabel.toLowerCase()} to quickly unlock MTAA instead of entering your PIN every time.
        </Text>

        <View style={styles.benefits}>
          <View style={styles.benefit}>
            <Ionicons name="flash-outline" size={20} color="#10b981" />
            <Text style={styles.benefitText}>Faster unlock</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
            <Text style={styles.benefitText}>Secure & convenient</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="refresh-outline" size={20} color="#10b981" />
            <Text style={styles.benefitText}>PIN always works as backup</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleEnable} disabled={enrolling}>
          {enrolling ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enable {typeLabel}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#f8fafc', marginTop: 24 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 12, textAlign: 'center', lineHeight: 20 },
  benefits: { marginTop: 32, gap: 12, width: '100%' },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', padding: 14, borderRadius: 12 },
  benefitText: { color: '#e2e8f0', fontSize: 14 },
  btn: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 16, alignItems: 'center', width: '100%', marginTop: 32 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skipBtn: { marginTop: 16 },
  skipText: { color: '#64748b', fontSize: 14, fontWeight: '500' },
});
