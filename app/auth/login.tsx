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
import { hasPin } from '@/lib/security/pin-engine';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const { signIn } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;

      // ✅ Check if PIN is set
      const pinSet = await hasPin();
      if (!pinSet) {
        // No PIN → redirect to set PIN
        router.replace('/auth/set-pin');
      } else {
        // PIN exists → go to OS
        router.replace('/(os)');
      }
    } catch (e: any) {
      Alert.alert('Login Failed', e?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.textDark]}>Welcome Back</Text>

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

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
        <Text style={[styles.link, isDark && styles.linkDark]}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/signup')}>
        <Text style={[styles.link, isDark && styles.linkDark]}>
          Don't have an account? Sign up
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
