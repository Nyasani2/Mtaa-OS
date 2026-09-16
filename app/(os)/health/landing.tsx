import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function HealthOSLanding() {
  const router = useRouter();
  const { user, verifyPin } = useAuthStore(); // Use the SAME PIN engine as OS
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [entryType, setEntryType] = useState<'patient' | 'staff' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');

  const handleEntrySelect = (type: 'patient' | 'staff') => {
    setEntryType(type);
    setPinDialogOpen(true);
    setPinInput('');
    setError('');
  };

  const verifyPinAndNavigate = async () => {
    if (!user?.id || !entryType) return;
    try {
      // Use the SAME verifyPin from auth store (same as OS lock screen)
      const isValid = await verifyPin(pinInput);
      if (isValid) {
        setPinDialogOpen(false);
        if (entryType === 'patient') {
          router.push('/(os)/health/patient/dashboard');
        } else {
          router.push('/(os)/health/staff/dashboard');
        }
      } else {
        setError('Incorrect PIN. Please try again.');
        setPinInput('');
      }
    } catch (err) {
      setError('PIN verification failed. Please try again.');
      setPinInput('');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#14b8a6', '#0d9488', '#0f766e']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Ionicons name="medical" size={64} color="#ffffff" />
            <Text style={styles.title}>MTAA Health</Text>
            <Text style={styles.subtitle}>Your Health, Our Priority</Text>
          </View>

          <View style={styles.entryContainer}>
            <TouchableOpacity
              style={[styles.entryCard, styles.patientCard]}
              onPress={() => handleEntrySelect('patient')}
              activeOpacity={0.8}
            >
              <View style={styles.entryIconContainer}>
                <Ionicons name="person" size={48} color="#ffffff" />
              </View>
              <Text style={styles.entryTitle}>Patient</Text>
              <Text style={styles.entryDescription}>
                Access your medical records, book appointments, and manage your health
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.entryCard, styles.staffCard]}
              onPress={() => handleEntrySelect('staff')}
              activeOpacity={0.8}
            >
              <View style={styles.entryIconContainer}>
                <Ionicons name="medkit" size={48} color="#ffffff" />
              </View>
              <Text style={styles.entryTitle}>Healthcare Staff</Text>
              <Text style={styles.entryDescription}>
                Manage patients, appointments, and medical records
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Secure access with your MTAA OS PIN</Text>
            <View style={styles.securityBadges}>
              <Ionicons name="shield-checkmark" size={24} color="#14b8a6" />
              <Text style={styles.securityText}>HIPAA Compliant</Text>
            </View>
          </View>
        </ScrollView>

        {pinDialogOpen && (
          <View style={styles.pinOverlay}>
            <View style={styles.pinDialog}>
              <View style={styles.pinHeader}>
                <Ionicons 
                  name={entryType === 'patient' ? 'person' : 'medkit'} 
                  size={40} 
                  color="#14b8a6" 
                />
                <Text style={styles.pinTitle}>Enter PIN</Text>
                <Text style={styles.pinSubtitle}>
                  Use your MTAA OS lock screen PIN
                </Text>
              </View>

              <View style={styles.pinDotsContainer}>
                {[...Array(4)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.pinDot,
                      pinInput.length > index && styles.pinDotFilled
                    ]}
                  >
                    {pinInput.length > index && <View style={styles.pinDotInner} />}
                  </View>
                ))}
              </View>

              <View style={styles.pinInputContainer}>
                <View style={styles.pinButtons}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={styles.pinButton}
                      onPress={() => {
                        if (pinInput.length < 4) {
                          const newPin = pinInput + num;
                          setPinInput(newPin);
                          if (newPin.length === 4) {
                            setTimeout(verifyPinAndNavigate, 300);
                          }
                        }
                      }}
                    >
                      <Text style={styles.pinButtonText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setPinInput('');
                    setError('');
                    setPinDialogOpen(false);
                    setEntryType(null);
                  }}
                >
                  <Text style={styles.clearButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 40 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#ffffff', marginTop: 10, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  subtitle: { fontSize: 16, color: '#e5e7eb', marginTop: 5 },
  entryContainer: { gap: 20 },
  entryCard: { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  patientCard: { borderLeftWidth: 5, borderLeftColor: '#14b8a6' },
  staffCard: { borderLeftWidth: 5, borderLeftColor: '#0d9488' },
  entryIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#14b8a6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  entryTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  entryDescription: { fontSize: 14, color: '#6b7280', marginBottom: 16, lineHeight: 20 },
  footer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  footerText: { color: '#d1d5db', fontSize: 12, marginBottom: 8 },
  securityBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  securityText: { color: '#14b8a6', fontSize: 12, fontWeight: '600' },
  pinOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 1000 },
  pinDialog: { backgroundColor: '#ffffff', borderRadius: 20, padding: 30, width: '100%', maxWidth: 400, alignItems: 'center' },
  pinHeader: { alignItems: 'center', marginBottom: 30 },
  pinTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 12, textAlign: 'center' },
  pinSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  pinDotsContainer: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  pinDot: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  pinDotFilled: { borderColor: '#14b8a6', backgroundColor: '#f0fdfa' },
  pinDotInner: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#14b8a6' },
  pinInputContainer: { width: '100%', alignItems: 'center' },
  pinButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 20 },
  pinButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  pinButtonText: { fontSize: 24, fontWeight: '600', color: '#1f2937' },
  clearButton: { paddingVertical: 12, paddingHorizontal: 30 },
  clearButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#ef4444', fontSize: 14, marginTop: 12, textAlign: 'center' },
});
