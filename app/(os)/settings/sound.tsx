import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SoundSettingsScreen() {
  const router = useRouter();
  const [ringtone, setRingtone] = useState('Default');
  const [vibrateOnRing, setVibrateOnRing] = useState(true);
  const [vibrateOnSilent, setVibrateOnSilent] = useState(false);
  const [systemSounds, setSystemSounds] = useState(true);
  const [touchSounds, setTouchSounds] = useState(false);
  const [mediaVolume] = useState(70);
  const [ringVolume] = useState(80);
  const [alarmVolume] = useState(90);

  const ringtones = ['Default', 'Chime', 'Pulse', 'Retro', 'Zen', 'None'];

  const VolumeBar = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#334155' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name={icon as any} size={18} color={color} style={{ marginRight: 8 }} />
        <Text style={{ color: '#fff', fontSize: 14 }}>{label}</Text>
        <Text style={{ color: '#64748B', fontSize: 13, marginLeft: 'auto' }}>{value}%</Text>
      </View>
      <View style={{ height: 6, backgroundColor: '#334155', borderRadius: 3 }}>
        <View style={{ height: '100%', width: `${value}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Sound & Vibration</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>VOLUME</Text>
          <View style={s.card}>
            <VolumeBar label="Media" value={mediaVolume} icon="musical-notes-outline" color="#6366f1" />
            <VolumeBar label="Ringtone" value={ringVolume} icon="call-outline" color="#10B981" />
            <VolumeBar label="Alarm" value={alarmVolume} icon="alarm-outline" color="#EF4444" />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>RINGTONE</Text>
          <View style={s.card}>
            {ringtones.map((r, i) => (
              <TouchableOpacity key={r} style={[s.row, i === ringtones.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => setRingtone(r)}>
                <Text style={s.rowText}>{r}</Text>
                {ringtone === r && <Ionicons name="checkmark" size={20} color="#6366f1" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>VIBRATION</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Ionicons name="call-outline" size={20} color="#10B981" style={{ marginRight: 12 }} />
              <Text style={s.rowText}>Vibrate on Ring</Text>
              <Switch value={vibrateOnRing} onValueChange={setVibrateOnRing}
                trackColor={{ false: '#334155', true: '#10B981' }} thumbColor="#fff" />
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Ionicons name="volume-mute-outline" size={20} color="#64748B" style={{ marginRight: 12 }} />
              <Text style={s.rowText}>Vibrate on Silent</Text>
              <Switch value={vibrateOnSilent} onValueChange={setVibrateOnSilent}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>SYSTEM</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.rowText}>System Sounds</Text>
              <Switch value={systemSounds} onValueChange={setSystemSounds}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.rowText}>Touch Sounds</Text>
              <Switch value={touchSounds} onValueChange={setTouchSounds}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
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
