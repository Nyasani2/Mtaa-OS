import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator, Alert, TextInput 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface TxAlertSettings {
  push_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  min_amount: number;
  all_incoming: boolean;
  all_outgoing: boolean;
  failed_alerts: boolean;
  large_tx_threshold: number;
}

export default function TxAlertsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TxAlertSettings>({
    push_enabled: true,
    sms_enabled: false,
    email_enabled: true,
    min_amount: 0,
    all_incoming: true,
    all_outgoing: true,
    failed_alerts: true,
    large_tx_threshold: 10000,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('tx_alert_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setLoading(false);

    if (data) {
      setSettings({
        push_enabled: data.push_enabled !== false,
        sms_enabled: data.sms_enabled || false,
        email_enabled: data.email_enabled !== false,
        min_amount: data.min_amount || 0,
        all_incoming: data.all_incoming !== false,
        all_outgoing: data.all_outgoing !== false,
        failed_alerts: data.failed_alerts !== false,
        large_tx_threshold: data.large_tx_threshold || 10000,
      });
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from('tx_alert_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Saved', 'Transaction alert settings updated');
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
      <Text style={styles.title}>Transaction Alerts</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Channels</Text>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Push Notifications</Text>
          <Switch
            value={settings.push_enabled}
            onValueChange={(v) => setSettings(s => ({ ...s, push_enabled: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.push_enabled ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>SMS Alerts</Text>
          <Switch
            value={settings.sms_enabled}
            onValueChange={(v) => setSettings(s => ({ ...s, sms_enabled: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.sms_enabled ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email Alerts</Text>
          <Switch
            value={settings.email_enabled}
            onValueChange={(v) => setSettings(s => ({ ...s, email_enabled: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.email_enabled ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Rules</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>All Incoming</Text>
          <Switch
            value={settings.all_incoming}
            onValueChange={(v) => setSettings(s => ({ ...s, all_incoming: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.all_incoming ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>All Outgoing</Text>
          <Switch
            value={settings.all_outgoing}
            onValueChange={(v) => setSettings(s => ({ ...s, all_outgoing: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.all_outgoing ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Failed Transaction Alerts</Text>
          <Switch
            value={settings.failed_alerts}
            onValueChange={(v) => setSettings(s => ({ ...s, failed_alerts: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.failed_alerts ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thresholds</Text>

        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Minimum Amount</Text>
          <TextInput
            style={styles.thresholdInput}
            value={settings.min_amount.toString()}
            onChange={(text) => setSettings(s => ({ ...s, min_amount: parseFloat(text) || 0 }))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#888"
          />
          <Text style={styles.thresholdUnit}>KES</Text>
        </View>

        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Large Transaction</Text>
          <TextInput
            style={styles.thresholdInput}
            value={settings.large_tx_threshold.toString()}
            onChange={(text) => setSettings(s => ({ ...s, large_tx_threshold: parseFloat(text) || 0 }))}
            keyboardType="decimal-pad"
            placeholder="10000"
            placeholderTextColor="#888"
          />
          <Text style={styles.thresholdUnit}>KES</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={handleSave} 
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Alert Settings'}</Text>
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
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  thresholdLabel: { color: '#fff', fontSize: 14, flex: 1 },
  thresholdInput: {
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
  thresholdUnit: { color: '#888', fontSize: 14, marginLeft: 8, width: 40 },
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
