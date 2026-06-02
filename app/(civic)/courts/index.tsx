import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COURT_SERVICES = [
  { id: 'cases', name: 'My Cases', icon: 'folder-open', color: '#3B82F6', desc: 'View your court cases' },
  { id: 'schedule', name: 'Hearings', icon: 'calendar', color: '#F59E0B', desc: 'Upcoming hearings' },
  { id: 'file', name: 'File Case', icon: 'document-text', color: '#10B981', desc: 'Submit new case' },
  { id: 'judges', name: 'Judges', icon: 'person', color: '#8B5CF6', desc: 'Judge directory' },
  { id: 'fees', name: 'Court Fees', icon: 'cash', color: '#EC4899', desc: 'Pay court fees' },
  { id: 'records', name: 'Records', icon: 'archive', color: '#6B7280', desc: 'Access court records' },
];

export default function CourtsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [caseNumber, setCaseNumber] = useState('');

  const handleService = (service: string) => {
    Alert.alert('Coming Soon', `${service} module will be available in the next update`);
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Court Services</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Find Your Case</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Case number or party name"
                placeholderTextColor="#64748B"
                value={caseNumber}
                onChangeText={setCaseNumber}
              />
              <TouchableOpacity style={styles.checkBtn} onPress={() => handleService('search')}>
                <Ionicons name="search" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesGrid}>
            {COURT_SERVICES.map(service => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleService(service.id)}
              >
                <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
                  <Ionicons name={service.icon as any} size={26} color={service.color} />
                </View>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDesc}>{service.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceName: { fontSize: 14, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  serviceDesc: { fontSize: 12, color: '#94A3B8' },
});
