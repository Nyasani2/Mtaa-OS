import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
  allow_calls: boolean;
  allow_urgent: boolean;
}

export default function QuietHoursScreen() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<QuietHours>({
    enabled: false,
    start: '22:00',
    end: '07:00',
    allow_calls: false,
    allow_urgent: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('mtaa_quiet_hours');
      if (saved) setSettings(JSON.parse(saved));
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const handleToggle = async (key: keyof QuietHours) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('mtaa_quiet_hours', JSON.stringify(newSettings));
    } catch (e) {
      // ignore
    }
  };

  const timeOptions = [
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00',
    '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00'
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Quiet Hours</Text>
      <Text style={styles.subtitle}>Silence non-urgent notifications during set hours</Text>

      <View style={styles.masterRow}>
        <Text style={styles.masterLabel}>Enable Quiet Hours</Text>
        <Switch
          value={settings.enabled}
          onValueChange={() => handleToggle('enabled')}
          trackColor={{ false: '#333', true: '#6366f1' }}
          thumbColor={settings.enabled ? '#fff' : '#888'}
        />
      </View>

      <View style={[styles.section, !settings.enabled && styles.disabled]}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Start</Text>
          <View style={styles.timeOptions}>
            {timeOptions.filter(t => parseInt(t) >= 18 || parseInt(t) <= 2).map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.timeBtn,
                  settings.start === t && styles.timeBtnActive
                ]}
                onPress={() => {
                  const ns = { ...settings, start: t };
                  setSettings(ns);
                  AsyncStorage.setItem('mtaa_quiet_hours', JSON.stringify(ns));
                }}
              >
                <Text style={[
                  styles.timeText,
                  settings.start === t && styles.timeTextActive
                ]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>End</Text>
          <View style={styles.timeOptions}>
            {timeOptions.filter(t => parseInt(t) >= 5 && parseInt(t) <= 10).map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.timeBtn,
                  settings.end === t && styles.timeBtnActive
                ]}
                onPress={() => {
                  const ns = { ...settings, end: t };
                  setSettings(ns);
                  AsyncStorage.setItem('mtaa_quiet_hours', JSON.stringify(ns));
                }}
              >
                <Text style={[
                  styles.timeText,
                  settings.end === t && styles.timeTextActive
                ]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.section, !settings.enabled && styles.disabled]}>
        <Text style={styles.sectionTitle}>Exceptions</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Allow Calls</Text>
          <Switch
            value={settings.allow_calls}
            onValueChange={() => handleToggle('allow_calls')}
            disabled={!settings.enabled}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.allow_calls ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Allow Urgent</Text>
          <Switch
            value={settings.allow_urgent}
            onValueChange={() => handleToggle('allow_urgent')}
            disabled={!settings.enabled}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.allow_urgent ? '#fff' : '#888'}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  subtitle: { fontSize: 14, color: '#888', paddingHorizontal: 16, marginBottom: 24 },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  masterLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  section: { marginBottom: 24 },
  disabled: { opacity: 0.4 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 12 },
  timeRow: { marginBottom: 16 },
  timeLabel: { color: '#fff', fontSize: 14, paddingHorizontal: 16, marginBottom: 8 },
  timeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  timeBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  timeBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  timeText: { color: '#888', fontSize: 13 },
  timeTextActive: { color: '#fff', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  rowLabel: { color: '#fff', fontSize: 15 },
  backButton: { marginTop: 16, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
