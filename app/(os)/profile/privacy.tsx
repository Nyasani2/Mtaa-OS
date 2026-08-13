import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { biometricEngine } from '@/lib/security/biometric-engine';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();
  const {
    user,
    pinSet,
    biometricEnabled,
    setBiometricEnabled,
    clearPin,
    isEmailVerified,
  } = useAuthStore();

  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const hasHardware = await biometricEngine.hasHardwareAsync();
    const isEnrolled = await biometricEngine.isEnrolledAsync();
    setBioAvailable(hasHardware);
    setBioEnrolled(isEnrolled);
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value && !bioEnrolled) {
      Alert.alert(
        'Biometric Not Set Up',
        'Please enroll biometric authentication in your device settings first.',
        [{ text: 'OK' }]
      );
      return;
    }
    await setBiometricEnabled(value);
  };

  const handleRemovePin = () => {
    Alert.alert(
      'Remove PIN?',
      'This will disable app lock and biometric login. Your account will be less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await clearPin();
            Alert.alert('PIN Removed', 'App lock has been disabled.');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'keypad-outline',
      label: 'Change PIN',
      subtitle: pinSet ? 'PIN is set' : 'No PIN set',
      route: '/settings/pin',
    },
    {
      icon: 'finger-print-outline',
      label: 'Biometric Login',
      subtitle: biometricEnabled
        ? 'Enabled'
        : bioAvailable
        ? 'Disabled'
        : 'Not available on this device',
      route: '/settings/biometric',
    },
    {
      icon: 'phone-portrait-outline',
      label: 'Trusted Devices',
      subtitle: 'Manage registered devices',
      route: '/settings/devices',
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Security Center',
      subtitle: 'Audit logs & security tests',
      route: '/settings/security-audit',
    },
    {
      icon: 'mail-outline',
      label: 'Two-Factor Authentication',
      subtitle: isEmailVerified ? 'Email verified' : 'Email not verified',
      route: null,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Privacy & Security</Text>
        <Text style={styles.subtitle}>Manage your account security</Text>
      </View>

      <View style={styles.section}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => item.route && router.push(item.route as any)}
            disabled={!item.route}
          >
            <Ionicons name={item.icon as any} size={22} color="#ffffff" style={styles.icon} />
            <View style={styles.textContainer}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.subtitleText}>{item.subtitle}</Text>
            </View>
            {item.route && (
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {pinSet && (
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.dangerButton} onPress={handleRemovePin}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={styles.dangerText}>Remove PIN</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          MTAA uses your device PIN and biometric data only for local authentication. No biometric data is stored on our servers.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  section: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  icon: {
    marginRight: 12,
    width: 28,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  dangerSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  dangerText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
