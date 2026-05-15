import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store/auth-store';

export default function MFASetup() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [method, setMethod] = useState<'totp' | 'sms'>('totp');

  const enableMFA = async () => {
    setLoading(true);

    try {
      if (method === 'totp') {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
        });

        if (error) throw error;

        Alert.alert(
          'TOTP MFA Enabled',
          `Scan the QR code in your authenticator app.\n\nSecret: ${data?.totp?.secret || 'Unavailable'}`,
          [
            {
              text: 'Done',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          'SMS MFA',
          'SMS verification enabled (demo mode)'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to enable MFA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multi-Factor Authentication</Text>

      <Text style={styles.subtitle}>
        Secure your MTAA account with additional verification.
      </Text>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Enable MFA</Text>

        <Switch
          value={mfaEnabled}
          onValueChange={setMfaEnabled}
          trackColor={{
            false: '#334155',
            true: '#10b981',
          }}
        />
      </View>

      <View style={styles.methodsContainer}>
        <TouchableOpacity
          style={[
            styles.methodButton,
            method === 'totp' && styles.activeMethod,
          ]}
          onPress={() => setMethod('totp')}
        >
          <Text style={styles.methodText}>
            Authenticator App (TOTP)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.methodButton,
            method === 'sms' && styles.activeMethod,
          ]}
          onPress={() => setMethod('sms')}
        >
          <Text style={styles.methodText}>
            SMS Verification
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.activateButton,
          (!mfaEnabled || loading) && styles.disabledButton,
        ]}
        onPress={enableMFA}
        disabled={!mfaEnabled || loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.activateText}>
            ACTIVATE MFA PROTECTION
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 24,
    justifyContent: 'center',
  },

  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },

  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 22,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },

  label: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },

  methodsContainer: {
    gap: 16,
    marginBottom: 32,
  },

  methodButton: {
    backgroundColor: '#111827',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  activeMethod: {
    borderColor: '#10b981',
    backgroundColor: '#052e2b',
  },

  methodText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  activateButton: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.5,
  },

  activateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
