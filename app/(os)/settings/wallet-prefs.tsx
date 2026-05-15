import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator, Alert, TextInput,
  Dimensions 
} from 'react-native';
const { width } = Dimensions.get('window');
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface WalletPrefs {
  default_currency: string;
  auto_convert: boolean;
  show_balances: boolean;
  hide_small_balances: boolean;
  small_balance_threshold: number;
  default_rail: string;
}

export default function WalletPrefsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<WalletPrefs>({
    default_currency: 'KES',
    auto_convert: false,
    show_balances: true,
    hide_small_balances: false,
    small_balance_threshold: 1,
    default_rail: 'mpesa',
  });

  useEffect(() => {
    fetchPrefs();
  }, []);

  const fetchPrefs = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .select('*')
      .eq('user_id', user.id)
      .single();

    setLoading(false);

    if (data) {
      setPrefs({
        default_currency: data.default_currency || 'KES',
        auto_convert: data.auto_convert || false,
        show_balances: data.show_balances !== false,
        hide_small_balances: data.hide_small_balances || false,
        small_balance_threshold: data.small_balance_threshold || 1,
        default_rail: data.default_rail || 'mpesa',
      });
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    const { error } = await supabase
      .upsert({
        user_id: user.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Saved', 'Wallet preferences updated');
    }
  };

  const currencies = ['KES', 'USD', 'EUR', 'GBP', 'NGN', 'ZAR', 'UGX', 'TZS'];
  const rails = ['mpesa', 'bank', 'crypto', 'card', 'airtel'];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Wallet Preferences</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Currency</Text>
        <View style={styles.currencyGrid}>
          {currencies.map((curr) => (
            <TouchableOpacity
              key={curr}
              style={[
                styles.currencyBtn,
                prefs.default_currency === curr && styles.currencyBtnActive
              ]}
              onPress={() => setPrefs(p => ({ ...p, default_currency: curr }))}
            >
              <Text style={[
                styles.currencyText,
                prefs.default_currency === curr && styles.currencyTextActive
              ]}>
                {curr}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Show Balances</Text>
          <Switch
            value={prefs.show_balances}
            onValueChange={(v) => setPrefs(p => ({ ...p, show_balances: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={prefs.show_balances ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Hide Small Balances</Text>
          <Switch
            value={prefs.hide_small_balances}
            onValueChange={(v) => setPrefs(p => ({ ...p, hide_small_balances: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={prefs.hide_small_balances ? '#fff' : '#888'}
          />
        </View>

        {prefs.hide_small_balances && (
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Hide below:</Text>
            <TextInput
  Dimensions
              style={styles.thresholdInput}
              value={prefs.small_balance_threshold.toString()}
              onChange={(text) => setPrefs(p => ({ ...p, small_balance_threshold: parseFloat(text) || 0 }))}
              keyboardType="decimal-pad"
              placeholder="1.00"
              placeholderTextColor="#888"
            />
            <Text style={styles.thresholdUnit}>{prefs.default_currency}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Rail</Text>
        <View style={styles.railGrid}>
          {rails.map((rail) => (
            <TouchableOpacity
              key={rail}
              style={[
                styles.railBtn,
                prefs.default_rail === rail && styles.railBtnActive
              ]}
              onPress={() => setPrefs(p => ({ ...p, default_rail: rail }))}
            >
              <Text style={styles.railIcon}>
                {rail === 'mpesa' ? '📱' : rail === 'bank' ? '🏦' : rail === 'crypto' ? '₿' : rail === 'card' ? '💳' : '📡'}
              </Text>
              <Text style={[
                styles.railText,
                prefs.default_rail === rail && styles.railTextActive
              ]}>
                {rail.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Auto-Convert Currency</Text>
          <Switch
            value={prefs.auto_convert}
            onValueChange={(v) => setPrefs(p => ({ ...p, auto_convert: v }))}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={prefs.auto_convert ? '#fff' : '#888'}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={handleSave} 
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Preferences'}</Text>
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
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 12 },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  currencyBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  currencyBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  currencyText: { color: '#888', fontSize: 14, fontWeight: '600' },
  currencyTextActive: { color: '#fff' },
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
    marginTop: 8,
    borderRadius: 8,
  },
  thresholdLabel: { color: '#888', fontSize: 14, marginRight: 8 },
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
  thresholdUnit: { color: '#888', fontSize: 14, marginLeft: 8 },
  railGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  railBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 48) / 3,
    borderWidth: 1,
    borderColor: '#333',
  },
  railBtnActive: { backgroundColor: '#6366f120', borderColor: '#6366f1' },
  railIcon: { fontSize: 24, marginBottom: 4 },
  railText: { color: '#888', fontSize: 12, fontWeight: '600' },
  railTextActive: { color: '#6366f1' },
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
