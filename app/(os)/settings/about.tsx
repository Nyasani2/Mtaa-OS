// app/(os)/settings/about.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const router = useRouter();

  const appInfo = [
    { label: 'Version', value: '1.0.0 (Build 2024.05.20)' },
    { label: 'Platform', value: 'MTAA OS - AfriQ Master Build' },
    { label: 'Framework', value: 'React Native / Expo Router' },
    { label: 'Backend', value: 'Supabase + Edge Functions' },
    { label: 'License', value: 'Proprietary - MTAA Technologies' },
  ];

  const links = [
    { icon: 'globe', label: 'Website', url: 'https://mtaa.africa' },
    { icon: 'logo-twitter', label: 'Twitter', url: 'https://twitter.com/mtaa_africa' },
    { icon: 'logo-linkedin', label: 'LinkedIn', url: 'https://linkedin.com/company/mtaa' },
    { icon: 'mail', label: 'Contact', url: 'mailto:support@mtaa.africa' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.appName}>MTAA OS</Text>
          <Text style={styles.tagline}>Operating System for Africa</Text>
        </View>

        <View style={styles.infoSection}>
          {appInfo.map((item, index) => (
            <View key={index} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Connect</Text>
        {links.map((link, index) => (
          <TouchableOpacity key={index} style={styles.linkRow} onPress={() => Linking.openURL(link.url)}>
            <Ionicons name={link.icon as any} size={20} color="#3B82F6" />
            <Text style={styles.linkLabel}>{link.label}</Text>
            <Ionicons name="open-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        ))}

        <View style={styles.legalSection}>
          <TouchableOpacity onPress={() => router.push('/settings/terms' as any)}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>•</Text>
          <TouchableOpacity onPress={() => router.push('/settings/privacy' as any)}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>© 2024 MTAA Technologies. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  content: { flex: 1 },
  logoSection: { alignItems: 'center', paddingVertical: 32 },
  logo: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 40, fontWeight: '800', color: '#FFF' },
  appName: { fontSize: 24, fontWeight: '800', color: '#1E293B', letterSpacing: 2 },
  tagline: { fontSize: 14, color: '#64748B', marginTop: 4 },
  infoSection: { backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontSize: 14, color: '#64748B' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginHorizontal: 16, marginBottom: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, marginHorizontal: 16, marginBottom: 1 },
  linkLabel: { flex: 1, fontSize: 15, color: '#1E293B', marginLeft: 12 },
  legalSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  legalLink: { fontSize: 14, color: '#3B82F6' },
  legalDivider: { fontSize: 14, color: '#94A3B8', marginHorizontal: 12 },
  copyright: { textAlign: 'center', fontSize: 12, color: '#94A3B8', marginBottom: 32 },
});
