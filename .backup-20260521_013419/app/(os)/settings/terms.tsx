// app/(os)/settings/terms.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  const router = useRouter();

  const sections = [
    {
      title: 'Acceptance of Terms',
      content: 'By accessing or using MTAA OS, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform. These terms constitute a legally binding agreement.',
    },
    {
      title: 'Eligibility',
      content: 'You must be at least 13 years old to use MTAA OS. Users aged 13-18 require parental consent. You must provide accurate, current, and complete information during registration.',
    },
    {
      title: 'Account Security',
      content: 'You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately of any unauthorized use. We are not liable for losses from your failure to secure your account.',
    },
    {
      title: 'Wallet & Payments',
      content: 'Transactions are processed through licensed payment providers. You authorize us to debit/credit your linked accounts. All fees are displayed before confirmation. Disputes must be filed within 30 days.',
    },
    {
      title: 'Health Services',
      content: 'MTAA Health facilitates connections with licensed healthcare providers. We do not provide medical advice. Always consult qualified professionals. Emergency services are subject to availability and location.',
    },
    {
      title: 'Prohibited Activities',
      content: 'You may not: (1) Use the platform for illegal purposes, (2) Impersonate others, (3) Distribute malware, (4) Attempt unauthorized access, (5) Harass other users, (6) Manipulate transactions or ratings.',
    },
    {
      title: 'Intellectual Property',
      content: 'All MTAA OS content, trademarks, and technology are owned by MTAA Technologies. You may not copy, modify, distribute, or create derivative works without written permission.',
    },
    {
      title: 'Termination',
      content: 'We may suspend or terminate your account for violations of these terms. You may delete your account at any time through settings. Outstanding obligations survive termination.',
    },
    {
      title: 'Limitation of Liability',
      content: 'MTAA Technologies is not liable for indirect, incidental, or consequential damages. Our total liability is limited to fees paid in the 12 months preceding the claim. Some jurisdictions do not allow these limitations.',
    },
    {
      title: 'Governing Law',
      content: 'These terms are governed by the laws of the Republic of Kenya. Disputes shall be resolved through arbitration in Nairobi under CIArb rules. Both parties waive class action rights.',
    },
    {
      title: 'Changes to Terms',
      content: 'We may modify these terms at any time. Changes take effect 30 days after posting. Continued use after changes constitutes acceptance. Material changes will be notified via email.',
    },
    {
      title: 'Contact',
      content: 'For legal inquiries, contact legal@mtaa.africa. For general support, use the in-app help center or email support@mtaa.africa.',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
