import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaWrapper } from '../../components/ui/SafeAreaWrapper';
import { Card } from '../../components/ui/Card';

const simTools = [
  { id: 'ussd', label: 'USSD Codes', icon: 'hashtag', color: '#1E40AF', desc: 'Run USSD commands' },
  { id: 'airtime', label: 'Airtime', icon: 'credit-card', color: '#059669', desc: 'Check balance & top-up' },
  { id: 'data', label: 'Data Bundles', icon: 'wifi', color: '#7C3AED', desc: 'Manage data plans' },
  { id: 'info', label: 'SIM Info', icon: 'sim-card', color: '#D97706', desc: 'SIM card details' },
];

export default function SimIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>SIM Tools</Text>
        <Text style={styles.subtitle}>Manage your SIM card and mobile services</Text>
        <View style={styles.toolsGrid}>
          {simTools.map((tool) => (
            <TouchableOpacity key={tool.id} style={styles.toolCard} onPress={() => {}}>
              <View style={[styles.iconBox, { backgroundColor: tool.color + '15' }]}>
                <FontAwesome5 name={tool.icon} size={24} color={tool.color} />
              </View>
              <Text style={styles.toolLabel}>{tool.label}</Text>
              <Text style={styles.toolDesc}>{tool.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Card title="Check Balance" subtitle="*144#" icon="phone" iconColor="#059669" onPress={() => {}} />
          <Card title="Buy Data" subtitle="*544#" icon="wifi" iconColor="#7C3AED" onPress={() => {}} />
          <Card title="Send Money" subtitle="M-Pesa" icon="money-bill-wave" iconColor="#1E40AF" onPress={() => router.push('/(os)/wallet/send')} />
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 20 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  toolCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  toolLabel: { fontSize: 14, fontWeight: '700', color: '#334155' },
  toolDesc: { fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 12 },
});
