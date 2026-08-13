import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HelpSettingsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const faqs = [
    { q: 'How do I reset my PIN?', a: 'Go to Settings > Security > Change PIN. You will need your current PIN to set a new one.' },
    { q: 'How do I add money to my Wallet?', a: 'Open the Wallet app, tap Top Up, and choose your preferred payment method (M-Pesa, Bank, or Card).' },
    { q: 'How do I book a ride?', a: 'Open MTaxi, enter your destination, choose a ride type, and confirm the booking.' },
    { q: 'How do I contact support?', a: 'You can reach us via the chat button below, email at support@mtaa.io, or call +254 700 000 000.' },
    { q: 'How do I delete my account?', a: 'Go to Settings > Profile > Delete Account. This action is permanent and cannot be undone.' },
    { q: 'Is my data secure?', a: 'Yes. MTAA OS uses end-to-end encryption, biometric authentication, and complies with GDPR and local data protection laws.' },
  ];

  const guides = [
    { icon: 'wallet-outline', title: 'Getting Started with Wallet', color: '#10B981' },
    { icon: 'car-outline', title: 'How to Use MTaxi', color: '#06B6D4' },
    { icon: 'medical-outline', title: 'Health App Guide', color: '#EF4444' },
    { icon: 'school-outline', title: 'Education Features', color: '#8B5CF6' },
  ];

  const filteredFaqs = faqs.filter((f: any) => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={s.searchBox}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={s.searchInput}
              placeholder="Search help articles..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Contact Cards */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20, gap: 12 }}>
          <TouchableOpacity style={[s.contactCard, { flex: 1 }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#6366f1" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 }}>Live Chat</Text>
            <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>24/7 Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.contactCard, { flex: 1 }]}>
            <Ionicons name="mail-outline" size={28} color="#10B981" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 }}>Email</Text>
            <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>support@mtaa.io</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.contactCard, { flex: 1 }]}>
            <Ionicons name="call-outline" size={28} color="#F59E0B" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 }}>Call</Text>
            <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>+254 700 000 000</Text>
          </TouchableOpacity>
        </View>

        {/* Guides */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>GUIDES</Text>
          <View style={s.card}>
            {guides.map((guide, i) => (
              <TouchableOpacity key={guide.title} style={[s.row, i === guides.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[s.iconWrap, { backgroundColor: guide.color + '20' }]}>
                  <Ionicons name={guide.icon as any} size={20} color={guide.color} />
                </View>
                <Text style={s.rowText}>{guide.title}</Text>
                <Ionicons name="chevron-forward" size={18} color="#475569" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQs */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          <View style={s.card}>
            {filteredFaqs.map((faq, i) => (
              <View key={faq.q}>
                <TouchableOpacity
                  style={[s.row, i === filteredFaqs.length - 1 && expandedFaq !== faq.q && { borderBottomWidth: 0 }]}
                  onPress={() => setExpandedFaq(expandedFaq === faq.q ? null : faq.q)}
                >
                  <Text style={[s.rowText, { fontWeight: '500' }]}>{faq.q}</Text>
                  <Ionicons name={expandedFaq === faq.q ? 'chevron-up' : 'chevron-down'} size={18} color="#475569" />
                </TouchableOpacity>
                {expandedFaq === faq.q && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 14, lineHeight: 20 }}>{faq.a}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, marginLeft: 8 },
  contactCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, alignItems: 'center' },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowText: { flex: 1, fontSize: 16, color: '#fff' },
});
