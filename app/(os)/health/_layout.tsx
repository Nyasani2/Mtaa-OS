import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useHealthAuth } from '@/lib/health/hooks/useHealthAuth';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function HealthLayout() {
  const { user } = useAuthStore();
  const { state, loading, isAuthenticated, authBiometric, authPin, pinSet, setupPin } = useHealthAuth();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user]);

  useEffect(() => {
    checkPinSetup();
  }, []);

  async function checkPinSetup() {
    const hasPin = await pinSet();
    if (!hasPin) setSetupMode(true);
  }

  async function handleBiometric() {
    const ok = await authBiometric();
    if (!ok) setShowPin(true);
  }

  async function handlePinSubmit() {
    if (setupMode) {
      if (!confirmPin) {
        setConfirmPin(pin);
        setPin('');
        return;
      }
      if (pin !== confirmPin) {
        setPin('');
        setConfirmPin('');
        return;
      }
      await setupPin(pin);
      setSetupMode(false);
      setPin('');
      setConfirmPin('');
      return;
    }
    const ok = await authPin(pin);
    if (ok) {
      setPin('');
      setShowPin(false);
    } else {
      setPin('');
    }
  }

  if (!user) return null;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.lockCard}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.title}>MTAA Health</Text>
          <Text style={styles.subtitle}>Secure Health Vault</Text>

          {setupMode ? (
            <View style={styles.pinSection}>
              <Text style={styles.pinLabel}>
                {confirmPin ? 'Confirm your 6-digit PIN' : 'Create a 6-digit Health PIN'}
              </Text>
              <View style={styles.pinDisplay}>
                {[0,1,2,3,4,5].map(i => (
                  <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
                ))}
              </View>
              <View style={styles.keypad}>
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <TouchableOpacity key={n} style={styles.key} onPress={() => pin.length < 6 && setPin(p => p + n)}>
                    <Text style={styles.keyText}>{n}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.key} onPress={() => setPin(p => p.slice(0, -1))}>
                  <Text style={styles.keyText}>⌫</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={() => pin.length < 6 && setPin(p => p + '0')}>
                  <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={handlePinSubmit}>
                  <Text style={styles.keyText}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.bioButton} onPress={handleBiometric}>
                <Text style={styles.bioText}>🔐 Unlock with Biometric</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPin(true)}>
                <Text style={styles.pinLink}>Use Health PIN</Text>
              </TouchableOpacity>

              {showPin && (
                <View style={styles.pinSection}>
                  <View style={styles.pinDisplay}>
                    {[0,1,2,3,4,5].map(i => (
                      <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
                    ))}
                  </View>
                  <View style={styles.keypad}>
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                      <TouchableOpacity key={n} style={styles.key} onPress={() => pin.length < 6 && setPin(p => p + n)}>
                        <Text style={styles.keyText}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.key} onPress={() => setPin(p => p.slice(0, -1))}>
                      <Text style={styles.keyText}>⌫</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.key} onPress={() => pin.length < 6 && setPin(p => p + '0')}>
                      <Text style={styles.keyText}>0</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.key} onPress={handlePinSubmit}>
                      <Text style={styles.keyText}>→</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          <TouchableOpacity style={styles.emergencyBtn} onPress={() => router.push('/(os)/health/emergency-access')}>
            <Text style={styles.emergencyText}>🚨 Emergency Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="home/index" />
      <Stack.Screen name="timeline/index" />
      <Stack.Screen name="emergency/index" />
      <Stack.Screen name="emergency-access/index" />
      <Stack.Screen name="share/index" />
      <Stack.Screen name="children/index" />
      <Stack.Screen name="emergency-card/index" />
      <Stack.Screen name="appointments/index" />
      <Stack.Screen name="medications/index" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  lockCard: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 30, width: '100%', maxWidth: 400, alignItems: 'center' },
  lockIcon: { fontSize: 48, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  bioButton: { backgroundColor: '#007AFF', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, marginBottom: 12, width: '100%' },
  bioText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  pinLink: { color: '#007AFF', fontSize: 14, marginBottom: 16 },
  pinSection: { width: '100%', alignItems: 'center', marginTop: 12 },
  pinLabel: { color: '#fff', fontSize: 14, marginBottom: 12 },
  pinDisplay: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  pinDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#555' },
  pinDotFilled: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, width: 240 },
  key: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  keyText: { color: '#fff', fontSize: 22, fontWeight: '500' },
  emergencyBtn: { marginTop: 20, paddingVertical: 10 },
  emergencyText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
});
