import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function SignupScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const { signUp } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) throw error;

      // ✅ SUCCESS: Redirect to set PIN (not login)
      Alert.alert('Success', 'Account created! Now set your PIN.', [
        { text: 'Continue', onPress: () => router.replace('/auth/set-pin') }
      ]);
    } catch (e: any) {
      Alert.alert('Signup Failed', e?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.textDark]}>Create Account</Text>

      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="Email"
        placeholderTextColor={isDark ? '#888' : '#999'}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="Password"
        placeholderTextColor={isDark ? '#888' : '#999'}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="Confirm Password"
        placeholderTextColor={isDark ? '#888' : '#999'}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/auth/login')}>
        <Text style={[styles.link, isDark && styles.linkDark]}>
          Already have an account? Log in
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#0f0f0f' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  textDark: { color: '#fff' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 16, marginBottom: 12, fontSize: 16,
  },
  inputDark: { borderColor: '#333', color: '#fff', backgroundColor: '#1a1a1a' },
  button: {
    backgroundColor: '#ef4444', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { marginTop: 16, textAlign: 'center', color: '#ef4444' },
  linkDark: { color: '#f87171' },
});
