import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DisplaySettingsScreen() {
  const router = useRouter();
  const [brightness, setBrightness] = useState(75);
  const [autoBrightness, setAutoBrightness] = useState(true);
  const [blueLightFilter, setBlueLightFilter] = useState(false);
  const [fontSize, setFontSize] = useState('Medium');
  const [screenTimeout, setScreenTimeout] = useState('2 minutes');

  const fontSizes = ['Small', 'Medium', 'Large', 'Extra Large'];
  const timeouts = ['15 seconds', '30 seconds', '1 minute', '2 minutes', '5 minutes', '10 minutes', 'Never'];

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Display & Brightness</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Section title="BRIGHTNESS">
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="sunny-outline" size={20} color="#64748B" />
              <View style={{ flex: 1, height: 6, backgroundColor: '#334155', borderRadius: 3, marginHorizontal: 12 }}>
                <View style={{ height: '100%', width: `${brightness}%`, backgroundColor: '#6366f1', borderRadius: 3 }} />
              </View>
              <Ionicons name="sunny" size={24} color="#fff" />
            </View>
            <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>{brightness}%</Text>
          </View>
          <View style={[s.row, { borderBottomWidth: 0 }]}>
            <Text style={s.rowText}>Auto-Brightness</Text>
            <Switch value={autoBrightness} onValueChange={setAutoBrightness}
              trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
          </View>
        </Section>

        <Section title="EYE COMFORT">
          <View style={[s.row, { borderBottomWidth: 0 }]}>
            <View style={[s.iconWrap, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="eye-outline" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowText}>Blue Light Filter</Text>
              <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Reduce eye strain at night</Text>
            </View>
            <Switch value={blueLightFilter} onValueChange={setBlueLightFilter}
              trackColor={{ false: '#334155', true: '#F59E0B' }} thumbColor="#fff" />
          </View>
        </Section>

        <Section title="FONT SIZE">
          {fontSizes.map((size, i) => (
            <TouchableOpacity key={size} style={[s.row, i === fontSizes.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => setFontSize(size)}>
              <Text style={s.rowText}>{size}</Text>
              {fontSize === size && <Ionicons name="checkmark" size={20} color="#6366f1" />}
            </TouchableOpacity>
          ))}
        </Section>

        <Section title="SCREEN TIMEOUT">
          {timeouts.map((t, i) => (
            <TouchableOpacity key={t} style={[s.row, i === timeouts.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => setScreenTimeout(t)}>
              <Text style={s.rowText}>{t}</Text>
              {screenTimeout === t && <Ionicons name="checkmark" size={20} color="#6366f1" />}
            </TouchableOpacity>
          ))}
        </Section>

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
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowText: { flex: 1, fontSize: 16, color: '#fff' },
});
