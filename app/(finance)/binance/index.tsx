// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CandlestickChart from '@/domains/binance/components/CandlestickChart';

const INITIAL_PRICES = {
  BTC: { price: 81832.01, change: 1.23 }, ETH: { price: 2646.88, change: 2.18 },
  SOL: { price: 111.77, change: 0.42 }, BNB: { price: 766.38, change: 1.14 },
  ADA: { price: 0.45, change: -0.85 }, XRP: { price: 0.52, change: 3.21 },
};

export default function BinanceScreen() {
  const [activeTab, setActiveTab] = useState<'Deriv' | 'Binance'>('Deriv');
  const [amount, setAmount] = useState('10');
  const [kamosScore, setKamosScore] = useState(62);
  const [kamosVerdict, setKamosVerdict] = useState<'UP' | 'DOWN' | 'NEUTRAL'>('UP');
  const [probability, setProbability] = useState(65);
  const [prices, setPrices] = useState(INITIAL_PRICES);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(symbol => {
          const volatility = symbol === 'BTC' ? 0.001 : 0.002;
          const change = (Math.random() - 0.5) * volatility;
          updated[symbol] = { price: updated[symbol].price * (1 + change), change: updated[symbol].change + (Math.random() - 0.5) * 0.1 };
        });
        return updated;
      });
      const newScore = Math.floor(55 + Math.random() * 15);
      setKamosScore(newScore);
      setKamosVerdict(newScore >= 60 ? 'UP' : newScore <= 40 ? 'DOWN' : 'NEUTRAL');
      setProbability(Math.floor(60 + Math.random() * 10));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const showComplianceAlert = () => {
    Alert.alert('⚠️ Under Construction', 'Trading and funding features are currently paused pending regulatory compliance and licensing approvals.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ─── REGULATORY COMPLIANCE BANNER ─────────────────── */}
      <View style={styles.complianceBanner}>
        <Ionicons name="warning" size={20} color="#000" />
        <Text style={styles.complianceText}>Under Construction: Trading paused pending regulatory compliance.</Text>
      </View>

      {/* ─── HEADER ──────────────────────────────────────── */}
      <View style={styles.header}>
        <View><Text style={styles.headerTitle}>KAMOS</Text><Text style={styles.headerSubtitle}>BTC/USDT</Text></View>
        <View style={styles.headerRight}>
          <Text style={styles.headerPrice}>${prices.BTC.price.toFixed(2)}</Text>
          <Text style={[styles.headerChange, { color: prices.BTC.change > 0 ? '#00ff88' : '#ff4444' }]}>{prices.BTC.change > 0 ? '+' : ''}{prices.BTC.change.toFixed(2)}%</Text>
        </View>
      </View>

      {/* ─── PORTFOLIO ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Portfolio</Text>
        <View style={styles.portfolioGrid}>
          <View style={styles.portfolioItem}><Text style={styles.portfolioLabel}>Equity</Text><Text style={styles.portfolioValue}>$10,000.00</Text></View>
          <View style={styles.portfolioItem}><Text style={styles.portfolioLabel}>Used Margin</Text><Text style={styles.portfolioValue}>$0.00</Text></View>
          <View style={styles.portfolioItem}><Text style={styles.portfolioLabel}>Realized PnL</Text><Text style={[styles.portfolioValue, { color: '#00ff88' }]}>+$0.00</Text></View>
        </View>
      </View>

      {/* ─── WATCHLIST ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Watchlist</Text>
        <View style={styles.watchlistContainer}>
          {Object.entries(prices).map(([symbol, data]) => (
            <View key={symbol} style={styles.watchlistItem}>
              <Text style={styles.watchlistSymbol}>{symbol}/USDT</Text>
              <View style={styles.watchlistPrices}>
                <Text style={styles.watchlistPrice}>${data.price.toFixed(2)}</Text>
                <Text style={[styles.watchlistChange, { color: data.change > 0 ? '#00ff88' : '#ff4444' }]}>{data.change > 0 ? '+' : ''}{data.change.toFixed(2)}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ─── MARKET STRUCTURE (CHART) ─────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Structure</Text>
        <View style={styles.chartContainer}>
          <CandlestickChart symbol="BTC/USDT" initialPrice={prices.BTC.price} />
        </View>
      </View>

      {/* ─── MARKET CONTEXT ───────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Context</Text>
        <View style={styles.contextGrid}>
          <View style={styles.contextItem}><Text style={styles.contextLabel}>Funding Rate</Text><Text style={styles.contextValue}>0.0108%</Text></View>
          <View style={styles.contextItem}><Text style={styles.contextLabel}>Open Interest</Text><Text style={styles.contextValue}>61.1M</Text></View>
          <View style={styles.contextItem}><Text style={styles.contextLabel}>Fear & Greed</Text><Text style={[styles.contextValue, { color: '#ffa500' }]}>71 (Greed)</Text></View>
        </View>
      </View>

      {/* ─── KAMOS INTELLIGENCE ───────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KAMOS Intelligence</Text>
        <View style={styles.kamosCard}>
          <View style={styles.kamosTop}>
            <View style={styles.scoreCircleContainer}>
              <Text style={styles.scoreNumber}>{kamosScore}</Text>
              <Text style={styles.scoreTotal}>/100</Text>
              <Text style={[styles.directionText, { color: kamosVerdict === 'UP' ? '#00ff88' : '#ff4444' }]}>{kamosVerdict}</Text>
            </View>
            <View style={styles.probabilityGauge}>
              <Text style={styles.probabilityLabel}>Probability</Text>
              <View style={styles.probabilityCircle}>
                <Text style={styles.probabilityNumber}>{probability}%</Text>
                <Text style={styles.probabilityText}>Bullish</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ─── FUND TRADING ACCOUNT (DISABLED) ──────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fund Trading Account</Text>
        <View style={styles.fundingCard}>
          <TextInput style={styles.input} value="500" editable={false} placeholder="Deposit from MTAA Wallet (KES)" placeholderTextColor="#666" />
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Transaction Breakdown</Text>
            <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>MTAA Treasury Fee (2%)</Text><Text style={styles.breakdownValue}>KES 10.00</Text></View>
            <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Network Fee</Text><Text style={styles.breakdownValue}>$ 1.00</Text></View>
            <View style={styles.divider} />
            <View style={styles.breakdownRow}><Text style={styles.totalLabel}>You Receive</Text><Text style={styles.totalValue}>$ 2.85</Text></View>
          </View>
          <TouchableOpacity style={[styles.fundButton, { opacity: 0.5 }]} onPress={showComplianceAlert}>
            <Ionicons name="swap-horizontal" size={20} color="#000" />
            <Text style={styles.fundButtonText}>Convert & Fund (Disabled)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── QUICK TRADE (DISABLED) ──────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Trade</Text>
        <View style={styles.tradeContainer}>
          <View style={styles.tradeButtons}>
            <TouchableOpacity style={[styles.tradeButton, styles.upButton, { opacity: 0.5 }]} onPress={showComplianceAlert}>
              <Ionicons name="arrow-up" size={24} color="#fff" />
              <Text style={styles.tradeButtonText}>UP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tradeButton, styles.downButton, { opacity: 0.5 }]} onPress={showComplianceAlert}>
              <Ionicons name="arrow-down" size={24} color="#fff" />
              <Text style={styles.tradeButtonText}>DOWN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── CONNECT EXCHANGE (DISABLED) ──────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connect Exchange Account</Text>
        <View style={styles.exchangeTabs}>
          <TouchableOpacity style={[styles.exchangeTab, activeTab === 'Deriv' && styles.exchangeTabActive]} onPress={() => setActiveTab('Deriv')}><Text style={styles.exchangeTabText}>Deriv</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.exchangeTab, activeTab === 'Binance' && styles.exchangeTabActive]} onPress={() => setActiveTab('Binance')}><Text style={styles.exchangeTabText}>Binance</Text></TouchableOpacity>
        </View>
        <View style={styles.accountCard}>
          <TextInput style={styles.tokenInput} placeholder="API Key / Token" editable={false} placeholderTextColor="#666" />
          <TouchableOpacity style={[styles.connectButton, { opacity: 0.5 }]} onPress={showComplianceAlert}>
            <Text style={styles.connectButtonText}>Connect Account (Disabled)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16 },
  complianceBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffa500', padding: 12, borderRadius: 8, marginBottom: 16, marginTop: 20 },
  complianceText: { color: '#000', fontWeight: '700', fontSize: 13, marginLeft: 8, flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: '#666' },
  headerRight: { alignItems: 'flex-end' },
  headerPrice: { fontSize: 18, color: '#fff', fontWeight: '700' },
  headerChange: { fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  portfolioGrid: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12 },
  portfolioItem: { flex: 1, padding: 8 },
  portfolioLabel: { fontSize: 11, color: '#666' },
  portfolioValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  watchlistContainer: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12 },
  watchlistItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  watchlistSymbol: { fontSize: 14, fontWeight: '600', color: '#fff' },
  watchlistPrices: { alignItems: 'flex-end' },
  watchlistPrice: { fontSize: 14, color: '#fff', fontWeight: '600' },
  watchlistChange: { fontSize: 12, fontWeight: '600' },
  chartContainer: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, height: 350 },
  contextGrid: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12 },
  contextItem: { flex: 1, padding: 8, alignItems: 'center' },
  contextLabel: { fontSize: 11, color: '#666' },
  contextValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  kamosCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20 },
  kamosTop: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  scoreCircleContainer: { alignItems: 'center' },
  scoreNumber: { fontSize: 48, fontWeight: '800', color: '#00ff88' },
  scoreTotal: { fontSize: 16, color: '#666' },
  directionText: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  probabilityGauge: { alignItems: 'center' },
  probabilityLabel: { fontSize: 12, color: '#666', marginBottom: 8 },
  probabilityCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#00ff88', justifyContent: 'center', alignItems: 'center' },
  probabilityNumber: { fontSize: 24, fontWeight: '800', color: '#00ff88' },
  probabilityText: { fontSize: 10, color: '#666' },
  fundingCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 },
  input: { backgroundColor: '#0a0a0a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 12 },
  breakdownCard: { backgroundColor: '#0a0a0a', borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  breakdownTitle: { color: '#00ff88', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { color: '#666', fontSize: 12 },
  breakdownValue: { color: '#fff', fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 8 },
  totalLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  totalValue: { color: '#00ff88', fontSize: 16, fontWeight: '800' },
  fundButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#00ff88', borderRadius: 8, padding: 14 },
  fundButtonText: { color: '#000', fontWeight: '700', fontSize: 14 },
  tradeContainer: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 },
  tradeButtons: { flexDirection: 'row', gap: 12 },
  tradeButton: { flex: 1, paddingVertical: 20, alignItems: 'center', borderRadius: 12 },
  upButton: { backgroundColor: '#00c853' },
  downButton: { backgroundColor: '#ff1744' },
  tradeButtonText: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4 },
  exchangeTabs: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  exchangeTab: { flex: 1, padding: 10, backgroundColor: '#1a1a1a', borderRadius: 8, alignItems: 'center' },
  exchangeTabActive: { backgroundColor: '#00ff88' },
  exchangeTabText: { color: '#666', fontWeight: '600' },
  accountCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 },
  tokenInput: { backgroundColor: '#0a0a0a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 12 },
  connectButton: { backgroundColor: '#00ff88', borderRadius: 8, padding: 12, alignItems: 'center' },
  connectButtonText: { color: '#000', fontWeight: '700', fontSize: 14 },
});
