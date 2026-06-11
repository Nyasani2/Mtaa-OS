// app/(finance)/binance/index.tsx
// MTAA Binance — Crypto Trading

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ASSETS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: 67234.50, change: 2.4, color: '#F7931A' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: 3521.80, change: -1.2, color: '#627EEA' },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', price: 1.00, change: 0.0, color: '#26A17B' },
];

export default function BinanceScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'spot' | 'convert'>('spot');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Binance</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>$12,456.78</Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="arrow-down" size={20} color="#007AFF" />
            <Text style={styles.actionLabel}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="arrow-up" size={20} color="#007AFF" />
            <Text style={styles.actionLabel}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {ASSETS.map(asset => (
          <TouchableOpacity key={asset.id} style={styles.assetRow}>
            <View style={[styles.assetIcon, { backgroundColor: `${asset.color}15` }]}>
              <Text style={[styles.assetSymbol, { color: asset.color }]}>{asset.symbol[0]}</Text>
            </View>
            <View style={styles.assetInfo}>
              <Text style={styles.assetName}>{asset.name}</Text>
              <Text style={styles.assetSymbolText}>{asset.symbol}</Text>
            </View>
            <View style={styles.assetPrice}>
              <Text style={styles.priceText}>${asset.price.toLocaleString()}</Text>
              <Text style={[styles.changeText, asset.change >= 0 ? styles.positive : styles.negative]}>
                {asset.change >= 0 ? '+' : ''}{asset.change}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetSymbol: { fontSize: 18, fontWeight: '800' },
  assetInfo: { flex: 1, marginLeft: 12 },
  assetName: { fontSize: 16, fontWeight: '600', color: '#000' },
  assetSymbolText: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  assetPrice: { alignItems: 'flex-end' },
  priceText: { fontSize: 16, fontWeight: '600', color: '#000' },
  changeText: { fontSize: 13, marginTop: 2 },
  positive: { color: '#34C759' },
  negative: { color: '#FF3B30' },
});
