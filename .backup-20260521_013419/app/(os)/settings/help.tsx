// app/(os)/settings/help.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const helpSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket',
    color: '#3B82F6',
    articles: [
      { title: 'How to create an account', content: 'Download MTAA OS, tap Sign Up, enter your email and phone number, verify with OTP, complete KYC.' },
      { title: 'Setting up your wallet', content: 'Go to Wallet tab, tap Create Account, choose currency, set security PIN, link payment method.' },
      { title: 'Installing apps', content: 'Open App Store, browse categories, tap Install on any app. System apps are pre-installed.' },
    ],
  },
  {
    id: 'wallet',
    title: 'Wallet & Payments',
    icon: 'wallet',
    color: '#10B981',
    articles: [
      { title: 'How to send money', content: 'Open Wallet, tap Send, enter recipient phone/email or scan QR, enter amount, confirm with PIN.' },
      { title: 'Adding payment methods', content: 'Settings > Payment Methods > Add. Support M-Pesa, bank cards, bank transfers.' },
      { title: 'Transaction limits', content: 'Limits depend on KYC level. Level 1: 10K/day, Level 2: 100K/day, Level 3: Unlimited.' },
    ],
  },
  {
    id: 'health',
    title: 'Health Services',
    icon: 'medical',
    color: '#EF4444',
    articles: [
      { title: 'Booking appointments', content: 'Health tab > Appointments > Book. Select hospital, department, date, and time slot.' },
      { title: 'Emergency ambulance', content: 'Health tab > Ambulance. Enter location, select emergency type, confirm request.' },
      { title: 'Viewing medical records', content: 'Health tab > Medical Records. All visits, prescriptions, and lab results in one place.' },
    ],
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: 'shield-checkmark',
    color: '#8B5CF6',
    articles: [
      { title: 'Two-factor authentication', content: 'Settings > Security > Enable 2FA. Use SMS or authenticator app.' },
      { title: 'Biometric login', content: 'Settings > toggle Biometric Login. Requires fingerprint or face recognition.' },
      { title: 'Reporting fraud', content: 'Settings > Report a Bug > select Security Issue. Or call support immediately.' },
    ],
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filteredSections = helpSections.map(section => ({
    ...section,
    articles: section.articles.filter(a => 
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(s => s.articles.length > 0 || search === '');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search help articles..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.content}>
        {filteredSections.map(section => (
          <View key={section.id} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            >
              <View style={[styles.sectionIcon, { backgroundColor: section.color + '15' }]}>
                <Ionicons name={section.icon as any} size={24} color={section.color} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Ionicons
                name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>

            {expandedSection === section.id && (
              <View style={styles.articles}>
                {section.articles.map((article, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.article}
                    onPress={() => setExpandedArticle(expandedArticle === `${section.id}-${idx}` ? null : `${section.id}-${idx}`)}
                  >
                    <Text style={styles.articleTitle}>{article.title}</Text>
                    {expandedArticle === `${section.id}-${idx}` && (
                      <Text style={styles.articleContent}>{article.content}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <TouchableOpacity style={styles.contactButton} onPress={() => router.push('/settings/bug-report' as any)}>
            <Ionicons name="chatbubble" size={20} color="#FFF" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },
  content: { flex: 1, paddingHorizontal: 16 },
  section: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  sectionIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1E293B' },
  articles: { paddingHorizontal: 16, paddingBottom: 12 },
  article: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  articleTitle: { fontSize: 14, fontWeight: '500', color: '#475569' },
  articleContent: { fontSize: 13, color: '#64748B', marginTop: 8, lineHeight: 20 },
  contactSection: { alignItems: 'center', paddingVertical: 32 },
  contactTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  contactButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, gap: 8 },
  contactButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
