import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedRegion, setSelectedRegion] = useState('KE');

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
    { code: 'fr', name: 'French', native: 'Francais' },
    { code: 'ar', name: 'Arabic', native: 'Arabic' },
    { code: 'zh', name: 'Chinese', native: 'Chinese' },
    { code: 'es', name: 'Spanish', native: 'Espanol' },
  ];

  const regions = [
    { code: 'KE', name: 'Kenya', flag: 'KE' },
    { code: 'TZ', name: 'Tanzania', flag: 'TZ' },
    { code: 'UG', name: 'Uganda', flag: 'UG' },
    { code: 'RW', name: 'Rwanda', flag: 'RW' },
    { code: 'NG', name: 'Nigeria', flag: 'NG' },
    { code: 'ZA', name: 'South Africa', flag: 'ZA' },
    { code: 'GH', name: 'Ghana', flag: 'GH' },
    { code: 'US', name: 'United States', flag: 'US' },
    { code: 'GB', name: 'United Kingdom', flag: 'GB' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Language & Region</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>LANGUAGE</Text>
          <View style={s.card}>
            {languages.map((lang, i) => (
              <TouchableOpacity key={lang.code} style={[s.row, i === languages.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => setSelectedLang(lang.code)}>
                <Text style={s.rowText}>{lang.name}</Text>
                <Text style={{ color: '#64748B', fontSize: 13, marginRight: 8 }}>{lang.native}</Text>
                {selectedLang === lang.code && <Ionicons name="checkmark" size={20} color="#6366f1" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>REGION</Text>
          <View style={s.card}>
            {regions.map((region, i) => (
              <TouchableOpacity key={region.code} style={[s.row, i === regions.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => setSelectedRegion(region.code)}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>{region.flag}</Text>
                <Text style={s.rowText}>{region.name}</Text>
                {selectedRegion === region.code && <Ionicons name="checkmark" size={20} color="#6366f1" />}
              </TouchableOpacity>
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
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  rowText: { flex: 1, fontSize: 16, color: '#fff' },
});
