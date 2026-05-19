import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'

import { router } from 'expo-router'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth-store'

export default function LoginScreen() {
  const setUser = useAuthStore((s) => s.setUser)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const signIn = async () => {
    try {
      setLoading(true)

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (error) {
        Alert.alert('Login Failed', error.message)
        return
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
        })

        router.replace('/(os)/launcher')
      }
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        MTAA OS
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        style={styles.input}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={signIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Sign In
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/signup')}
      >
        <Text style={styles.link}>
          Create Account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push('/(os)/auth/reset-password')
        }
      >
        <Text style={styles.link}>
          Forgot Password?
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    padding: 24,
  },

  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 32,
  },

  input: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
  },

  button: {
    backgroundColor: '#6366f1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  link: {
    color: '#6366f1',
    marginTop: 20,
    textAlign: 'center',
  },
})
