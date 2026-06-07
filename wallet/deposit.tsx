import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '@/hooks/useWallet';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

const DEPOSIT_METHODS = [
  { id: 'mpesa', label: 'M-Pesa', icon: '📱', desc: 'PayBill or Till Number' },
  { id: 'bank', label: 'Bank Transfer', icon: '🏦', desc: 'Wire from your bank' },
  { id: 'card', label: 'Card', icon: '💳', desc: 'Debit / Credit card' },
  { id: 'crypto', label: 'Crypto', icon: '₿', desc: 'USDT / USDC / BTC' },
];

export default function DepositScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { walletId, deposit, getDepositAddress } = useWallet();

  const [method, setMethod] = useState('mpesa');
  const [loading, setLoading] = useState(false);
  const [depositAddr, setDepositAddr] = useState('');

  const handleCopy = useCallback((text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Address copied to clipboard');
  }, []);

  const handleDeposit = useCallback(async () => {
    setLoading(true);
    try {
      if (method === 'crypto') {
        const addr = await getDepositAddress?.('USDT');
        setDepositAddr(addr || '');
      } else {
        await deposit?.({ method, amount: 0 }); // amount set by external flow
        Alert.alert('Deposit Initiated', `Check your ${method.toUpperCase()} app to complete the deposit.`);
      }
    } catch (err: any) {
      Alert.alert('Deposit Failed', err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [method, deposit, getDepositAddress]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Wallet ID */}
        <View style={styles.idCard}>
          <Text style={styles.idLabel}>Your Wallet ID</Text>
          <View style={styles.idRow}>
            <Text style={styles.idValue} numberOfLines={1}>{walletId || 'Loading...'}</Text>
            <TouchableOpacity onPress={() => walletId && handleCopy(walletId)}>
              <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Methods */}
        <Text style={styles.sectionLabel}>Select Method</Text>
        {DEPOSIT_METHODS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodCard, method === m.id && styles.methodCardActive]}
            onPress={() => { setMethod(m.id); setDepositAddr(''); }}
          >
            <Text style={styles.methodIcon}>{m.icon}</Text>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodLabel, method === m.id && styles.methodLabelActive]}>{m.label}</Text>
              <Text style={styles.methodDesc}>{m.desc}</Text>
            </View>
            <View style={[styles.radio, method === m.id && styles.radioActive]}>
              {method === m.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Crypto Address Display */}
        {method === 'crypto' && depositAddr ? (
          <View style={styles.addrCard}>
            <Text style={styles.addrLabel}>USDT Deposit Address (TRC20)</Text>
            <View style={styles.addrRow}>
              <Text style={styles.addrValue} numberOfLines={1}>{depositAddr}</Text>
              <TouchableOpacity onPress={() => handleCopy(depositAddr)}>
                <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* M-Pesa Instructions */}
        {method === 'mpesa' && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>M-Pesa Steps</Text>
            <Text style={styles.instructionText}>1. Go to M-Pesa → Lipa na M-Pesa{'
'}2. Select PayBill{'
'}3. Enter Business No: <Text style={styles.bold}>247247</Text>{'
'}4. Account No: <Text style={styles.bold}>{walletId || 'your-wallet-id'}</Text>{'
'}5. Enter amount & PIN</Text>
          </View>
        )}

        {/* Action */}
        <TouchableOpacity
          style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
          onPress={handleDeposit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>
                {method === 'crypto' ? 'Generate Address' : 'I've Sent Money'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  scroll: { paddingHorizontal: SIZES.md, paddingBottom: SIZES.xl },
  idCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  idLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textSecondary },
  idRow: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.sm },
  idValue: { flex: 1, fontFamily: FONTS.mono, fontSize: 14, color: COLORS.text },
  sectionLabel: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: SIZES.md },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardActive: { borderColor: COLORS.primary },
  methodIcon: { fontSize: 28, marginRight: SIZES.md },
  methodInfo: { flex: 1 },
  methodLabel: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text },
  methodLabelActive: { color: COLORS.primary },
  methodDesc: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  addrCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  addrLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textSecondary },
  addrRow: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.sm },
  addrValue: { flex: 1, fontFamily: FONTS.mono, fontSize: 13, color: COLORS.text },
  instructionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  instructionTitle: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text, marginBottom: SIZES.sm },
  instructionText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  bold: { fontFamily: FONTS.bold, color: COLORS.text },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.md,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },
});
