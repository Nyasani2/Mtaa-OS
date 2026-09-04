// @ts-nocheck
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Dimensions, Animated, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, useAuth } from '@/lib/auth/useAuth';
import { Alert, useWalletStore } from 'app/(os)/wallet/hooks';
import { Alert, sendMoney, getWalletTransactions } from '@/lib/services/wallet-service';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.55;

export default function QrPayScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { accounts, activeAccountId, addTransaction, syncBalance } = useWalletStore();

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const [mode, setMode] = useState<'scan' | 'mycode'>('scan');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [qrData, setQrData] = useState('');

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode === 'mycode' && user?.id) {
      const data = JSON.stringify({
        type: 'mtaa_payment',
        user_id: user.id,
        username: user.user_metadata?.username || 'user',
        timestamp: Date.now(),
      });
      setQrData(data);
    }
  }, [mode, user]);

  const animateToMode = useCallback((targetMode: 'scan' | 'mycode') => {
    Animated.spring(slideAnim, {
      toValue: targetMode === 'scan' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setMode(targetMode);
  }, [slideAnim]);

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        parsed = { user_id: data, type: 'mtaa_payment' };
      }

      if (parsed.type !== 'mtaa_payment' && !parsed.user_id) {
        Alert.alert('Invalid QR', 'This QR code is not a valid MTAA payment code.');
        setScanned(false);
        setLoading(false);
        return;
      }

      // Look up recipient
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, avatar_url')
        .eq('id', parsed.user_id)
        .single();

      if (!profile) {
        Alert.alert('Not Found', 'Could not find the recipient.');
        setScanned(false);
        setLoading(false);
        return;
      }

      setScanResult({
        recipient: profile,
        userId: profile.id,
        prefillAmount: parsed.amount,
      });
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setScanned(false);
      Alert.alert('Scan Error', err.message);
    }
  }, [scanned]);

  const handleSendPayment = useCallback(async () => {
    if (!scanResult) return;
    const numAmount = parseFloat(amount || customAmount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (numAmount > (activeAccount?.balance || 0)) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds.');
      return;
    }

    setLoading(true);
    try {
      const success = await sendMoney(user?.id || '', scanResult.userId, numAmount);
      if (!success) throw new Error('Transfer failed on server');

      // Update local balance
      syncBalance(activeAccountId, (activeAccount?.balance || 0) - numAmount);

      // Add transaction record
      addTransaction({
        id: Date.now().toString(),
        type: 'debit',
        amount: numAmount,
        currency: 'KES',
        description: note || `QR Payment to ${scanResult.recipient?.display_name || 'user'}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        balanceAfter: (activeAccount?.balance || 0) - numAmount,
      });

      setLoading(false);
      Alert.alert(
        'Payment Sent',
        `KSh ${numAmount.toLocaleString()} sent successfully!`,
        [{ text: 'OK', onPress: () => { setScanResult(null); setScanned(false); setAmount(''); setNote(''); } }]
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Payment Failed', err.message);
    }
  }, [scanResult, amount, customAmount, note, activeAccount, activeAccountId, user, syncBalance, addTransaction]);

  const handleEnterCustomAmount = useCallback(() => {
    setShowAmountInput(true);
  }, []);

  const handleSetCustomAmount = useCallback(() => {
    const val = parseFloat(customAmount);
    if (val > 0) {
      setAmount(customAmount);
      setShowAmountInput(false);
    }
  }, [customAmount]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>QR Pay</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Mode Toggle */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => animateToMode('scan')}
            style={[styles.tab, mode === 'scan' && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === 'scan' && styles.tabTextActive]}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => animateToMode('mycode')}
            style={[styles.tab, mode === 'mycode' && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === 'mycode' && styles.tabTextActive]}>My Code</Text>
          </TouchableOpacity>
        </View>

        {/* SCAN MODE */}
        {mode === 'scan' && !scanResult && (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <View style={styles.qrFrame}>
              <Text style={{ color: '#9ca3af', textAlign: 'center' }}>
                Camera view would render here.\nTap below to simulate scan.
              </Text>
            </View>

            <Text style={{ color: '#9ca3af', marginTop: 16, fontSize: 14 }}>
              Point camera at a payment QR code
            </Text>

            <TouchableOpacity onPress={handleEnterCustomAmount} style={styles.actionBtn}>
              <Ionicons name="cash-outline" size={20} color="#10b981" />
              <Text style={styles.actionBtnText}>Enter Custom Amount</Text>
            </TouchableOpacity>

            {/* Simulate scan button for testing */}
            <TouchableOpacity
              onPress={() => {
                if (user?.id) {
                  handleBarCodeScanned({ data: JSON.stringify({ type: 'mtaa_payment', user_id: user.id, amount: 100 }) });
                }
              }}
              style={[styles.actionBtn, { marginTop: 8 }]}
            >
              <Ionicons name="scan-outline" size={20} color="#6366f1" />
              <Text style={styles.actionBtnText}>Simulate Scan (Test)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Custom Amount Input */}
        {showAmountInput && (
          <View style={styles.card}>
            <Text style={styles.label}>Enter Amount</Text>
            <TextInput
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder="0.00"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
            <TouchableOpacity onPress={handleSetCustomAmount} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>Set Amount</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAmountInput(false)} style={{ alignItems: 'center', marginTop: 12 }}>
              <Text style={{ color: '#9ca3af' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scan Result - Payment Form */}
        {scanResult && (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={[styles.card, { alignItems: 'center' }]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(scanResult.recipient?.display_name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                {scanResult.recipient?.display_name || 'Unknown User'}
              </Text>
              <Text style={{ color: '#9ca3af', marginTop: 4 }}>@{scanResult.recipient?.username || 'user'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Amount (KSh)</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#6b7280"
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Note (Optional)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="What's this for?"
                placeholderTextColor="#6b7280"
                style={styles.input}
              />
            </View>

            <TouchableOpacity onPress={handleSendPayment} disabled={loading} style={styles.confirmBtn}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.confirmText}>Send Payment</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setScanResult(null); setScanned(false); }} style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: '#9ca3af' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MY CODE MODE */}
        {mode === 'mycode' && (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <View style={styles.qrWhiteBox}>
              <Text style={{ color: '#000', fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
                {user?.user_metadata?.display_name || 'Your QR Code'}
              </Text>
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={120} color="#000" />
              </View>
            </View>

            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 24 }}>
              {user?.user_metadata?.display_name || 'Your QR Code'}
            </Text>
            <Text style={{ color: '#9ca3af', marginTop: 6, textAlign: 'center', paddingHorizontal: 40 }}>
              Others can scan this code to send you money instantly
            </Text>

            <View style={{ flexDirection: 'row', marginTop: 24, gap: 10 }}>
              <TouchableOpacity onPress={() => setAmount('')} style={[styles.qrAmountBtn, amount === '' && styles.qrAmountBtnActive]}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Any Amount</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEnterCustomAmount} style={[styles.qrAmountBtn, amount !== '' && styles.qrAmountBtnActive]}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  {amount ? `KSh ${parseFloat(amount).toLocaleString()}` : 'Set Amount'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => Alert.alert('Share', 'QR code sharing coming soon')} style={styles.actionBtn}>
              <Ionicons name="share-outline" size={20} color="#6366f1" />
              <Text style={styles.actionBtnText}>Share QR Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 16, padding: 4, borderRadius: 14, marginBottom: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { fontSize: 14, color: '#9ca3af', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  qrFrame: { width: QR_SIZE + 40, height: QR_SIZE + 40, borderRadius: 24, borderWidth: 3, borderColor: '#6366f1', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionBtnText: { color: '#fff', marginLeft: 10, fontWeight: '600', fontSize: 15 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  label: { fontSize: 14, color: '#9ca3af', marginBottom: 8 },
  amountInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  confirmBtn: { backgroundColor: '#10b981', marginHorizontal: 16, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  qrWhiteBox: { backgroundColor: '#fff', padding: 24, borderRadius: 24, alignItems: 'center' },
  qrPlaceholder: { width: QR_SIZE, height: QR_SIZE, backgroundColor: '#f0f0f0', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qrAmountBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  qrAmountBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
});

