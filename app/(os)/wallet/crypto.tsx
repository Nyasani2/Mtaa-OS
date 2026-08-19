import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { useWalletStore } from 'app/(os)/wallet/hooks';
import { getWalletTransactions } from '@/lib/services/wallet-service';
import { supabase } from '@/lib/supabase';

const CRYPTO_ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: '#f59e0b' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: '#6366f1' },
  { id: 'usdt', symbol: 'USDT', name: 'Tether', color: '#22c55e' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', color: '#14b8a6' },
];

const QUICK_AMOUNTS = [0.001, 0.01, 0.1, 1, 10];

// Mock rates in KES
const rates: Record<string, number> = {
  bitcoin: 6500000,
  ethereum: 350000,
  usdt: 130,
  solana: 14500,
};

export default function CryptoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { accounts, activeAccountId, addTransaction, syncBalance } = useWalletStore();

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'swap'>('send');
  const [selectedAsset, setSelectedAsset] = useState('bitcoin');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cryptoBalances, setCryptoBalances] = useState<Record<string, number>>({});
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [swapFrom, setSwapFrom] = useState('bitcoin');
  const [swapTo, setSwapTo] = useState('ethereum');
  const [swapAmount, setSwapAmount] = useState('');
  const [estimatedReceive, setEstimatedReceive] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    loadCryptoData();
  }, [user?.id]);

  const loadCryptoData = useCallback(async () => {
    try {
      const { data: accounts } = await supabase
        .from('wallet_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .in('currency', ['BTC', 'ETH', 'USDT', 'SOL']);

      const balances: Record<string, number> = {};
      accounts?.forEach((acc) => {
        const key = CRYPTO_ASSETS.find(a => a.symbol === acc.currency)?.id || acc.currency.toLowerCase();
        balances[key] = acc.balance || 0;
      });
      setCryptoBalances(balances);

      const txs = await getWalletTransactions(user?.id);
      const cryptoTxs = txs.filter((tx: any) => ['BTC', 'ETH', 'USDT', 'SOL'].includes(tx.currency));
      setTxHistory(cryptoTxs);
    } catch (err) {
      console.error('Crypto load error:', err);
    }
  }, [user?.id]);

  const handleSendCrypto = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (!recipientAddress.trim() || recipientAddress.trim().length < 10) {
      Alert.alert('Invalid Address', 'Please enter a valid wallet address');
      return;
    }

    const asset = CRYPTO_ASSETS.find(a => a.id === selectedAsset);
    const currentBalance = cryptoBalances[selectedAsset] || 0;
    if (numAmount > currentBalance) {
      Alert.alert('Insufficient Balance', `You only have ${currentBalance.toFixed(6)} ${asset?.symbol}`);
      return;
    }

    setLoading(true);
    try {
      const { data: tx, error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user?.id,
          wallet_id: activeAccount?.id,
          amount: numAmount,
          type: 'crypto_send',
          status: 'pending',
          description: `Send ${numAmount} ${asset?.symbol} to ${recipientAddress.slice(0, 12)}...`,
          reference_type: 'crypto_transfer',
          currency: asset?.symbol,
          metadata: { to_address: recipientAddress, asset: selectedAsset, memo: memo || null },
        })
        .select()
        .single();

      if (error) throw error;

      setTimeout(async () => {
        await supabase.from('wallet_transactions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', tx.id);
        setCryptoBalances(prev => ({ ...prev, [selectedAsset]: (prev[selectedAsset] || 0) - numAmount }));
        addTransaction({
          id: tx.id,
          type: 'debit',
          amount: numAmount,
          currency: asset?.symbol || 'BTC',
          description: `Sent ${numAmount} ${asset?.symbol}`,
          status: 'completed',
          timestamp: new Date().toISOString(),
          balanceAfter: (activeAccount?.balance || 0),
        });
        setLoading(false);
        Alert.alert('Transaction Sent', `${numAmount} ${asset?.symbol} sent to ${recipientAddress.slice(0, 12)}...`, [{ text: 'OK', onPress: () => { setAmount(''); setRecipientAddress(''); setMemo(''); } }]);
      }, 2000);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Send Failed', err.message);
    }
  }, [amount, recipientAddress, memo, selectedAsset, cryptoBalances, user, activeAccount, addTransaction]);

  const handleSwap = useCallback(async () => {
    const numAmount = parseFloat(swapAmount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount to swap');
      return;
    }
    const fromAsset = CRYPTO_ASSETS.find(a => a.id === swapFrom);
    const toAsset = CRYPTO_ASSETS.find(a => a.id === swapTo);
    const fromBalance = cryptoBalances[swapFrom] || 0;

    if (numAmount > fromBalance) {
      Alert.alert('Insufficient Balance', `You only have ${fromBalance.toFixed(6)} ${fromAsset?.symbol}`);
      return;
    }
    if (swapFrom === swapTo) {
      Alert.alert('Invalid Swap', 'Cannot swap the same asset');
      return;
    }

    const fromValue = numAmount * (rates[swapFrom] || 1);
    const toValue = fromValue / (rates[swapTo] || 1);
    const receiveAmount = toValue * 0.995;

    setLoading(true);
    try {
      const { data: tx, error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user?.id,
          wallet_id: activeAccount?.id,
          amount: numAmount,
          type: 'crypto_swap',
          status: 'completed',
          description: `Swapped ${numAmount} ${fromAsset?.symbol} to ${receiveAmount.toFixed(6)} ${toAsset?.symbol}`,
          reference_type: 'crypto_swap',
          currency: fromAsset?.symbol,
          metadata: { from_asset: swapFrom, to_asset: swapTo, from_amount: numAmount, to_amount: receiveAmount },
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setCryptoBalances(prev => ({
        ...prev,
        [swapFrom]: (prev[swapFrom] || 0) - numAmount,
        [swapTo]: (prev[swapTo] || 0) + receiveAmount,
      }));

      addTransaction({
        id: tx.id,
        type: 'crypto_swap',
        amount: numAmount,
        currency: fromAsset?.symbol || 'BTC',
        description: `Swapped to ${toAsset?.symbol}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        balanceAfter: activeAccount?.balance || 0,
      });

      setLoading(false);
      Alert.alert('Swap Complete', `You swapped ${numAmount} ${fromAsset?.symbol} for ${receiveAmount.toFixed(6)} ${toAsset?.symbol}`, [{ text: 'OK', onPress: () => { setSwapAmount(''); setEstimatedReceive(''); } }]);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Swap Failed', err.message);
    }
  }, [swapAmount, swapFrom, swapTo, cryptoBalances, user, activeAccount, addTransaction]);

  const calculateSwapEstimate = useCallback(() => {
    const numAmount = parseFloat(swapAmount);
    if (!numAmount || swapFrom === swapTo) { setEstimatedReceive(''); return; }
    const fromValue = numAmount * (rates[swapFrom] || 1);
    const toValue = fromValue / (rates[swapTo] || 1);
    setEstimatedReceive((toValue * 0.995).toFixed(6));
  }, [swapAmount, swapFrom, swapTo]);

  useEffect(() => { calculateSwapEstimate(); }, [calculateSwapEstimate]);

  const currentAsset = CRYPTO_ASSETS.find(a => a.id === selectedAsset);
  const currentBalance = cryptoBalances[selectedAsset] || 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Crypto Wallet</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Asset Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          {CRYPTO_ASSETS.map((asset) => {
            const balance = cryptoBalances[asset.id] || 0;
            const kesValue = balance * (rates[asset.id] || 0);
            return (
              <TouchableOpacity key={asset.id} onPress={() => setSelectedAsset(asset.id)} style={[styles.assetCard, selectedAsset === asset.id && { borderColor: asset.color, backgroundColor: asset.color + '15' }]}>
                <View style={[styles.assetIcon, { backgroundColor: asset.color + '30' }]}>
                  <Text style={{ color: asset.color, fontWeight: '800', fontSize: 12 }}>{asset.symbol}</Text>
                </View>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginTop: 8 }}>{balance.toFixed(4)}</Text>
                <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>KSh {kesValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          {(['send', 'receive', 'swap'] as const).map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SEND TAB */}
        {activeTab === 'send' && (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={styles.card}>
              <Text style={styles.label}>Amount ({currentAsset?.symbol})</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: currentAsset?.color, fontSize: 18, fontWeight: '700', marginRight: 8 }}>{currentAsset?.symbol}</Text>
                <TextInput value={amount} onChangeText={setAmount} placeholder="0.000000" placeholderTextColor="#6b7280" keyboardType="decimal-pad" style={{ flex: 1, color: '#fff', fontSize: 24, fontWeight: '700' }} />
                <TouchableOpacity onPress={() => setAmount(currentBalance.toString())}><Text style={{ color: '#6366f1', fontWeight: '600' }}>MAX</Text></TouchableOpacity>
              </View>
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>Balance: {currentBalance.toFixed(6)} {currentAsset?.symbol}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, paddingHorizontal: 0 }}>
              {QUICK_AMOUNTS.map((val) => (
                <TouchableOpacity key={val} onPress={() => setAmount(val.toString())} style={[styles.quickBtn, amount === val.toString() && { backgroundColor: '#6366f1', borderColor: '#6366f1' }]}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Recipient Address</Text>
              <TextInput value={recipientAddress} onChangeText={setRecipientAddress} placeholder={`Enter ${currentAsset?.symbol} wallet address...`} placeholderTextColor="#6b7280" autoCapitalize="none" style={styles.input} />
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Memo (Optional)</Text>
              <TextInput value={memo} onChangeText={setMemo} placeholder="Transaction memo or tag..." placeholderTextColor="#6b7280" style={styles.input} />
            </View>

            <TouchableOpacity onPress={handleSendCrypto} disabled={loading} style={[styles.confirmBtn, { backgroundColor: currentAsset?.color || '#6366f1' }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Send {currentAsset?.symbol}</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* RECEIVE TAB */}
        {activeTab === 'receive' && (
          <View style={{ paddingHorizontal: 16, alignItems: 'center' }}>
            <View style={styles.whiteCard}>
              <Text style={{ color: '#000', fontSize: 14, fontWeight: '700', marginBottom: 12 }}>{currentAsset?.name} ({currentAsset?.symbol})</Text>
              <View style={styles.qrBox}>
                <Ionicons name="qr-code" size={100} color="#000" />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Your {currentAsset?.symbol} Address</Text>
              <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'monospace' }} numberOfLines={1}>{`${user?.id?.slice(0, 16) || '0x'}...${currentAsset?.symbol.toLowerCase()}_mtaa`}</Text>
            </View>

            <TouchableOpacity onPress={() => Alert.alert('Copied', `${currentAsset?.symbol} address copied to clipboard`)} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 10, fontWeight: '700' }}>Copy Address</Text>
            </TouchableOpacity>

            <Text style={styles.warningText}>Only send {currentAsset?.symbol} to this address. Sending other assets may result in permanent loss.</Text>
          </View>
        )}

        {/* SWAP TAB */}
        {activeTab === 'swap' && (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={styles.card}>
              <Text style={styles.label}>From</Text>
              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                {CRYPTO_ASSETS.map((asset) => (
                  <TouchableOpacity key={asset.id} onPress={() => setSwapFrom(asset.id)} style={[styles.assetChip, swapFrom === asset.id && { backgroundColor: asset.color + '30', borderColor: asset.color }]}>
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>{asset.symbol}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput value={swapAmount} onChangeText={setSwapAmount} placeholder="0.00" placeholderTextColor="#6b7280" keyboardType="decimal-pad" style={{ color: '#fff', fontSize: 22, fontWeight: '700' }} />
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Balance: {(cryptoBalances[swapFrom] || 0).toFixed(6)} {CRYPTO_ASSETS.find(a => a.id === swapFrom)?.symbol}</Text>
            </View>

            <View style={{ alignItems: 'center', marginVertical: 8 }}>
              <TouchableOpacity onPress={() => { const temp = swapFrom; setSwapFrom(swapTo); setSwapTo(temp); }} style={styles.swapArrow}>
                <Ionicons name="swap-vertical" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>To</Text>
              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                {CRYPTO_ASSETS.map((asset) => (
                  <TouchableOpacity key={asset.id} onPress={() => setSwapTo(asset.id)} style={[styles.assetChip, swapTo === asset.id && { backgroundColor: asset.color + '30', borderColor: asset.color }]}>
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>{asset.symbol}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{estimatedReceive || '0.00'} {CRYPTO_ASSETS.find(a => a.id === swapTo)?.symbol}</Text>
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Rate: 1 {CRYPTO_ASSETS.find(a => a.id === swapFrom)?.symbol} = {((rates[swapFrom] || 1) / (rates[swapTo] || 1)).toFixed(6)} {CRYPTO_ASSETS.find(a => a.id === swapTo)?.symbol}</Text>
            </View>

            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#9ca3af' }}>Network Fee</Text><Text style={{ color: '#fff' }}>0.5%</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#9ca3af' }}>Minimum Receive</Text><Text style={{ color: '#fff' }}>{estimatedReceive || '0.00'} {CRYPTO_ASSETS.find(a => a.id === swapTo)?.symbol}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleSwap} disabled={loading || !swapAmount || parseFloat(swapAmount) <= 0} style={[styles.confirmBtn, (!swapAmount || parseFloat(swapAmount) <= 0) && { backgroundColor: '#333', opacity: 0.6 }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Swap Now</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Transaction History */}
        <View style={[styles.card, { marginTop: 24 }]}>
          <Text style={styles.sectionLabel}>Recent Transactions</Text>
          {txHistory.length === 0 ? (
            <Text style={{ color: '#6b7280', fontStyle: 'italic' }}>No crypto transactions yet</Text>
          ) : (
            txHistory.slice(0, 5).map((tx, idx) => {
              const asset = CRYPTO_ASSETS.find(a => a.symbol === tx.currency);
              return (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={[styles.txIcon, { backgroundColor: (asset?.color || '#6366f1') + '20' }]}>
                    <Text style={{ color: asset?.color || '#6366f1', fontWeight: '800', fontSize: 10 }}>{asset?.symbol || 'BTC'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 14 }} numberOfLines={1}>{tx.description}</Text>
                    <Text style={{ color: '#6b7280', fontSize: 11 }}>{new Date(tx.created_at || tx.timestamp).toLocaleDateString()}</Text>
                  </View>
                  <Text style={{ color: tx.type === 'crypto_send' || tx.type === 'debit' ? '#ef4444' : '#22c55e', fontWeight: '700' }}>
                    {tx.type === 'crypto_send' || tx.type === 'debit' ? '-' : '+'}{tx.amount} {tx.currency}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  assetCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginRight: 12, minWidth: 120, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  assetIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 16, padding: 4, borderRadius: 14, marginBottom: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { fontSize: 14, color: '#9ca3af', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  label: { fontSize: 14, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  quickBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  confirmBtn: { backgroundColor: '#6366f1', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  whiteCard: { backgroundColor: '#fff', padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 20 },
  qrBox: { width: 160, height: 160, backgroundColor: '#f0f0f0', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  warningText: { color: '#6b7280', textAlign: 'center', marginTop: 20, fontSize: 13, lineHeight: 20, paddingHorizontal: 20 },
  assetChip: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  swapArrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { color: '#9ca3af', fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

