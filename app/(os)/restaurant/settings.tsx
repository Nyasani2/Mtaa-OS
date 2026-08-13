// @ts-nocheck
// ============================================================================
// MTAA Restaurant Module — Settings Screen
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, TextInput } from 'react-native';

export default function RestaurantSettings() {
  const [settings, setSettings] = useState({
    autoAcceptOrders: true,
    kdsSoundEnabled: true,
    printReceipts: true,
    taxRate: '20',
    serviceCharge: '0',
    currency: 'GBP',
    timezone: 'Europe/London',
    openingTime: '08:00',
    closingTime: '22:00',
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(p => ({ ...p, [key]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurant Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <SettingRow label="Auto-accept Orders" value={settings.autoAcceptOrders} onToggle={(v) => updateSetting('autoAcceptOrders', v)} />
        <SettingRow label="KDS Sound Alerts" value={settings.kdsSoundEnabled} onToggle={(v) => updateSetting('kdsSoundEnabled', v)} />
        <SettingRow label="Auto-print Receipts" value={settings.printReceipts} onToggle={(v) => updateSetting('printReceipts', v)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing & Tax</Text>
        <InputRow label="Tax Rate (%)" value={settings.taxRate} onChange={(v) => updateSetting('taxRate', v)} keyboardType="decimal-pad" />
        <InputRow label="Service Charge (%)" value={settings.serviceCharge} onChange={(v) => updateSetting('serviceCharge', v)} keyboardType="decimal-pad" />
        <InputRow label="Currency" value={settings.currency} onChange={(v) => updateSetting('currency', v)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operating Hours</Text>
        <InputRow label="Opening Time" value={settings.openingTime} onChange={(v) => updateSetting('openingTime', v)} />
        <InputRow label="Closing Time" value={settings.closingTime} onChange={(v) => updateSetting('closingTime', v)} />
        <InputRow label="Timezone" value={settings.timezone} onChange={(v) => updateSetting('timezone', v)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.dangerButton}>
          <Text style={styles.dangerButtonText}>⚠️ Reset All Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SettingRow({ label, value, onToggle }: any) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#E5E7EB', true: '#10B981' }} />
    </View>
  );
}

function InputRow({ label, value, onChange, keyboardType = 'default' }: any) {
  return (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#1F2937',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  settingLabel: { fontSize: 15, color: '#1F2937' },
  inputRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  inputLabel: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
  },
  dangerButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
