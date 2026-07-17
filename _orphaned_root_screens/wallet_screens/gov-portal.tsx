import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const govServices = [
  { id: 'kra', name: 'KRA / Tax', icon: 'document-text', color: '#22C55E', route: '/(os)/wallet/tax' },
  { id: 'nhif', name: 'NHIF / Health', icon: 'medical', color: '#EF4444', route: '/(os)/health' },
  { id: 'nssf', name: 'NSSF / Pension', icon: 'shield-checkmark', color: '#3B82F6', route: '/(os)/wallet/savings-hub' },
  { id: 'ntsa', name: 'NTSA / Transport', icon: 'car', color: '#F59E0B', route: '/(os)/wallet' },
  { id: 'lands', name: 'Lands & Property', icon: 'map', color: '#8B5CF6', route: '/(os)/property' },
  { id: 'immigration', name: 'Immigration', icon: 'airplane', color: '#06B6D4', route: '/(civic)/immigration' },
];

export default function GovPortalScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Government Services</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Access government payments and services</Text>

        {govServices.map(service => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() => router.push(service.route as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: service.color + '20' }]}>
              <Ionicons name={service.icon as any} size={24} color={service.color} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDesc}>Tap to access</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  subtitle: { fontSize: 14, color: '#8E8E93', marginBottom: 16 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  serviceDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
});
