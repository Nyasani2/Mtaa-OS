import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function BiometricEnrollScreen() {
  const router = useRouter();
  const { setBiometricEnabled } = useAuthStore();
  const [available, setAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      Alert.alert('Not Supported', 'Your device does not support biometric authentication.');
      return;
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      Alert.alert(
        'Biometric Not Set Up',
        'Please set up Face ID or Fingerprint in your device settings first.',
        [
          { text: 'Continue Without', onPress: () => router.replace('/(os)') },
          { text: 'Open Settings', onPress: () => { /* Open settings */ } },
        ]
      );
      return;
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const typeNames = [];
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      typeNames.push('Face ID');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      typeNames.push('Fingerprint');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      typeNames.push('Iris');
    }

    setAvailable(true);
    setBiometryType(typeNames.join(' / ') || 'Biometric');
  };

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Confirm ${biometryType} to enable biometric login`,
        fallbackLabel: 'Use PIN instead',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setBiometricEnabled(true);

        // Store biometric enrollment in Supabase
        const { error } = await supabase
          .from('device_trust')
          .upsert({
            device_id: await getDeviceId(),
            biometric_enrolled: true,
            biometric_type: biometryType,
            enrolled_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Biometric enrollment sync failed:', error);
        }

        Alert.alert(
          'Biometric Enabled',
          `${biometryType} has been enabled for quick and secure login.`,
          [{ text: 'Continue', onPress: () => router.replace('/(os)') }]
        );
      } else {
        Alert.alert('Enrollment Failed', 'Biometric verification was cancelled or failed.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to enable biometric authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Biometric?',
      'You can enable biometric authentication later in Settings > Security.',
      [
        { text: 'Enable Now', style: 'cancel' },
        { text: 'Skip', onPress: () => router.replace('/(os)') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={biometryType.includes('Face') ? 'scan-outline' : 'finger-print-outline'}
          size={80}
          color="#00d4aa"
        />
      </View>

      <Text style={styles.title}>Enable {biometryType}</Text>
      <Text style={styles.subtitle}>
        Use {biometryType} for quick and secure access to your MTAA wallet and apps.
        Your biometric data never leaves your device.
      </Text>

      <View style={styles.features}>
        <FeatureRow
          icon="shield-checkmark-outline"
          title="Enhanced Security"
          description="Biometric data is encrypted and stored only on your device"
        />
        <FeatureRow
          icon="flash-outline"
          title="Quick Access"
          description="Unlock your wallet in seconds without typing your PIN"
        />
        <FeatureRow
          icon="lock-closed-outline"
          title="Privacy First"
          description="MTAA never sees or stores your biometric data"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, !available && styles.buttonDisabled]}
        onPress={handleEnroll}
        disabled={!available || loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Enable {biometryType}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Enable Later</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon as any} size={24} color="#00d4aa" style={styles.featureIcon} />
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00d4aa15',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  features: {
    gap: 20,
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#00d4aa',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    color: '#888',
    fontSize: 14,
  },
});

// Helper — device ID for biometric enrollment sync
async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync('mtaa_device_id_v2');
  if (!deviceId) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    deviceId = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync('mtaa_device_id_v2', deviceId);
  }
  return deviceId;
}

import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
