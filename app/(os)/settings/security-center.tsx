import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function SecurityCenterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pinEnabled, setPinEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [appLock, setAppLock] = useState(true);
  const [findMyDevice, setFindMyDevice] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState('Today, 6:00 AM');
  const [threatsFound, setThreatsFound] = useState(0);
  const [securityScore, setSecurityScore] = useState(85);

  const getScoreColor = () => {
    if (securityScore >= 80) return '#10B981';
    if (securityScore >= 60) return '#F59E0B';
    return '#EF4444';
  };

  async function runSecurityScan() {
    setScanning(true);
    try {
      const issues: string[] = [];
      const { data: pinData } = await supabase.from('user_profiles').select('pin_hash').eq('id', user?.id).single();
      if (!pinData?.pin_hash) issues.push('No PIN set');
      const { data: mfaData } = await supabase.from('user_profiles').select('mfa_enabled').eq('id', user?.id).single();
      if (!mfaData?.mfa_enabled) issues.push('Two-factor auth not enabled');
      const { data: sessions } = await supabase.from('auth_sessions').select('created_at, ip_address').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(5);
      const uniqueIps = new Set(sessions?.map((s: any) => s.ip_address) || []);
      if (uniqueIps.size > 2) issues.push('Multiple login locations detected');
      const { data: failedLogins } = await supabase.from('auth_audit_logs').select('id').eq('user_id', user?.id).eq('event_type', 'failed_login').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      if ((failedLogins?.length || 0) > 3) issues.push('Multiple failed login attempts in last 24h');
      setThreatsFound(issues.length);
      setLastScan(new Date().toLocaleString());
      const baseScore = 100;
      const deduction = issues.length * 15;
      setSecurityScore(Math.max(baseScore - deduction, 20));
      await supabase.from('security_scans').insert({ user_id: user?.id, threats_found: issues.length, issues: issues, score: Math.max(baseScore - deduction, 20) });
      if (issues.length === 0) {
        Alert.alert('Scan Complete', 'No threats found. Your account is secure.');
      } else {
        Alert.alert('Scan Complete', `Found ${issues.length} issue(s):\n\n${issues.join('\n')}`, [{ text: 'Review Settings' }]);
      }
    } catch (e: any) { Alert.alert('Scan Failed', e.message); }
    finally { setScanning(false); }
  }

  function openPasswordManager() { router.push('/(os)/settings/password-manager' as any); }

  async function togglePIN(value: boolean) {
    if (!value) { Alert.alert('Disable PIN?', 'This will remove your PIN protection.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Disable', style: 'destructive', onPress: () => setPinEnabled(false) }]); return; }
    router.push('/auth/set-pin' as any);
  }

  async function toggle2FA(value: boolean) {
    if (value) { router.push('/(os)/settings/two-factor-setup' as any); }
    else { Alert.alert('Disable 2FA?', 'Your account will be less secure.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Disable', style: 'destructive', onPress: () => setTwoFactorEnabled(false) }]); }
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={s.headerTitle}>Security Center</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.scoreCard}>
          <View style={{ alignItems: 'center' }}>
            <View style={[s.scoreCircle, { borderColor: getScoreColor() }]}>
              <Text style={[s.scoreText, { color: getScoreColor() }]}>{securityScore}</Text>
              <Text style={{ color: '#64748B', fontSize: 12 }}>/100</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 12 }}>
              {securityScore >= 80 ? 'Secure' : securityScore >= 60 ? 'Fair' : 'At Risk'}
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>Last scan: {lastScan}</Text>
          </View>
        </View>
        <View style={s.section}>
          <Text style={s.sectionTitle}>QUICK ACTIONS</Text>
          <View style={s.card}>
            <TouchableOpacity style={s.row} onPress={runSecurityScan} disabled={scanning}>
              <View style={[s.iconWrap, { backgroundColor: '#10B98120' }]}>
                <Ionicons name={scanning ? 'refresh' : 'shield-checkmark'} size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>{scanning ? 'Scanning...' : 'Run Security Scan'}</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Check for threats and vulnerabilities</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </TouchableOpacity>
            <TouchableOpacity style={[s.row, { borderBottomWidth: 0 }]} onPress={openPasswordManager}>
              <View style={[s.iconWrap, { backgroundColor: '#6366f120' }]}>
                <Ionicons name="key-outline" size={20} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Password Manager</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Manage saved passwords</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.section}>
          <Text style={s.sectionTitle}>SECURITY FEATURES</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Ionicons name="keypad-outline" size={20} color="#6366f1" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>PIN Lock</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>6-digit PIN for app access</Text>
              </View>
              <Switch value={pinEnabled} onValueChange={togglePIN} trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
            <View style={s.row}>
              <Ionicons name="finger-print-outline" size={20} color="#10B981" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Biometric Login</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Face ID or Fingerprint</Text>
              </View>
              <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} trackColor={{ false: '#334155', true: '#10B981' }} thumbColor="#fff" />
            </View>
            <View style={s.row}>
              <Ionicons name="shield-outline" size={20} color="#F59E0B" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Two-Factor Auth</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Extra layer of security</Text>
              </View>
              <Switch value={twoFactorEnabled} onValueChange={toggle2FA} trackColor={{ false: '#334155', true: '#F59E0B' }} thumbColor="#fff" />
            </View>
            <View style={s.row}>
              <Ionicons name="lock-closed-outline" size={20} color="#EF4444" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>App Lock</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Lock individual apps</Text>
              </View>
              <Switch value={appLock} onValueChange={setAppLock} trackColor={{ false: '#334155', true: '#EF4444' }} thumbColor="#fff" />
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Ionicons name="locate-outline" size={20} color="#8B5CF6" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Find My Device</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Locate lost device</Text>
              </View>
              <Switch value={findMyDevice} onValueChange={setFindMyDevice} trackColor={{ false: '#334155', true: '#8B5CF6' }} thumbColor="#fff" />
            </View>
          </View>
        </View>
        <View style={s.section}>
          <Text style={s.sectionTitle}>RECENT ACTIVITY</Text>
          <View style={s.card}>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Security Scan Complete</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{lastScan} · {threatsFound} threats found</Text>
              </View>
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
  scoreCard: { marginHorizontal: 16, marginTop: 8, padding: 24, backgroundColor: '#1E293B', borderRadius: 16 },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontSize: 32, fontWeight: '700' },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowText: { fontSize: 16, color: '#fff' },
});
