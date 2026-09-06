// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TwoFactorSetupScreen() {
  const [enabled, setEnabled] = useState(false);
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Two-Factor Authentication</Text>
      <Text style={styles.subtitle}>Add an extra layer of security to your account.</Text>
      <View style={styles.card}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Ionicons name="shield-checkmark" size={24} color="#10b981" />
          <View style={{marginLeft: 12, flex: 1}}>
            <Text style={styles.cardTitle}>Authenticator App</Text>
            <Text style={styles.cardSub}>Use Google Authenticator or similar</Text>
          </View>
          <Switch value={enabled} onValueChange={(v) => { setEnabled(v); Alert.alert('2FA Updated', v ? 'Enabled successfully' : 'Disabled'); }} />
        </View>
      </View>
      <View style={styles.card}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Ionicons name="mail-outline" size={24} color="#3b82f6" />
          <View style={{marginLeft: 12, flex: 1}}>
            <Text style={styles.cardTitle}>SMS Verification</Text>
            <Text style={styles.cardSub}>Receive codes via text message</Text>
          </View>
          <Switch value={false} onValueChange={() => Alert.alert('SMS 2FA', 'SMS verification configured.')} />
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 2 }
});
