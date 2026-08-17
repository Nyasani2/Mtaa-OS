import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PhoneVerifyScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!phone || phone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1500);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      router.push('/wallet/onboarding/pin-create');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 1 of 3</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {step === 'phone' ? 'Enter Your Phone Number' : 'Verify Your Phone'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'phone' 
            ? 'We will send a verification code to confirm your number.'
            : 'Enter the 6-digit code sent to your phone.'}
        </Text>

        {step === 'phone' ? (
          <View style={styles.inputContainer}>
            <View style={styles.phoneInput}>
              <Text style={styles.countryCode}>+254</Text>
              <TextInput
                style={styles.input}
                placeholder="712 345 678"
                placeholderTextColor="#666666"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={12}
              />
            </View>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#666666"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
              textAlign="center"
            />
            <TouchableOpacity onPress={handleSendOTP}>
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={step === 'phone' ? handleSendOTP : handleVerifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {step === 'phone' ? 'Send Code' : 'Verify'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 },
  backButton: { color: '#00D68F', fontSize: 16, fontWeight: '500' },
  stepIndicator: { color: '#888888', fontSize: 14 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#888888', marginBottom: 32, lineHeight: 24 },
  inputContainer: { gap: 16 },
  phoneInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, paddingHorizontal: 16, height: 56 },
  countryCode: { color: '#00D68F', fontSize: 16, fontWeight: '600', marginRight: 12 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 16 },
  otpInput: { backgroundColor: '#1A1A1A', borderRadius: 12, paddingHorizontal: 16, height: 56, color: '#FFFFFF', fontSize: 24, letterSpacing: 8 },
  resendText: { color: '#00D68F', fontSize: 14, textAlign: 'center', marginTop: 16 },
  errorText: { color: '#FF4444', fontSize: 14, marginTop: 12 },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  primaryButton: { backgroundColor: '#00D68F', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: '#0A0A0A', fontSize: 16, fontWeight: '700' },
});

