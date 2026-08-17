import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingLanding() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>MTAA</Text>
        </View>

        <Text style={styles.title}>Your Financial Future Starts Here</Text>
        <Text style={styles.subtitle}>
          Send money, pay merchants, save, and build your financial reputation — all from one wallet.
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureText}>Send & Receive Money</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🏪</Text>
            <Text style={styles.featureText}>Pay Merchants</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📈</Text>
            <Text style={styles.featureText}>Save & Grow</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureText}>Secure & Regulated</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/wallet/onboarding/phone-verify')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoText: { fontSize: 48, fontWeight: '800', color: '#00D68F' },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#888888', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  features: { gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 24 },
  featureText: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
  primaryButton: { backgroundColor: '#00D68F', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#0A0A0A', fontSize: 16, fontWeight: '700' },
  secondaryButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333333' },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
});

