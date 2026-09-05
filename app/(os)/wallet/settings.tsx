// @ts-nocheck
// app/(os)/wallet/settings.tsx — Wallet Settings (null-safe)
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useWalletStore } from '@/hooks/useWalletStore';

export default function WalletSettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const wallet = useWalletStore();

  // Null-safe destructuring — every array defaults to []
  const linkedBanks = wallet.linkedBanks ?? [];
  const linkedCards = wallet.linkedCards ?? [];
  const agents = wallet.agents ?? [];
  const notifications = wallet.notifications ?? [];
  const loading = wallet.loading ?? false;

  const [biometrics, setBiometrics] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleRemoveBank = (bankId: string) => {
    Alert.alert('Remove Bank', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        // TODO: wire to store action
        Alert.alert('Removed', 'Bank unlinked successfully');
      }}
    ]);
  };

  const handleRemoveCard = (cardId: string) => {
    Alert.alert('Remove Card', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        Alert.alert('Removed', 'Card unlinked successfully');
      }}
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Identity Card */}
      <View style={styles.card}>
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.email || user?.phone || 'Wallet User'}</Text>
            <Text style={styles.meta}>ID: {user?.id?.slice(0, 12) || '---'}...</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(os)/wallet/email-verify')}>
            <Ionicons name="shield-checkmark" size={22} color="#34C759" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Security */}
      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/settings/pin')}>
          <Ionicons name="keypad" size={20} color="#007AFF" />
          <Text style={styles.rowText}>Change PIN</Text>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Ionicons name="finger-print" size={20} color="#007AFF" />
          <Text style={styles.rowText}>Biometric Login</Text>
          <Switch value={biometrics} onValueChange={setBiometrics} trackColor={{ false: '#3A3A3C', true: '#34C759' }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Ionicons name="notifications" size={20} color="#007AFF" />
          <Text style={styles.rowText}>Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#3A3A3C', true: '#34C759' }} />
        </View>
      </View>

      {/* Linked Banks */}
      <Text style={styles.sectionTitle}>Linked Banks</Text>
      <View style={styles.card}>
        {linkedBanks.length === 0 ? (
          <View style={styles.emptyRow}>
            <Ionicons name="business-outline" size={28} color="#8E8E93" />
            <Text style={styles.emptyText}>No linked banks</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(os)/wallet/banks')}>
              <Text style={styles.linkBtnText}>Link a Bank</Text>
            </TouchableOpacity>
          </View>
        ) : (
          linkedBanks.map((bank: any) => (
            <View key={bank.id || bank.bank_id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{bank.name || bank.bank_name || 'Bank'}</Text>
                <Text style={styles.itemMeta}>{bank.account_number || '****'}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveBank(bank.id || bank.bank_id)}>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Linked Cards */}
      <Text style={styles.sectionTitle}>Linked Cards</Text>
      <View style={styles.card}>
        {linkedCards.length === 0 ? (
          <View style={styles.emptyRow}>
            <Ionicons name="card-outline" size={28} color="#8E8E93" />
            <Text style={styles.emptyText}>No linked cards</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(os)/wallet/cards')}>
              <Text style={styles.linkBtnText}>Link a Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          linkedCards.map((card: any) => (
            <View key={card.id || card.card_id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{card.brand || 'Card'} •••• {card.last4 || '****'}</Text>
                <Text style={styles.itemMeta}>Expires {card.exp_month || '--'}/{card.exp_year || '--'}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveCard(card.id || card.card_id)}>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Agents */}
      <Text style={styles.sectionTitle}>Agents</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/wallet/agent-map')}>
          <Ionicons name="map" size={20} color="#34C759" />
          <Text style={styles.rowText}>Find an Agent</Text>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/wallet/agent')}>
          <Ionicons name="people" size={20} color="#34C759" />
          <Text style={styles.rowText}>My Agents ({agents.length})</Text>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Regulatory & Central Bank */}
      <Text style={styles.sectionTitle}>Regulatory & Compliance</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/wallet/regulatory')}>
          <Ionicons name="document-text" size={20} color="#FF9500" />
          <Text style={styles.rowText}>Regulatory Status</Text>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/wallet/treasury-hub')}>
          <Ionicons name="globe" size={20} color="#5856D6" />
          <Text style={styles.rowText}>Central Bank & Treasury</Text>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/wallet/tax-hub')}>
          <Ionicons name="calculator" size={20} color="#FF3B30" />
          <Text style={styles.rowText}>Tax Center</Text>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* KYC */}
      <Text style={styles.sectionTitle}>Verification</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/wallet/email-verify')}>
          <Ionicons name="mail" size={20} color="#007AFF" />
          <Text style={styles.rowText}>Email Verification</Text>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/wallet/business-register')}>
          <Ionicons name="briefcase" size={20} color="#007AFF" />
          <Text style={styles.rowText}>Business Registration</Text>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#007AFF" style={{ marginTop: 20 }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  card: {
    backgroundColor: '#1C1C1E', borderRadius: 16, marginHorizontal: 16, marginBottom: 16, padding: 16
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center'
  },
  name: { fontSize: 16, fontWeight: '700', color: '#fff' },
  meta: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase',
    marginHorizontal: 16, marginBottom: 8, marginTop: 8, letterSpacing: 0.5
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12
  },
  rowText: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#2C2C2E', marginLeft: 32 },
  emptyRow: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14, color: '#8E8E93' },
  linkBtn: {
    backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginTop: 8
  },
  linkBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E'
  },
  itemName: { fontSize: 15, color: '#fff', fontWeight: '600' },
  itemMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
});
