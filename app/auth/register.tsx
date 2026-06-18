// app/auth/register.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useIdentity } from '@/lib/auth/identity';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Too weak', color: '#ef4444' },
    { label: 'Weak', color: '#f97316' },
    { label: 'Fair', color: '#eab308' },
    { label: 'Good', color: '#22c55e' },
    { label: 'Strong', color: '#16a34a' },
    { label: 'Very strong', color: '#15803d' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
}

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useIdentity();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '#ddd' });

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordStrength(getPasswordStrength(text));
  };

  const handleRegister = async () => {
    // Input validation
    if (!name.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }
    if (!/^\+?[0-9\s-]{10,}$/.test(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (passwordStrength.score < 2) {
      Alert.alert('Error', 'Password is too weak. Add uppercase, numbers, or symbols.');
      return;
    }

    setLoading(true);
    const { error, success } = await signUp(email.trim(), password, { phone: phone.trim(), full_name: name.trim() });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error);
      return;
    }

    if (success) {
      Alert.alert(
        'Verify Your Email',
        'Account created. Please check your email and verify before signing in.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } else {
      Alert.alert('Success', 'Account created. Please set your PIN.', [
        { text: 'Set PIN', onPress: () => router.replace('/auth/set-pin') },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Account</Text>
      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={handlePasswordChange}
        secureTextEntry
      />
      {password.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={[styles.strengthBar, { width: `${(passwordStrength.score / 5) * 100}%`, backgroundColor: passwordStrength.color }]} />
          <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/auth/login')}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#2563eb', textAlign: 'center', marginTop: 16, fontSize: 14 },
  strengthContainer: { marginBottom: 12 },
  strengthBar: { height: 4, borderRadius: 2, marginBottom: 4 },
  strengthText: { fontSize: 12, fontWeight: '500' },
});
