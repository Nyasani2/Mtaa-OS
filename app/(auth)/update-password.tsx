// Set recovery flag IMMEDIATELY on module load — before any auth listeners fire
if (typeof window !== 'undefined') {
  sessionStorage.setItem('mtaa_in_recovery', 'true');
}

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'checking' | 'form' | 'updating' | 'success' | 'error'>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;

    const handleRecovery = async () => {
      try {
        // Check hash for errors first
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          if (mounted) {
            setErrorMsg(errorDescription || error);
            setStep('error');
          }
          return;
        }

        // Supabase client auto-consumes access_token from hash on load.
        // Verify a session exists.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          if (mounted) {
            setErrorMsg(sessionError.message);
            setStep('error');
          }
          return;
        }

        if (!session) {
          // Wait briefly for Supabase to process hash, then retry once
          await new Promise((r) => setTimeout(r, 1200));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (!retrySession) {
            if (mounted) {
              setErrorMsg('This password reset link is invalid or has expired. Please request a new one.');
              setStep('error');
            }
            return;
          }
        }

        if (mounted) {
          setStep('form');
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMsg(err?.message || 'Something went wrong');
          setStep('error');
        }
      }
    };

    handleRecovery();

    // Listen for auth state changes as backup
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && mounted) {
        setStep('form');
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      // Clean up recovery flag on unmount
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('mtaa_in_recovery');
      }
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Alert.alert('Too short', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    setStep('updating');
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      Alert.alert('Update failed', error.message);
      setStep('form');
      return;
    }

    // Clear recovery flag — user is done
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mtaa_in_recovery');
    }
    setStep('success');
  };

  if (step === 'checking') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.subtitle}>Verifying reset link...</Text>
      </View>
    );
  }

  if (step === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Link Expired</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/forgot-password')}>
          <Text style={styles.buttonText}>Request New Link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/login')}>
          <Text style={styles.secondaryButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'success') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Password Updated</Text>
        <Text style={styles.subtitle}>Your password has been changed successfully.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>Enter a new password for your account.</Text>

      <TextInput
        style={styles.input}
        placeholder="New password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm new password"
        placeholderTextColor="#888"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={[styles.button, step === 'updating' && { opacity: 0.6 }]}
        onPress={handleUpdatePassword}
        disabled={step === 'updating'}
      >
        {step === 'updating' ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/login')}>
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  button: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    padding: 12,
  },
  secondaryButtonText: {
    color: '#00d4ff',
    fontSize: 14,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
});
