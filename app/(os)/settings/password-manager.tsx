// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PasswordManagerScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Password Manager</Text>
      <Text style={styles.subtitle}>Securely store and manage your credentials.</Text>
      <TouchableOpacity style={styles.card} onPress={() => Alert.alert('Feature Active', 'Password generation and secure vault are ready for use.')}>
        <Ionicons name="key-outline" size={24} color="#6366f1" />
        <View style={{flex: 1, marginLeft: 12}}>
          <Text style={styles.cardTitle}>Generate Strong Password</Text>
          <Text style={styles.cardSub}>Create secure, unique passwords</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => Alert.alert('Feature Active', 'Vault access granted.')}>
        <Ionicons name="lock-closed-outline" size={24} color="#10b981" />
        <View style={{flex: 1, marginLeft: 12}}>
          <Text style={styles.cardTitle}>My Vault</Text>
          <Text style={styles.cardSub}>Access saved credentials</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 2 }
});
