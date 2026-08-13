import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { biometricEngine } from '@/lib/security/biometric-engine';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, user, session, isAuthenticated, pinSet, biometricEnabled } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    setIsLoading(true);
    setError('');
    const { error: signInError } = await signIn(email.trim(), password.trim());
    setIsLoading(false);
    if (signInError) {
      setError(signInError.message || 'Login failed');
      return;
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricEnabled || !user) {
      setError('Biometric login not enabled');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await biometricEngine.authenticateBiometric({
        promptMessage: 'Unlock MTAA',
        cancelLabel: 'Use Password',
      });
      if (result.success && session) {
        router.replace('/(os)');
      } else {
        setError('Biometric authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'Biometric error');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect logic after successful auth
  React.useEffect(() => {
    if (isAuthenticated) {
      if (!pinSet) {
        router.replace('/create-pin');
      } else {
        router.replace('/(os)');
      }
    }
  }, [isAuthenticated, pinSet]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>MTAA</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {biometricEnabled && (
          <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin}>
            <Text style={styles.biometricText}>🔓 Unlock with Biometric</Text>
          </TouchableOpacity>
        )}

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.links}>
          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.linkText}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  biometricButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  biometricText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  form: {
    gap: 12,
  },
  input: {
    height: 52,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 15,
  },
  button: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  linkText: {
    color: '#3b82f6',
    fontSize: 14,
  },
});
