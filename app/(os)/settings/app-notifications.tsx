import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettings {
  master_switch: boolean;
  messages: boolean;
  mentions: boolean;
  followers: boolean;
  transactions: boolean;
  promotions: boolean;
  tribe_updates: boolean;
  job_alerts: boolean;
  sound: boolean;
  vibration: boolean;
}

export default function AppNotificationsScreen() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    master_switch: true,
    messages: true,
    mentions: true,
    followers: true,
    transactions: true,
    promotions: false,
    tribe_updates: true,
    job_alerts: true,
    sound: true,
    vibration: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('mtaa_notifications');
      if (saved) setSettings(JSON.parse(saved));
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    
    // If master switch turned off, disable all
    if (key === 'master_switch' && !newSettings.master_switch) {
      newSettings.messages = false;
      newSettings.mentions = false;
      newSettings.followers = false;
      newSettings.transactions = false;
      newSettings.promotions = false;
      newSettings.tribe_updates = false;
      newSettings.job_alerts = false;
    }
    
    // If master switch turned on, enable core ones
    if (key === 'master_switch' && newSettings.master_switch) {
      newSettings.messages = true;
      newSettings.mentions = true;
      newSettings.transactions = true;
    }

    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('mtaa_notifications', JSON.stringify(newSettings));
    } catch (e) {
      // ignore
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  const isDisabled = !settings.master_switch;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      <View style={styles.masterRow}>
        <Text style={styles.masterLabel}>Enable Notifications</Text>
        <Switch
          value={settings.master_switch}
          onValueChange={() => handleToggle('master_switch')}
          trackColor={{ false: '#333', true: '#6366f1' }}
          thumbColor={settings.master_switch ? '#fff' : '#888'}
        />
      </View>

      <View style={[styles.section, isDisabled && styles.disabled]}>
        <Text style={styles.sectionTitle}>Social</Text>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Messages</Text>
          <Switch
            value={settings.messages}
            onValueChange={() => handleToggle('messages')}
            disabled={isDisabled}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.messages ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Mentions</Text>
          <Switch
            value={settings.mentions}
            onValueChange={() => handleToggle('mentions')}
            disabled={isDisabled}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.mentions ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>New Followers</Text>
          <Switch
            value={settings.followers}
            onValueChange={() => handleToggle('followers')}
            disabled={isDisabled}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.followers ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Tribe Updates</Text>
          <Switch
            value={settings.tribe_updates}
            onValueChange={() => handleToggle('tribe_updates')}
            disabled={isDisabled}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.tribe_updates ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={[styles.section, isDisabled && styles.disabled]}>
        <Text style={styles.sectionTitle}>Financial</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Transactions</Text>
          <Switch
            value={settings.transactions}
            onValueChange={() => handleToggle('transactions')}
            disabled={isDisabled}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.transactions ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Job Alerts</Text>
          <Switch
            value={settings.job_alerts}
            onValueChange={() => handleToggle('job_alerts')}
            disabled={isDisabled}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.job_alerts ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Promotions</Text>
          <Switch
            value={settings.promotions}
            onValueChange={() => handleToggle('promotions')}
            disabled={isDisabled}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.promotions ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={[styles.section, isDisabled && styles.disabled]}>
        <Text style={styles.sectionTitle}>Behavior</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Sound</Text>
          <Switch
            value={settings.sound}
            onValueChange={() => handleToggle('sound')}
            disabled={isDisabled}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.sound ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Vibration</Text>
          <Switch
            value={settings.vibration}
            onValueChange={() => handleToggle('vibration')}
            disabled={isDisabled}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.vibration ? '#fff' : '#888'}
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
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 },
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
