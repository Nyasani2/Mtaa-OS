import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator, Alert, TextInput 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface GoFundSettings {
  auto_repay: boolean;
  auto_repay_percent: number;
  credit_limit: number;
  notifications: boolean;
  pause_credit: boolean;
}

export default function GoFundSettingsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GoFundSettings>({
    auto_repay: true,
    auto_repay_percent: 10,
    credit_limit: 5000,
    notifications: true,
    pause_credit: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('gofund_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setLoading(false);

    if (data) {
      setSettings({
        auto_repay: data.auto_repay !== false,
        auto_repay_percent: data.auto_repay_percent || 10,
        credit_limit: data.credit_limit || 5000,
        notifications: data.notifications !== false,
        pause_credit: data.pause_credit || false,
      });
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from('gofund_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Saved', 'GoFund settings updated');
    }
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
      <Text style={styles.title}>GoFund Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repayment</Text>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Auto-Repay</Text>
          <Switch
            value={settings.auto_repay}
            onValueChange={(v) => setSettings(s => ({ ...s, auto_repay: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.auto_repay ? '#fff' : '#888'}
          />
        </View>

        {settings.auto_repay && (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Repay % of inflow</Text>
            <TextInput
              style={styles.input}
              value={settings.auto_repay_percent.toString()}
              onChange={(text) => setSettings(s => ({ ...s, auto_repay_percent: parseInt(text) || 0 }))}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="10"
              placeholderTextColor="#888"
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credit</Text>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Credit Limit (KES)</Text>
          <TextInput
            style={styles.input}
            value={settings.credit_limit.toString()}
            onChange={(text) => setSettings(s => ({ ...s, credit_limit: parseInt(text) || 0 }))}
            keyboardType="number-pad"
            placeholder="5000"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Pause Credit</Text>
          <Switch
            value={settings.pause_credit}
            onValueChange={(v) => setSettings(s => ({ ...s, pause_credit: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.pause_credit ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerts</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Credit Notifications</Text>
          <Switch
            value={settings.notifications}
            onValueChange={(v) => setSettings(s => ({ ...s, notifications: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.notifications ? '#fff' : '#888'}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={handleSave} 
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
      </TouchableOpacity>

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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  inputLabel: { color: '#fff', fontSize: 14, flex: 1 },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 8,
    color: '#fff',
    fontSize: 14,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { marginTop: 16, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
