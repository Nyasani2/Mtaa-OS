import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, Alert, ActivityIndicator, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { useWalletStore } from '@/lib/wallet/state/wallet.store';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  price_usd: number;
  price_kes: number;
  change_24h: number;
  icon_url: string | null;
}

interface CryptoTransaction {
  id: string;
  type: 'buy' | 'sell' | 'send' | 'receive' | 'swap';
  asset_symbol: string;
  amount: number;
  price_at_tx: number;
  total_value_kes: number;
  status: string;
  created_at: string;
  to_address: string | null;
  from_address: string | null;
  tx_hash: string | null;
}

const SUPPORTED_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { symbol: 'USDT', name: 'Tether', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', color: '#2775CA' },
  { symbol: 'SOL', name: 'Solana', color: '#14F195' },
];

export default function CryptoScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [transactions, setTransactions] = useState<CryptoTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'market' | 'history'>('portfolio');
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchAssets = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('crypto_balances').select('*, asset:crypto_assets(*)').eq('user_id', user.id);
    if (!error && data) {
      setAssets(data.map((d: any) => ({
        id: d.id,
        symbol: d.asset?.symbol || d.asset_symbol,
        name: d.asset?.name || d.asset_symbol,
        balance: d.balance,
        price_usd: d.asset?.price_usd || 0,
        price_kes: d.asset?.price_kes || 0,
        change_24h: d.asset?.change_24h || 0,
        icon_url: d.asset?.icon_url
      })));
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('crypto_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    if (!error && data) setTransactions(data);
  }, [user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchAssets(), fetchTransactions()]);
    setLoading(false);
  }, [fetchAssets, fetchTransactions]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadAll(); setRefreshing(false);
  }, [loadAll]);

  const handleTrade = async () => {
    if (!selectedAsset || !user) return;
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter valid amount'); return; }
    const totalKes = amount * selectedAsset.price_kes;
    if (tradeType === 'buy' && totalKes > balance) { Alert.alert('Error', 'Insufficient KES balance'); return; }
    if (tradeType === 'sell' && amount > selectedAsset.balance) { Alert.alert('Error', `Insufficient ${selectedAsset.symbol} balance`); return; }
    setProcessing(true);
    const { error } = await supabase.rpc('crypto_trade', {
      p_user_id: user.id,
      p_asset_symbol: selectedAsset.symbol,
      p_type: tradeType,
      p_amount: amount,
      p_price_kes: selectedAsset.price_kes
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', `${tradeType === 'buy' ? 'Bought' : 'Sold'} ${amount} ${selectedAsset.symbol}`);
    setTradeModalVisible(false); setTradeAmount(''); loadAll();
  };

  const totalPortfolioKes = assets.reduce((sum, a) => sum + (a.balance * a.price_kes), 0);
  const totalPortfolioUsd = assets.reduce((sum, a) => sum + (a.balance * a.price_usd), 0);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#F7931A" />
      <Text style={styles.loadingText}>Loading crypto...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Crypto</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/(os)/wallet/crypto-settings')}>
          <Ionicons name="settings-outline" size={22} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Portfolio Summary */}
      <View style={styles.portfolioCard}>
        <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
        <Text style={styles.portfolioKes}>KES {totalPortfolioKes.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        <Text style={styles.portfolioUsd}>${totalPortfolioUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        <View style={styles.portfolioActions}>
          <TouchableOpacity style={styles.portfolioBtn} onPress={() => { setTradeType('buy'); setTradeModalVisible(true); }}>
            <Ionicons name="arrow-down" size={18} color="#34C759" /><Text style={[styles.portfolioBtnText, { color: '#34C759' }]}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.portfolioBtn} onPress={() => { setTradeType('sell'); setTradeModalVisible(true); }}>
            <Ionicons name="arrow-up" size={18} color="#FF9500" /><Text style={[styles.portfolioBtnText, { color: '#FF9500' }]}>Sell</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.portfolioBtn} onPress={() => Alert.alert('Send', 'Send crypto coming soon')}>
            <Ionicons name="send" size={18} color="#007AFF" /><Text style={[styles.portfolioBtnText, { color: '#007AFF' }]}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['portfolio', 'market', 'history'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'portfolio' && assets.map(asset => (
          <TouchableOpacity key={asset.id} style={styles.assetCard} onPress={() => { setSelectedAsset(asset); setTradeModalVisible(true); }}>
            <View style={[styles.assetIcon, { backgroundColor: (SUPPORTED_ASSETS.find(a => a.symbol === asset.symbol)?.color || '#8E8E93') + '15' }]}>
              <Text style={[styles.assetSymbolText, { color: SUPPORTED_ASSETS.find(a => a.symbol === asset.symbol)?.color || '#8E8E93' }]}>{asset.symbol.slice(0, 2)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.assetName}>{asset.name}</Text>
              <Text style={styles.assetBalance}>{asset.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {asset.symbol}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.assetValue}>KES {(asset.balance * asset.price_kes).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              <Text style={[styles.assetChange, { color: asset.change_24h >= 0 ? '#34C759' : '#FF3B30' }]}>
                {asset.change_24h >= 0 ? '+' : ''}{asset.change_24h.toFixed(2)}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {activeTab === 'market' && SUPPORTED_ASSETS.map(asset => {
          const marketAsset = assets.find(a => a.symbol === asset.symbol);
          const price = marketAsset?.price_kes || 0;
          const change = marketAsset?.change_24h || 0;
          return (
            <View key={asset.symbol} style={styles.marketCard}>
              <View style={[styles.marketIcon, { backgroundColor: asset.color + '15' }]}>
                <Text style={[styles.marketSymbol, { color: asset.color }]}>{asset.symbol}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.marketName}>{asset.name}</Text>
                <Text style={styles.marketPrice}>KES {price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
              </View>
              <Text style={[styles.marketChange, { color: change >= 0 ? '#34C759' : '#FF3B30' }]}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</Text>
            </View>
          );
        })}

        {activeTab === 'history' && transactions.map(tx => (
          <View key={tx.id} style={styles.txCard}>
            <View style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'buy' ? '#34C75920' : tx.type === 'sell' ? '#FF950020' : '#007AFF20' }]}>
                <Ionicons name={tx.type === 'buy' ? 'arrow-down' : tx.type === 'sell' ? 'arrow-up' : 'swap-horizontal'} size={16}
                  color={tx.type === 'buy' ? '#34C759' : tx.type === 'sell' ? '#FF9500' : '#007AFF'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txType}>{tx.type.toUpperCase()} {tx.asset_symbol}</Text>
                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.txAmount}>{tx.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {tx.asset_symbol}</Text>
                <Text style={styles.txValue}>KES {tx.total_value_kes.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </View>
            </View>
            <View style={[styles.txStatusBadge, { backgroundColor: tx.status === 'completed' ? '#34C75920' : '#FF950020' }]}>
              <Text style={[styles.txStatusText, { color: tx.status === 'completed' ? '#34C759' : '#FF9500' }]}>{tx.status.toUpperCase()}</Text>
            </View>
          </View>
        ))}

        {activeTab === 'portfolio' && assets.length === 0 && (
          <View style={styles.empty}>
            <FontAwesome5 name="coins" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>No crypto assets yet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => { setTradeType('buy'); setTradeModalVisible(true); }}>
              <Text style={styles.emptyBtnText}>Buy Crypto</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Trade Modal */}
      <Modal visible={tradeModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{tradeType === 'buy' ? 'Buy' : 'Sell'} Crypto</Text>
            <Text style={styles.modalSubtitle}>KES Balance: {balance.toLocaleString()}</Text>

            {!selectedAsset ? (
              <>
                <Text style={styles.label}>Select Asset</Text>
                {SUPPORTED_ASSETS.map(asset => {
                  const bal = assets.find(a => a.symbol === asset.symbol);
                  return (
                    <TouchableOpacity key={asset.symbol} style={styles.assetSelectCard} onPress={() => setSelectedAsset(bal || { id: '', symbol: asset.symbol, name: asset.name, balance: 0, price_usd: 0, price_kes: 0, change_24h: 0, icon_url: null })}>
                      <View style={[styles.assetSelectIcon, { backgroundColor: asset.color + '15' }]}>
                        <Text style={[styles.assetSelectSymbol, { color: asset.color }]}>{asset.symbol}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.assetSelectName}>{asset.name}</Text>
                        <Text style={styles.assetSelectBalance}>{bal ? `${bal.balance} ${asset.symbol}` : '0 ' + asset.symbol}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.selectedAssetBar} onPress={() => setSelectedAsset(null)}>
                  <Text style={styles.selectedAssetText}>{selectedAsset.symbol} @ KES {selectedAsset.price_kes.toLocaleString()}</Text>
                  <Ionicons name="swap-vertical" size={18} color="#8E8E93" />
                </TouchableOpacity>
                <TextInput style={styles.input} placeholder={`Amount in ${selectedAsset.symbol}`} keyboardType="decimal-pad" value={tradeAmount} onChangeText={setTradeAmount} />
                {tradeAmount && (
                  <Text style={styles.tradeEstimate}>
                    ≈ KES {(parseFloat(tradeAmount) * selectedAsset.price_kes).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Text>
                )}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setTradeModalVisible(false)}><Text style={styles.modalBtnSecondaryText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtnPrimary, { backgroundColor: tradeType === 'buy' ? '#34C759' : '#FF9500' }]} onPress={handleTrade} disabled={processing}>
                    {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>{tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedAsset.symbol}</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' },
  loadingText: { color: '#8E8E93', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#1C1C1E' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  settingsBtn: { padding: 4 },
  portfolioCard: { backgroundColor: '#1C1C1E', margin: 16, borderRadius: 20, padding: 24, alignItems: 'center' },
  portfolioLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  portfolioKes: { fontSize: 32, fontWeight: '800', color: '#fff' },
  portfolioUsd: { fontSize: 16, color: '#8E8E93', marginBottom: 20 },
  portfolioActions: { flexDirection: 'row', gap: 12 },
  portfolioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2C2C2E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  portfolioBtnText: { fontSize: 14, fontWeight: '700' },
  tabBar: { flexDirection: 'row', backgroundColor: '#1C1C1E', paddingHorizontal: 16, paddingBottom: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#2C2C2E' },
  tabText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  assetCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 10 },
  assetIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  assetSymbolText: { fontSize: 16, fontWeight: '800' },
  assetName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  assetBalance: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  assetValue: { fontSize: 15, fontWeight: '700', color: '#fff' },
  assetChange: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  marketCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 10 },
  marketIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  marketSymbol: { fontSize: 14, fontWeight: '800' },
  marketName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  marketPrice: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  marketChange: { fontSize: 14, fontWeight: '700' },
  txCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 10 },
  txRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  txIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  txType: { fontSize: 14, fontWeight: '600', color: '#fff' },
  txDate: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '600', color: '#fff' },
  txValue: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  txStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  txStatusText: { fontSize: 10, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 12, marginBottom: 16 },
  emptyBtn: { backgroundColor: '#34C759', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 10, marginTop: 4 },
  assetSelectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 12, padding: 14, marginBottom: 8 },
  assetSelectIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  assetSelectSymbol: { fontSize: 14, fontWeight: '800' },
  assetSelectName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  assetSelectBalance: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  selectedAssetBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2C2C2E', borderRadius: 12, padding: 14, marginBottom: 12 },
  selectedAssetText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  input: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 12 },
  tradeEstimate: { fontSize: 14, color: '#8E8E93', marginBottom: 16, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2C2C2E', alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#34C759', alignItems: 'center' },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
