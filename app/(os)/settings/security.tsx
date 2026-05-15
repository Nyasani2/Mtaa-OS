import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator, Alert 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface SecuritySettings {
  two_factor_enabled: boolean;
  biometric_enabled: boolean;
  pin_enabled: boolean;
  session_timeout: number;
  login_alerts: boolean;
  transaction_confirm: boolean;
}

export default function SecurityScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    biometric_enabled: false,
    pin_enabled: false,
    session_timeout: 30,
    login_alerts: true,
    transaction_confirm: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('security_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setLoading(false);

    if (error && error.code !== 'PGRST116') {
      // Silently fail, use defaults
    }

    if (data) {
      setSettings({
        two_factor_enabled: data.two_factor_enabled || false,
        biometric_enabled: data.biometric_enabled || false,
        pin_enabled: data.pin_enabled || false,
        session_timeout: data.session_timeout || 30,
        login_alerts: data.login_alerts !== false,
        transaction_confirm: data.transaction_confirm !== false,
      });
    }
  };

  const handleToggle = async (key: keyof SecuritySettings) => {
    if (key === 'two_factor_enabled' && !settings[key]) {
      router.push('/(os)/settings/change-password');
      return;
    }

    const newValue = !settings[key];
    setSettings(s => ({ ...s, [key]: newValue }));
    setSaving(true);

    const { error } = await supabase
      .from('security_settings')
      .upsert({
        user_id: user?.id,
        [key]: newValue,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Failed to save setting: ' + error.message);
      setSettings(s => ({ ...s, [key]: !newValue }));
    }
  };

  const handleChangePassword = () => {
    router.push('/(os)/settings/change-password');
  };

  const handleViewSessions = () => {
    router.push('/(os)/settings/devices');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Security</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>
        
        <TouchableOpacity style={styles.row} onPress={handleChangePassword}>
          <Text style={styles.rowLabel}>Change Password</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Two-Factor Authentication</Text>
          <Switch
            value={settings.two_factor_enabled}
            onValueChange={() => handleToggle('two_factor_enabled')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.two_factor_enabled ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Biometric Login</Text>
          <Switch
            value={settings.biometric_enabled}
            onValueChange={() => handleToggle('biometric_enabled')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.biometric_enabled ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>PIN Protection</Text>
          <Switch
            value={settings.pin_enabled}
            onValueChange={() => handleToggle('pin_enabled')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.pin_enabled ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session & Alerts</Text>

        <TouchableOpacity style={styles.row} onPress={handleViewSessions}>
          <Text style={styles.rowLabel}>Active Devices</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Login Alerts</Text>
          <Switch
            value={settings.login_alerts}
            onValueChange={() => handleToggle('login_alerts')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.login_alerts ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Confirm All Transactions</Text>
          <Switch
            value={settings.transaction_confirm}
            onValueChange={() => handleToggle('transaction_confirm')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.transaction_confirm ? '#fff' : '#888'}
          />
        </View>
      </View>

      {saving && (
        <Text style={styles.savingText}>Saving...</Text>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  section: { marginBottom: 24 },
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
  chevron: { color: '#666', fontSize: 18 },
  savingText: { color: '#6366f1', textAlign: 'center', fontSize: 12, marginVertical: 8 },
  backButton: { marginTop: 16, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
