// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HookupProfileSetup() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');

  const handleContinue = () => {
    if (username.length < 3) {
      Alert.alert('Validation Error', 'Username must be at least 3 characters');
      return;
    }
    if (phone.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return;
    }
    // Proceed to next step or save profile
    router.push('/(os)/hookup/discovery');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Complete Your Profile</Text>
      <Text style={styles.headerSubtitle}>Let's get you set up for a safe and great experience.</Text>

      {/* Username Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Choose a unique username"
          placeholderTextColor="#666"
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))} // Forces lowercase, blocks special chars
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />
        {username.length > 0 && username.length < 3 && (
          <Text style={styles.errorText}>Username must be at least 3 characters</Text>
        )}
      </View>

      {/* Phone Number Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+254 7XX XXX XXX"
          placeholderTextColor="#666"
          value={phone}
          onChangeText={(text) => setPhone(text.replace(/[^0-9+]/g, ''))} // Only allows numbers and +
          keyboardType="phone-pad"
          maxLength={15}
        />
      </View>

      <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
        <Text style={styles.continueBtnText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 24, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: '#94a3b8', marginBottom: 32 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#cbd5e1', marginBottom: 8 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorText: { color: '#ef4444', fontSize: 13, marginTop: 6, fontWeight: '500' },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
