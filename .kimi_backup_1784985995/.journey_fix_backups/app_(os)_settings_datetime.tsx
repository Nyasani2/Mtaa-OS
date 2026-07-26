import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DateTimeSettingsScreen() {
  const router = useRouter();
  const [autoTime, setAutoTime] = useState(true);
  const [autoTimezone, setAutoTimezone] = useState(true);
  const [format24h, setFormat24h] = useState(false);
  const [timezone, setTimezone] = useState('Africa/Nairobi');

  const timezones = [
    { id: 'Africa/Nairobi', name: 'Nairobi', offset: 'EAT (+3:00)', flag: 'KE' },
    { id: 'Africa/Lagos', name: 'Lagos', offset: 'WAT (+1:00)', flag: 'NG' },
    { id: 'Africa/Johannesburg', name: 'Johannesburg', offset: 'SAST (+2:00)', flag: 'ZA' },
    { id: 'Europe/London', name: 'London', offset: 'BST (+1:00)', flag: 'GB' },
    { id: 'America/New_York', name: 'New York', offset: 'EDT (-4:00)', flag: 'US' },
    { id: 'Asia/Dubai', name: 'Dubai', offset: 'GST (+4:00)', flag: 'AE' },
  ];

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: !format24h,
  });
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Date & Time</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.timeCard}>
          <Text style={{ color: '#fff', fontSize: 48, fontWeight: '200' }}>{currentTime}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 8 }}>{currentDate}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>AUTOMATIC</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.rowText}>Set Time Automatically</Text>
              <Switch value={autoTime} onValueChange={setAutoTime}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.rowText}>Set Timezone Automatically</Text>
              <Switch value={autoTimezone} onValueChange={setAutoTimezone}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>FORMAT</Text>
          <View style={s.card}>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.rowText}>24-Hour Format</Text>
              <Switch value={format24h} onValueChange={setFormat24h}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>TIMEZONE</Text>
          <View style={s.card}>
            {timezones.map((tz, i) => (
              <TouchableOpacity key={tz.id} style={[s.row, i === timezones.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => setTimezone(tz.id)}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>{tz.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowText}>{tz.name}</Text>
                  <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{tz.offset}</Text>
                </View>
                {timezone === tz.id && <Ionicons name="checkmark" size={20} color="#6366f1" />}
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
  timeCard: { marginHorizontal: 16, marginTop: 8, padding: 32, backgroundColor: '#1E293B', borderRadius: 16, alignItems: 'center' },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  rowText: { flex: 1, fontSize: 16, color: '#fff' },
});
