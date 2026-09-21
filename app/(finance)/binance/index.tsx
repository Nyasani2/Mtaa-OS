// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, Dimensions, RefreshControl,
  Modal, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { kamosIntelligence, KamosIntelligence, calculateFactorsFromData } from '@/lib/modules/binance/kamos-engine';
import { executionEngine } from '@/lib/modules/binance/execution-engine';
import { useASIS } from '@/lib/asis-cse/asis-cse-provider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── REAL-TIME PRICE SIMULATION ───────────────────────────────
const INITIAL_PRICES = {
  BTC: { price: 81832.01, change: 1.23 },
  ETH: { price: 2646.88, change: 2.18 },
  SOL: { price: 111.77, change: 0.42 },
  BNB: { price: 766.38, change: 1.14 },
  ADA: { price: 0.45, change: -0.85 },
  XRP: { price: 0.52, change: 3.21 },
};

// ── UPCOMING EVENTS ──────────────────────────────────────────
const UPCOMING_EVENTS = [
  { name: 'FOMC Meeting', date: 'Aug 30', impact: 'high', type: 'fed' },
  { name: 'NFP Report', date: 'Aug 30', impact: 'high', type: 'employment' },
  { name: 'EU CPI', date: 'Aug 30', impact: 'medium', type: 'inflation' },
  { name: 'BTC Halving', date: 'Apr 2028', impact: 'critical', type: 'crypto' },
];

// ─── CORRELATIONS ─────────────────────────────────────────────
const CORRELATIONS = [
  { symbol: 'ETH', value: 0.92 },
  { symbol: 'SOL', value: 0.78 },
  { symbol: 'BNB', value: 0.85 },
  { symbol: 'ADA', value: 0.71 },
  { symbol: 'XRP', value: 0.68 },
];

export default function BinanceScreen() {
  const { user } = useAuthStore();
  const asis = useASIS();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'Deriv' | 'Binance'>('Deriv');
  const [amount, setAmount] = useState('10');
  const [duration, setDuration] = useState('5 min');
  const [leverage, setLeverage] = useState('1x');
  const [kamosScore, setKamosScore] = useState(62);
  const [kamosVerdict, setKamosVerdict] = useState<'UP' | 'DOWN' | 'NEUTRAL'>('UP');
  const [confidence, setConfidence] = useState(62);
  const [momentum, setMomentum] = useState(40);
  const [patternMatch, setPatternMatch] = useState(32);
  const [marketStructure, setMarketStructure] = useState(46);
  const [context, setContext] = useState(46);
  const [prices, setPrices] = useState(INITIAL_PRICES);
  const [probability, setProbability] = useState(65);
  const [forecast, setForecast] = useState({ price: 90669.87, change: 10.80, confidence: 10 });
  const [portfolio, setPortfolio] = useState({
    equity: 10000.00,
    usedMargin: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    winRate: 0,
    drawdown: 0,
    avgRR: 0.61,
  });
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [learningDay, setLearningDay] = useState(0);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update prices with realistic volatility
      setPrices(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(symbol => {
          const volatility = symbol === 'BTC' ? 0.001 : symbol === 'ETH' ? 0.002 : 0.003;
          const change = (Math.random() - 0.5) * volatility;
          updated[symbol] = {
            price: updated[symbol].price * (1 + change),
            change: updated[symbol].change + (Math.random() - 0.5) * 0.1,
          };
        });
        return updated;
      });
      
      // Update Kamos score dynamically
      const newScore = Math.floor(55 + Math.random() * 15);
      setKamosScore(newScore);
      setKamosVerdict(newScore >= 60 ? 'UP' : newScore <= 40 ? 'DOWN' : 'NEUTRAL');
      setMomentum(Math.floor(35 + Math.random() * 15));
      setPatternMatch(Math.floor(25 + Math.random() * 15));
      setMarketStructure(Math.floor(30 + Math.random() * 20));
      setContext(Math.floor(35 + Math.random() * 20));
      setProbability(Math.floor(60 + Math.random() * 10));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const handleQuickTrade = async (direction: 'UP' | 'DOWN') => {
    Alert.alert(
      'Confirm Trade',
      `Execute ${direction} trade?\nAmount: $${amount}\nLeverage: ${leverage}\nDuration: ${duration}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            console.log(`Executing ${direction} trade: $${amount} at ${leverage}x leverage`);
            // Integrate with execution engine
            const result = await executionEngine.execute({
              id: `trade_${Date.now()}`,
              symbol: 'BTCUSDT',
              direction: direction === 'UP' ? 'LONG' : 'SHORT',
              entry: prices.BTC.price,
              stopLoss: direction === 'UP' ? prices.BTC.price * 0.98 : prices.BTC.price * 1.02,
              takeProfit: direction === 'UP' ? prices.BTC.price * 1.05 : prices.BTC.price * 0.95,
              size: parseFloat(amount),
              leverage: parseInt(leverage),
              kamosScore,
              factors: [],
              dna: '',
              timestamp: Date.now(),
            });
            if (result.success) {
              Alert.alert('Trade Executed', `Order ID: ${result.orderId}`);
            }
          }
        },
      ]
    );
  };

  const askKamos = () => {
    asis?.sendMessage?.(`What is the Kamos trading recommendation for BTC? Current score: ${kamosScore}/100, Probability: ${probability}%`);
  };

  const startLearning = () => {
    setShowLearningModal(true);
    setLearningDay(1);
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff88" />}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── HEADER WITH LIVE PRICE ─────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>KAMOS</Text>
          <Text style={styles.headerSubtitle}>BTC/USDT</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerPrice}>${prices.BTC.price.toFixed(2)}</Text>
          <Text style={[styles.headerChange, { color: prices.BTC.change > 0 ? '#00ff88' : '#ff4444' }]}>
            {prices.BTC.change > 0 ? '+' : ''}{prices.BTC.change.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* ─── PORTFOLIO PANEL ────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Portfolio</Text>
        <View style={styles.portfolioGrid}>
          <View style={styles.portfolioItem}>
            <Text style={styles.portfolioLabel}>Equity</Text>
            <Text style={styles.portfolioValue}>${portfolio.equity.toFixed(2)}</Text>
          </View>
          <View style={styles.portfolioItem}>
            <Text style={styles.portfolioLabel}>Used Margin</Text>
            <Text style={styles.portfolioValue}>${portfolio.usedMargin.toFixed(2)}</Text>
          </View>
          <View style={styles.portfolioItem}>
            <Text style={styles.portfolioLabel}>Realized PnL</Text>
            <Text style={[styles.portfolioValue, { color: portfolio.realizedPnL >= 0 ? '#00ff88' : '#ff4444' }]}>
              {portfolio.realizedPnL >= 0 ? '+' : ''}${portfolio.realizedPnL.toFixed(2)}
            </Text>
          </View>
          <View style={styles.portfolioItem}>
            <Text style={styles.portfolioLabel}>Unrealized PnL</Text>
            <Text style={[styles.portfolioValue, { color: portfolio.unrealizedPnL >= 0 ? '#00ff88' : '#ff4444' }]}>
              {portfolio.unrealizedPnL >= 0 ? '+' : ''}${portfolio.unrealizedPnL.toFixed(2)}
            </Text>
          </View>
          <View style={styles.portfolioItem}>
            <Text style={styles.portfolioLabel}>Win Rate</Text>
            <Text style={styles.portfolioValue}>{portfolio.winRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.portfolioItem}>
            <Text style={styles.portfolioLabel}>Drawdown</Text>
            <Text style={styles.portfolioValue}>{portfolio.drawdown.toFixed(1)}%</Text>
          </View>
        </View>
      </View>

      {/* ─── WATCHLIST ──────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Watchlist</Text>
        <View style={styles.watchlistContainer}>
          {Object.entries(prices).map(([symbol, data]) => (
            <View key={symbol} style={styles.watchlistItem}>
              <Text style={styles.watchlistSymbol}>{symbol}/USDT</Text>
              <View style={styles.watchlistPrices}>
                <Text style={styles.watchlistPrice}>${data.price.toFixed(2)}</Text>
                <Text style={[styles.watchlistChange, { color: data.change > 0 ? '#00ff88' : '#ff4444' }]}>
                  {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ─── MARKET STRUCTURE (CANDLESTICK CHART PLACEHOLDER) ─ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Structure</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartIcon}>📊</Text>
            <Text style={styles.chartText}>Candlestick Chart</Text>
            <Text style={styles.chartSubtext}>100 candles loaded</Text>
            <Text style={styles.chartPrice}>${prices.BTC.price.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* ─── MARKET CONTEXT ─────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Context</Text>
        <View style={styles.contextGrid}>
          <View style={styles.contextItem}>
            <Text style={styles.contextLabel}>Funding Rate</Text>
            <Text style={styles.contextValue}>0.0108%</Text>
          </View>
          <View style={styles.contextItem}>
            <Text style={styles.contextLabel}>Open Interest</Text>
            <Text style={styles.contextValue}>61.1M</Text>
          </View>
          <View style={styles.contextItem}>
            <Text style={styles.contextLabel}>Long/Short</Text>
            <Text style={styles.contextValue}>1.08</Text>
          </View>
          <View style={styles.contextItem}>
            <Text style={styles.contextLabel}>Fear & Greed</Text>
            <Text style={[styles.contextValue, { color: '#ffa500' }]}>71 (Greed)</Text>
          </View>
          <View style={styles.contextItem}>
            <Text style={styles.contextLabel}>BTC Dominance</Text>
            <Text style={styles.contextValue}>58.4%</Text>
          </View>
        </View>
      </View>

      {/* ─── UPCOMING EVENTS ────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <View style={styles.eventsContainer}>
          {UPCOMING_EVENTS.map((event, idx) => (
            <View key={idx} style={styles.eventItem}>
              <View style={styles.eventLeft}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventDate}>{event.date}</Text>
              </View>
              <View style={[styles.eventImpact, { 
                backgroundColor: event.impact === 'critical' ? '#ff4444' : 
                                event.impact === 'high' ? '#ffa500' : '#00ff88' 
              }]}>
                <Text style={styles.eventImpactText}>{event.impact.toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ─── CORRELATIONS ───────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Correlations</Text>
        <View style={styles.correlationsContainer}>
          {CORRELATIONS.map((corr, idx) => (
            <View key={idx} style={styles.correlationItem}>
              <Text style={styles.correlationSymbol}>{corr.symbol}</Text>
              <View style={styles.correlationBar}>
                <View style={[styles.correlationFill, { width: `${corr.value * 100}%` }]} />
              </View>
              <Text style={styles.correlationValue}>{(corr.value * 100).toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ─── MARKET INTELLIGENCE (NEWS) ─────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Intelligence</Text>
        <View style={styles.newsContainer}>
          <View style={styles.newsItem}>
            <Text style={styles.newsSource}>CoinDesk</Text>
            <Text style={styles.newsTitle}>Bitcoin ETF Sees Record $500M Inflow as Institutions Accumulate</Text>
            <Text style={[styles.newsImpact, { color: '#00ff88' }]}>Impact: +80</Text>
          </View>
          <View style={styles.newsItem}>
            <Text style={styles.newsSource}>Bloomberg</Text>
            <Text style={styles.newsTitle}>Major DeFi Protocol Suffers $40M Exploit, Funds Drained</Text>
            <Text style={[styles.newsImpact, { color: '#ff4444' }]}>Impact: -75</Text>
          </View>
          <View style={styles.newsItem}>
            <Text style={styles.newsSource}>Reuters</Text>
            <Text style={styles.newsTitle}>Federal Reserve Signals Potential Rate Cuts in Q3 2026</Text>
            <Text style={[styles.newsImpact, { color: '#00ff88' }]}>Impact: +70</Text>
          </View>
          <View style={styles.newsItem}>
            <Text style={styles.newsSource}>CoinTelegraph</Text>
            <Text style={styles.newsTitle}>Bitcoin Hash Rate Hits All-Time High, Network Security Strengthens</Text>
            <Text style={[styles.newsImpact, { color: '#00ff88' }]}>Impact: +65</Text>
          </View>
        </View>
      </View>

      {/* ─── KAMOS INTELLIGENCE ────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.kamosHeader}>
          <Text style={styles.sectionTitle}>KAMOS Intelligence</Text>
          <TouchableOpacity onPress={askKamos} style={styles.askButton}>
            <Ionicons name="chatbubble-outline" size={16} color="#00ff88" />
            <Text style={styles.askText}>Ask KAMOS</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.kamosCard}>
          <View style={styles.kamosTop}>
            {/* Score Circle */}
            <View style={styles.scoreCircleContainer}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{kamosScore}</Text>
                <Text style={styles.scoreTotal}>/100</Text>
              </View>
              <View style={styles.scoreDirection}>
                <Ionicons 
                  name={kamosVerdict === 'UP' ? 'arrow-up-circle' : kamosVerdict === 'DOWN' ? 'arrow-down-circle' : 'remove-circle'} 
                  size={32} 
                  color={kamosVerdict === 'UP' ? '#00ff88' : kamosVerdict === 'DOWN' ? '#ff4444' : '#ffa500'} 
                />
                <Text style={[styles.directionText, { color: kamosVerdict === 'UP' ? '#00ff88' : kamosVerdict === 'DOWN' ? '#ff4444' : '#ffa500' }]}>
                  {kamosVerdict}
                </Text>
                <Text style={styles.confidenceText}>{confidence}% confidence</Text>
              </View>
            </View>

            {/* Probability Gauge */}
            <View style={styles.probabilityGauge}>
              <Text style={styles.probabilityLabel}>Probability</Text>
              <View style={styles.probabilityCircle}>
                <Text style={styles.probabilityNumber}>{probability}%</Text>
                <Text style={styles.probabilityText}>Bullish</Text>
              </View>
            </View>
          </View>

          {/* Indicator Bars */}
          <View style={styles.indicatorsContainer}>
            <View style={styles.indicator}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorLabel}>Momentum</Text>
                <Text style={styles.indicatorValue}>{momentum}/100</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${momentum}%`, backgroundColor: '#ffa500' }]} />
              </View>
            </View>

            <View style={styles.indicator}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorLabel}>Pattern Match</Text>
                <Text style={styles.indicatorValue}>{patternMatch}/100</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${patternMatch}%`, backgroundColor: '#ff4444' }]} />
              </View>
            </View>

            <View style={styles.indicator}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorLabel}>Market Structure</Text>
                <Text style={styles.indicatorValue}>{marketStructure}/100</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${marketStructure}%`, backgroundColor: '#ff4444' }]} />
              </View>
            </View>

            <View style={styles.indicator}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorLabel}>Context</Text>
                <Text style={styles.indicatorValue}>{context}/100</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${context}%`, backgroundColor: '#ffa500' }]} />
              </View>
            </View>
          </View>

          {/* 4h Forecast */}
          <View style={styles.forecastContainer}>
            <Text style={styles.forecastTitle}>4h Forecast</Text>
            <View style={styles.forecastRow}>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastLabel}>Price</Text>
                <Text style={styles.forecastValue}>${forecast.price.toFixed(2)}</Text>
              </View>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastLabel}>Change</Text>
                <Text style={[styles.forecastValue, { color: '#00ff88' }]}>+{forecast.change}%</Text>
              </View>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastLabel}>Confidence</Text>
                <Text style={styles.forecastValue}>{forecast.confidence}%</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ─── QUICK TRADE ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Trade</Text>
        <View style={styles.tradeContainer}>
          {/* Exchange Toggle */}
          <View style={styles.exchangeToggle}>
            <TouchableOpacity 
              style={[styles.exchangeButton, activeTab === 'Deriv' && styles.exchangeButtonActive]}
              onPress={() => setActiveTab('Deriv')}
            >
              <Text style={[styles.exchangeText, activeTab === 'Deriv' && styles.exchangeTextActive]}>Deriv</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.exchangeButton, activeTab === 'Binance' && styles.exchangeButtonActive]}
              onPress={() => setActiveTab('Binance')}
            >
              <Text style={[styles.exchangeText, activeTab === 'Binance' && styles.exchangeTextActive]}>Binance</Text>
            </TouchableOpacity>
          </View>

          {/* Trade Info */}
          <Text style={styles.tradeInfo}>
            {activeTab === 'Deriv' 
              ? 'Fixed-time contracts: UP = price rises, DOWN = price falls.'
              : 'Crypto futures: UP = LONG, DOWN = SHORT. Leverage available.'}
          </Text>

          {/* Trade Inputs */}
          <View style={styles.tradeInputs}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <TextInput 
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#666"
              />
            </View>

            {activeTab === 'Deriv' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duration (minutes)</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{duration}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Leverage</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{leverage}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* KAMOS Score Bar */}
          <View style={styles.kamosScoreBar}>
            <Text style={styles.kamosScoreLabel}>KAMOS Score</Text>
            <View style={styles.kamosScoreTrack}>
              <View style={[styles.kamosScoreFill, { width: `${kamosScore}%` }]} />
            </View>
            <Text style={styles.kamosScoreValue}>{kamosScore}/100</Text>
            <Text style={styles.kamosScoreVerdict}>
              {kamosScore >= 60 ? 'MODERATE UP' : kamosScore <= 40 ? 'MODERATE DOWN' : 'NEUTRAL'}
            </Text>
          </View>

          {/* Trade Buttons */}
          <View style={styles.tradeButtons}>
            <TouchableOpacity 
              style={[styles.tradeButton, styles.upButton]}
              onPress={() => handleQuickTrade('UP')}
            >
              <Ionicons name="arrow-up" size={24} color="#fff" />
              <Text style={styles.tradeButtonText}>UP</Text>
              <Text style={styles.tradeButtonSubtext}>{activeTab === 'Deriv' ? 'Rise' : 'Long'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tradeButton, styles.downButton]}
              onPress={() => handleQuickTrade('DOWN')}
            >
              <Ionicons name="arrow-down" size={24} color="#fff" />
              <Text style={styles.tradeButtonText}>DOWN</Text>
              <Text style={styles.tradeButtonSubtext}>{activeTab === 'Deriv' ? 'Fall' : 'Short'}</Text>
            </TouchableOpacity>
          </View>

          {/* Learning Button */}
          <TouchableOpacity style={styles.learningButton} onPress={startLearning}>
            <Text style={styles.learningButtonText}> Start 6-Day Demo Learning</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── DERIV ACCOUNT ──────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deriv Account</Text>
        <View style={styles.accountCard}>
          <Text style={styles.accountLabel}>API Token</Text>
          <TextInput 
            style={styles.tokenInput}
            placeholder="Paste your Deriv API token..."
            placeholderTextColor="#666"
            secureTextEntry
          />
          <Text style={styles.accountHint}>
            Get token: Deriv.com → Settings → API Token → Create (enable Trading permission)
          </Text>
          <View style={styles.accountTypeRow}>
            <Text style={styles.accountTypeLabel}>Account Type</Text>
            <TouchableOpacity style={styles.demoButton}>
              <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
              <Text style={styles.demoButtonText}>Demo</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.connectButton}>
            <Text style={styles.connectButtonText}>Connect Demo Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── LEARNING MODAL ─────────────────────────────────── */}
      <Modal
        visible={showLearningModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLearningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>6-Day Demo Learning</Text>
            <Text style={styles.modalSubtitle}>Day {learningDay} of 6</Text>
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Welcome to KAMOS trading! Today you'll learn how to read market signals and make informed trades.
              </Text>
              <View style={styles.modalProgress}>
                {[1, 2, 3, 4, 5, 6].map(day => (
                  <View 
                    key={day} 
                    style={[
                      styles.progressDot, 
                      day <= learningDay && styles.progressDotActive
                    ]} 
                  />
                ))}
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowLearningModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={() => {
                  if (learningDay < 6) {
                    setLearningDay(learningDay + 1);
                  } else {
                    setShowLearningModal(false);
                    Alert.alert('Complete!', 'You finished the 6-day learning course!');
                  }
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  {learningDay < 6 ? 'Next Day' : 'Finish'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerPrice: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  headerChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  // Portfolio
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
  },
  portfolioItem: {
    width: '33.33%',
    padding: 10,
  },
  portfolioLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  portfolioValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Watchlist
  watchlistContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
  },
  watchlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  watchlistSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  watchlistPrices: {
    alignItems: 'flex-end',
  },
  watchlistPrice: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  watchlistChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Chart
  chartContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    height: 280,
  },
  chartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
  },
  chartIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  chartText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  chartSubtext: {
    fontSize: 12,
    color: '#444',
  },
  chartPrice: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: '700',
    marginTop: 12,
  },
  // Context
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
  },
  contextItem: {
    width: '33.33%',
    padding: 10,
    alignItems: 'center',
  },
  contextLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  contextValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Events
  eventsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  eventLeft: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
  },
  eventImpact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  eventImpactText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  // Correlations
  correlationsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
  },
  correlationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  correlationSymbol: {
    width: 50,
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  correlationBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  correlationFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 3,
  },
  correlationValue: {
    width: 50,
    textAlign: 'right',
    fontSize: 14,
    color: '#00ff88',
    fontWeight: '600',
  },
  // News
  newsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  newsItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  newsSource: {
    fontSize: 11,
    color: '#00ff88',
    fontWeight: '600',
    marginBottom: 6,
  },
  newsTitle: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 6,
    lineHeight: 18,
  },
  newsImpact: {
    fontSize: 12,
    fontWeight: '600',
  },
  // KAMOS
  kamosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 8,
  },
  askText: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '600',
  },
  kamosCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
  },
  kamosTop: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircleContainer: {
    alignItems: 'center',
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#00ff88',
  },
  scoreTotal: {
    fontSize: 16,
    color: '#666',
    marginTop: -8,
  },
  scoreDirection: {
    alignItems: 'center',
  },
  directionText: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  probabilityGauge: {
    alignItems: 'center',
  },
  probabilityLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  probabilityCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#00ff88',
    justifyContent: 'center',
    alignItems: 'center',
  },
  probabilityNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00ff88',
  },
  probabilityText: {
    fontSize: 10,
    color: '#666',
  },
  indicatorsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  indicator: {
    gap: 8,
  },
  indicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  indicatorLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  indicatorValue: {
    fontSize: 13,
    color: '#666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  forecastContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  forecastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  forecastItem: {
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Trade
  tradeContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  exchangeToggle: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  exchangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  exchangeButtonActive: {
    backgroundColor: '#ff9500',
  },
  exchangeText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  exchangeTextActive: {
    color: '#fff',
  },
  tradeInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    lineHeight: 16,
  },
  tradeInputs: {
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  dropdownText: {
    color: '#fff',
    fontSize: 16,
  },
  kamosScoreBar: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
  },
  kamosScoreLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  kamosScoreTrack: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  kamosScoreFill: {
    height: '100%',
    backgroundColor: '#ffa500',
    borderRadius: 4,
  },
  kamosScoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffa500',
    marginBottom: 4,
  },
  kamosScoreVerdict: {
    fontSize: 12,
    color: '#666',
  },
  tradeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tradeButton: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
    borderRadius: 12,
    gap: 4,
  },
  upButton: {
    backgroundColor: '#00c853',
  },
  downButton: {
    backgroundColor: '#ff1744',
  },
  tradeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  tradeButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  learningButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  learningButtonText: {
    color: '#00ff88',
    fontWeight: '600',
    fontSize: 14,
  },
  // Account
  accountCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  accountLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  tokenInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 8,
  },
  accountHint: {
    fontSize: 11,
    color: '#666',
    marginBottom: 12,
    lineHeight: 16,
  },
  accountTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountTypeLabel: {
    fontSize: 13,
    color: '#666',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  demoButtonText: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: '#00ff88',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#00ff88',
    marginBottom: 20,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
  },
  progressDotActive: {
    backgroundColor: '#00ff88',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    flex: 1,
    padding: 12,
    backgroundColor: '#00ff88',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonTextSecondary: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalButtonTextPrimary: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
