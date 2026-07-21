import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const router = useRouter();

  const deviceInfo = [
    { label: 'Device Name', value: 'MTAA Device' },
    { label: 'Model', value: 'MTAA-X1' },
    { label: 'OS Version', value: 'MTAA OS v1.0.0' },
    { label: 'Android Version', value: '14' },
    { label: 'Kernel Version', value: '5.15.78' },
    { label: 'Build Number', value: 'MTAA-2026.07.21' },
    { label: 'Security Patch', value: 'July 2026' },
    { label: 'Baseband', value: 'M8998_2026' },
  ];

  const specs = [
    { label: 'Processor', value: 'MTAA Octa-Core 2.8GHz' },
    { label: 'RAM', value: '8 GB' },
    { label: 'Storage', value: '128 GB' },
    { label: 'Screen', value: '6.7" AMOLED 120Hz' },
    { label: 'Battery', value: '5000 mAh' },
    { label: 'Camera', value: '108MP + 12MP + 8MP' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>About MTAA OS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="phone-portrait" size={40} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 16 }}>MTAA OS</Text>
          <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>Version 1.0.0</Text>
        </View>

        {/* Device Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>DEVICE INFORMATION</Text>
          <View style={s.card}>
            {deviceInfo.map((item, i) => (
              <View key={item.label} style={[s.row, i === deviceInfo.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={s.rowLabel}>{item.label}</Text>
                <Text style={s.rowValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hardware */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>HARDWARE</Text>
          <View style={s.card}>
            {specs.map((item, i) => (
              <View key={item.label} style={[s.row, i === specs.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={s.rowLabel}>{item.label}</Text>
                <Text style={s.rowValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Legal */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>LEGAL</Text>
          <View style={s.card}>
            <TouchableOpacity style={s.row} onPress={() => {}}>
              <Text style={s.rowText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </TouchableOpacity>
            <TouchableOpacity style={s.row} onPress={() => {}}>
              <Text style={s.rowText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </TouchableOpacity>
            <TouchableOpacity style={[s.row, { borderBottomWidth: 0 }]} onPress={() => {}}>
              <Text style={s.rowText}>Open Source Licenses</Text>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ color: '#334155', fontSize: 12 }}>© 2026 MTAA Technologies</Text>
          <Text style={{ color: '#334155', fontSize: 11, marginTop: 4 }}>All rights reserved</Text>
        </View>
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
  rowLabel: { fontSize: 15, color: '#94A3B8' },
  rowValue: { fontSize: 15, color: '#fff', fontWeight: '500' },
});
