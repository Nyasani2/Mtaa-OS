// app/(os)/settings/privacy.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();

  const sections = [
    {
      title: 'Data Collection',
      content: 'We collect information you provide directly (name, email, phone, ID), transaction data, device information, and usage analytics. Health data is encrypted and only accessible to authorized medical personnel.',
    },
    {
      title: 'Data Usage',
      content: 'Your data is used to provide services, process transactions, verify identity, improve our platform, and comply with legal obligations. We never sell your personal data to third parties.',
    },
    {
      title: 'Data Storage',
      content: 'All data is stored in encrypted form on Supabase infrastructure with Row Level Security (RLS). Health records use additional encryption layers. Data is hosted in African data centers.',
    },
    {
      title: 'Your Rights',
      content: 'You have the right to access, correct, delete, or export your data. Contact support@mtaa.africa for data requests. You may also revoke app permissions at any time.',
    },
    {
      title: 'Third Parties',
      content: 'We share data only with: (1) Payment processors for transactions, (2) Healthcare providers you authorize, (3) Government agencies when legally required, (4) Analytics services (anonymized).',
    },
    {
      title: 'Security',
      content: 'We use industry-standard encryption (AES-256), secure authentication (OAuth 2.0 + JWT), biometric login options, and regular security audits. All API calls are authenticated and rate-limited.',
    },
    {
      title: 'Cookies & Tracking',
      content: 'We use essential cookies for authentication and session management. Analytics cookies are optional and can be disabled in settings. We do not use third-party advertising trackers.',
    },
    {
      title: 'Children',
      content: 'MTAA OS is not intended for users under 13. Parental consent is required for users aged 13-18. Health services for minors require guardian authorization.',
    },
    {
      title: 'Changes',
      content: 'We may update this policy periodically. Significant changes will be notified via app notification and email. Continued use constitutes acceptance of the updated policy.',
    },
    {
      title: 'Contact',
      content: 'For privacy concerns, contact our Data Protection Officer at privacy@mtaa.africa or through the in-app support system.',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: May 20, 2024</Text>
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  content: { flex: 1, padding: 16 },
  lastUpdated: { fontSize: 12, color: '#94A3B8', marginBottom: 16, textAlign: 'center' },
  section: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  sectionContent: { fontSize: 14, color: '#475569', lineHeight: 22 },
});
