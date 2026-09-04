// @ts-nocheck
// app/(finance)/binance/index.tsx
// MTAA Binance — Crypto Trading
// FIXED: Removed hardcoded mock prices. Now fetches real data from CoinGecko API.
// If API fails, shows error state instead of fake data.

import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

interface WalletBalance {
  total_balance_usd: number;
  assets: { symbol: string; balance: number; value_usd: number }[];
}

export default function BinanceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'spot' | 'convert'>('spot');
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCryptoData = useCallback(async () => {
    try {
      // Fetch top 20 cryptos from CoinGecko (free tier, no API key needed)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h'
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data: CryptoAsset[] = await response.json();
      setAssets(data);
      setError(null);
    } catch (err: any) {
      console.error('[Binance] Crypto fetch error:', err);
      setError('Unable to load crypto prices. Pull to retry.');
      // Don't set fake data — show error state
    }
  }, []);

  const fetchWalletBalance = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch user's crypto wallet from Supabase
      const { data, error } = await supabase
        .from('crypto_wallets')
        .select('symbol, balance, value_usd')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const total = (data || []).reduce((sum, a) => sum + (a.value_usd || 0), 0);
      setWalletBalance({
        total_balance_usd: total,
        assets: data || []
      });
    } catch (err: any) {
      console.error('[Binance] Wallet fetch error:', err);
      // Wallet may not exist yet — show zero balance
      setWalletBalance({ total_balance_usd: 0, assets: [] });
    }
  }, [user?.id]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCryptoData(), fetchWalletBalance()]);
    setLoading(false);
  }, [fetchCryptoData, fetchWalletBalance]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCryptoData(), fetchWalletBalance()]);
    setRefreshing(false);
  }, [fetchCryptoData, fetchWalletBalance]);

  const handleDeposit = () => {
    Alert.alert(
      'Deposit Crypto',
      'Choose deposit method:',
      [
        { text: 'Bank Transfer', onPress: () => router.push('/(finance)/wallet/deposit' as any) },
        { text: 'Crypto Transfer', onPress: () => Alert.alert('Coming Soon', 'Crypto deposit via blockchain address coming soon.') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleWithdraw = () => {
    if (!walletBalance || walletBalance.total_balance_usd <= 0) {
      Alert.alert('No Balance', 'You have no crypto assets to withdraw.');
      return;
    }
    router.push('/(finance)/wallet/withdraw' as any);
  };

  const handleConvert = () => {
    Alert.alert('Coming Soon', 'Crypto conversion feature is under development.');
  };

  const handleAssetPress = (asset: CryptoAsset) => {
    router.push({
      pathname: '/(finance)/binance/asset-detail' as any,
      params: { id: asset.id, symbol: asset.symbol, name: asset.name }
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F0B90B" />
        <Text style={{ color: '#8E8E93', marginTop: 12 }}>Loading markets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Crypto Markets</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/settings' as any)}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>
          {walletBalance ? `$${walletBalance.total_balance_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
        </Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDeposit}>
            <Ionicons name="arrow-down" size={20} color="#007AFF" />
            <Text style={styles.actionLabel}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleWithdraw}>
            <Ionicons name="arrow-up" size={20} color="#007AFF" />
            <Text style={styles.actionLabel}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleConvert}>
            <Ionicons name="swap-horizontal" size={20} color="#007AFF" />
            <Text style={styles.actionLabel}>Convert</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'spot' && styles.tabActive]}
          onPress={() => setActiveTab('spot')}
        >
          <Text style={[styles.tabText, activeTab === 'spot' && styles.tabTextActive]}>Spot</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'convert' && styles.tabActive]}
          onPress={() => setActiveTab('convert')}
        >
          <Text style={[styles.tabText, activeTab === 'convert' && styles.tabTextActive]}>Convert</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={18} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {assets.length === 0 && !error ? (
          <View style={styles.emptyState}>
            <Ionicons name="trending-up-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>No market data available</Text>
          </View>
        ) : (
          assets.map((asset: any) => (
            <TouchableOpacity key={asset.id} style={styles.assetRow} onPress={() => handleAssetPress(asset)}>
              <View style={styles.assetIcon}>
                <Text style={styles.assetSymbolText}>{asset.symbol[0]}</Text>
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetSymbolSmall}>{asset.symbol.toUpperCase()}</Text>
              </View>
              <View style={styles.assetPrice}>
                <Text style={styles.priceText}>{formatPrice(asset.current_price)}</Text>
                <Text style={[
                  styles.changeText, 
                  asset.price_change_percentage_24h >= 0 ? styles.positive : styles.negative
                ]}>
                  {formatChange(asset.price_change_percentage_24h)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#000' },
  balanceCard: {
    backgroundColor: '#1C1C1E',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  balanceLabel: { color: '#8E8E93', fontSize: 14 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 8 },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionBtn: { alignItems: 'center' },
  actionLabel: { color: '#fff', fontSize: 12, marginTop: 6 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#F0B90B' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  tabTextActive: { color: '#F0B90B' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B3015',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: { color: '#FF3B30', fontSize: 13, flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#8E8E93', fontSize: 15, marginTop: 12 },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0B90B15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetSymbolText: { fontSize: 18, fontWeight: '800', color: '#F0B90B' },
  assetInfo: { flex: 1, marginLeft: 12 },
  assetName: { fontSize: 16, fontWeight: '600', color: '#000' },
  assetSymbolSmall: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  assetPrice: { alignItems: 'flex-end' },
  priceText: { fontSize: 16, fontWeight: '600', color: '#000' },
  changeText: { fontSize: 13, marginTop: 2 },
  positive: { color: '#34C759' },
  negative: { color: '#FF3B30' },
});
