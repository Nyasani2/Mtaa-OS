// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '@/hooks/useWallet';
import { colors } from '@/constants/theme';
const colors = (colors as any)?.light || colors || {};
const fonts = { regular: 'System', bold: 'System', light: 'System' };
const sizes = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 };

export default function SendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { balance, sendMoney, recentContacts } = useWallet();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = useCallback(async () => {
    if (!recipient.trim()) { Alert.alert('Error', 'Please enter a recipient'); return; }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount'); return;
    }
    if (Number(amount) > balance) { Alert.alert('Error', 'Insufficient balance'); return; }

    setLoading(true);
    try {
      await sendMoney?.({ recipient: recipient.trim(), amount: Number(amount), note: note.trim() });
      Alert.alert('Success', `Sent KSh ${amount} to ${recipient}`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Send Failed', err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [recipient, amount, note, balance, sendMoney, router]);

  const quickAmounts = [100, 500, 1000, 5000];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Money</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>KSh {balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
          </View>

          {/* Recipient */}
          <View style={styles.section}>
            <Text style={styles.label}>To</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone number, username, or wallet ID"
                placeholderTextColor={colors.textSecondary}
                value={recipient}
                onChangeText={setRecipient}
                autoCapitalize="none"
                keyboardType="default"
              />
            </View>

            {/* Recent contacts */}
            {recentContacts && recentContacts.length > 0 && (
              <View style={styles.recentRow}>
                {recentContacts.slice(0, 4).map((c: any, i: number) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.recentChip}
                    onPress={() => setRecipient(c.phone || c.walletId || c.name)}
                  >
                    <View style={styles.recentAvatar}>
                      <Text style={styles.recentInitial}>{c.name?.[0] || '?'}</Text>
                    </View>
                    <Text style={styles.recentName} numberOfLines={1}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.label}>Amount (KSh)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>KSh</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                maxLength={10}
              />
            </View>
            <View style={styles.quickRow}>
              {quickAmounts.map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickChip}
                  onPress={() => setAmount(amt.toString())}
                >
                  <Text style={styles.quickText}>KSh {amt.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.label}>Note (optional)</Text>
            <View style={styles.inputRow}>
              <Ionicons name="create-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="What's this for?"
                placeholderTextColor={colors.textSecondary}
                value={note}
                onChangeText={setNote}
                maxLength={100}
              />
            </View>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>Send Money</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.md,
    paddingVertical: sizes.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  scroll: { paddingHorizontal: sizes.md, paddingBottom: sizes.xl },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: sizes.md,
    padding: sizes.lg,
    marginBottom: sizes.lg,
  },
  balanceLabel: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  balanceValue: { fontFamily: fonts.bold, fontSize: 28, color: '#fff', marginTop: 4 },
  section: { marginBottom: sizes.lg },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, marginBottom: sizes.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: sizes.sm,
    paddingHorizontal: sizes.md,
    height: 52,
  },
  inputIcon: { marginRight: sizes.sm },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  recentRow: { flexDirection: 'row', marginTop: sizes.md, gap: sizes.sm },
  recentChip: { alignItems: 'center', width: 64 },
  recentAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  recentInitial: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },
  recentName: { fontFamily: fonts.medium, fontSize: 11, color: colors.text, marginTop: 4 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: sizes.sm,
    paddingHorizontal: sizes.md,
    height: 64,
  },
  currency: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary, marginRight: sizes.sm },
  amountInput: { flex: 1, fontFamily: fonts.bold, fontSize: 28, color: colors.text },
  quickRow: { flexDirection: 'row', marginTop: sizes.md, gap: sizes.sm },
  quickChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: sizes.sm,
    paddingVertical: sizes.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: sizes.md,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sizes.lg,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { fontFamily: fonts.bold, fontSize: 16, color: '#fff' },
});

