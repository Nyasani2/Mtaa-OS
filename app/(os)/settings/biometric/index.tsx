import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '@/lib/auth/useAuth';

export default function BiometricScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    setIsAvailable(compatible && enrolled);

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType('Face ID');
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType('Fingerprint');
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      setBiometricType('Iris');
    } else {
      setBiometricType('Biometric');
    }
  };

  const toggleBiometric = async () => {
    if (!isAvailable) {
      Alert.alert('Not Available', 'Biometric authentication is not set up on this device.');
      return;
    }

    if (!isEnabled) {
      // Enabling — authenticate first
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric login',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        setIsEnabled(true);
        // Save preference to profile or secure storage
        Alert.alert('Enabled', `${biometricType} login is now enabled.`);
      }
    } else {
      // Disabling
      setIsEnabled(false);
      Alert.alert('Disabled', `${biometricType} login has been disabled.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Biometric Login</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Ionicons name="finger-print" size={28} color="#6366f1" />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.label}>{biometricType || 'Biometric'} Login</Text>
            <Text style={styles.sublabel}>
              {isAvailable 
                ? `Use ${biometricType || 'biometric'} to unlock the app` 
                : 'Not available on this device'}
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={toggleBiometric}
            trackColor={{ false: '#374151', true: '#6366f1' }}
            thumbColor={isEnabled ? '#fff' : '#9ca3af'}
            disabled={!isAvailable}
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#6b7280" />
        <Text style={styles.infoText}>
          Biometric login allows you to quickly access your account without entering your PIN. 
          Your biometric data never leaves this device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginHorizontal: 16, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(99,102,241,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textCol: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: '#fff' },
  sublabel: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginHorizontal: 16, marginTop: 16, gap: 12 },
  infoText: { flex: 1, color: '#6b7280', fontSize: 13, lineHeight: 20 },
});
