// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

// African and Caribbean Countries
const COUNTRIES = [
  // African Countries
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', currency: 'ETB' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', currency: 'MAD' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', currency: 'XOF' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', currency: 'XAF' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', currency: 'ZWL' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', currency: 'ZMW' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', currency: 'MWK' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', currency: 'MZN' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', currency: 'BWP' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', currency: 'NAD' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', currency: 'SZL' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸', currency: 'LSL' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', currency: 'AOA' },
  { code: 'CD', name: 'DRC', flag: '🇨🇩', currency: 'CDF' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', currency: 'XAF' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', currency: 'XAF' },
  { code: 'GQ', name: 'Eq. Guinea', flag: '🇬🇶', currency: 'XAF' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', currency: 'XAF' },
  { code: 'CF', name: 'CAR', flag: '🇨🇫', currency: 'XAF' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', currency: 'XOF' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', currency: 'XOF' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', currency: 'XOF' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', currency: 'GNF' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', currency: 'SLL' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', currency: 'LRD' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', currency: 'GMD' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', currency: 'XOF' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻', currency: 'CVE' },
  { code: 'ST', name: 'São Tomé', flag: '🇸🇹', currency: 'STN' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', currency: 'XOF' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', currency: 'XOF' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷', currency: 'MRU' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', currency: 'DJF' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', currency: 'SOS' },
  { code: 'SS', name: 'S. Sudan', flag: '🇸🇸', currency: 'SSP' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', currency: 'SDG' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', currency: 'LYD' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', currency: 'TND' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', currency: 'DZD' },
  { code: 'EH', name: 'W. Sahara', flag: '🇪🇭', currency: 'MAD' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', currency: 'MUR' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', currency: 'SCR' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲', currency: 'KMF' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', currency: 'MGA' },
  { code: 'RE', name: 'Réunion', flag: '🇷🇪', currency: 'EUR' },
  { code: 'YT', name: 'Mayotte', flag: '🇾🇹', currency: 'EUR' },
  
  // Caribbean Countries
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', currency: 'JMD' },
  { code: 'TT', name: 'Trinidad & Tobago', flag: '🇹🇹', currency: 'TTD' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧', currency: 'BBD' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸', currency: 'BSD' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩', currency: 'XCD' },
  { code: 'LC', name: 'St. Lucia', flag: '🇱🇨', currency: 'XCD' },
  { code: 'VC', name: 'St. Vincent', flag: '🇻🇨', currency: 'XCD' },
  { code: 'AG', name: 'Antigua & Barbuda', flag: '🇦🇬', currency: 'XCD' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲', currency: 'XCD' },
  { code: 'KN', name: 'St. Kitts & Nevis', flag: '🇰🇳', currency: 'XCD' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹', currency: 'HTG' },
  { code: 'DO', name: 'Dominican Rep.', flag: '🇩🇴', currency: 'DOP' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', currency: 'CUP' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', currency: 'USD' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾', currency: 'GYD' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷', currency: 'SRD' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿', currency: 'BZD' },
];

export default function CentralBankDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    liquidity: {
      totalDigitalKES: 0,
      activeWalletBalance: 0,
      totalWallets: 0,
      reservesAdequate: true,
    },
    fxFflows: [],
    escrowLiabilities: [],
    taxRevenue: [],
    agentFloat: [],
    dailyVolume: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCountry]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      // 1. Liquidity & Reserve Monitoring
      const { data: walletData } = await supabase
        .from('wallet_accounts')
        .select('balance, currency')
        .eq('currency', selectedCountry.currency);
      
      const totalDigital = walletData?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0;
      const activeBalance = walletData?.filter(w => w.balance > 0).reduce((sum, w) => sum + (w.balance || 0), 0) || 0;
      
      // 2. FX & Cross-Border Flows
      const { data: fxFdata } = await supabase
        .from('binance_conversions')
        .select('*')
        .eq('country_code', selectedCountry.code)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // 3. Escrow Liabilities
      const { data: escrowData } = await supabase
        .from('escrow_accounts')
        .select('amount, status')
        .eq('status', 'held');
      
      const totalEscrow = escrowData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      
      // 4. Tax Revenue Collection
      const { data: taxData } = await supabase
        .from('revenue_payments')
        .select('tax_type, amount, created_at')
        .eq('country_code', selectedCountry.code)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // 5. Agent Float Exposure
      const { data: agentData } = await supabase
        .from('wallet_agents')
        .select('float_balance, daily_transaction_limit')
        .eq('status', 'active');
      
      const totalAgentFloat = agentData?.reduce((sum, a) => sum + (a.float_balance || 0), 0) || 0;
      
      // 6. Daily Transaction Volume
      const { data: dailyData } = await supabase
        .from('wallet_transactions')
        .select('amount, direction, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      setDashboardData({
        liquidity: {
          totalDigitalKES: totalDigital,
          activeWalletBalance: activeBalance,
          totalWallets: walletData?.length || 0,
          reservesAdequate: totalDigital >= activeBalance,
        },
        fxFflows: fxFdata || [],
        escrowLiabilities: [{ amount: totalEscrow, status: 'held' }],
        taxRevenue: taxData || [],
        agentFloat: [{ totalFloat: totalAgentFloat, agents: agentData?.length || 0 }],
        dailyVolume: dailyData || [],
      });
    } catch (error) {
      console.error('[CentralBank] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading Central Bank Data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with Country Selector */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Central Bank Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Country Selector */}
      <View style={styles.countrySelectorContainer}>
        <TouchableOpacity 
          style={styles.countrySelector}
          onPress={() => setShowCountrySelector(!showCountrySelector)}
        >
          <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
          <View style={styles.countryInfo}>
            <Text style={styles.countryName}>{selectedCountry.name}</Text>
            <Text style={styles.countryCurrency}>{selectedCountry.currency}</Text>
          </View>
          <Ionicons 
            name={showCountrySelector ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>

        {showCountrySelector && (
          <View style={styles.countryDropdown}>
            <ScrollView style={styles.countryList}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryItem,
                    selectedCountry.code === country.code && styles.countryItemActive
                  ]}
                  onPress={() => {
                    setSelectedCountry(country);
                    setShowCountrySelector(false);
                  }}
                >
                  <Text style={styles.countryItemFlag}>{country.flag}</Text>
                  <View style={styles.countryItemInfo}>
                    <Text style={[
                      styles.countryItemName,
                      selectedCountry.code === country.code && styles.countryItemNameActive
                    ]}>
                      {country.name}
                    </Text>
                    <Text style={styles.countryItemCurrency}>{country.currency}</Text>
                  </View>
                  {selectedCountry.code === country.code && (
                    <Ionicons name="checkmark" size={20} color="#10b981" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* 1. Liquidity & Reserve Monitoring */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>1. Liquidity & Reserve Monitoring</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Total Digital {selectedCountry.currency} in Circulation</Text>
            <Text style={styles.value}>{formatCurrency(dashboardData.liquidity.totalDigitalKES, selectedCountry.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Active Wallet Balance</Text>
            <Text style={styles.value}>{formatCurrency(dashboardData.liquidity.activeWalletBalance, selectedCountry.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Wallets</Text>
            <Text style={styles.value}>{dashboardData.liquidity.totalWallets}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.statusText}>
              Reserves {dashboardData.liquidity.reservesAdequate ? 'Adequate' : 'Insufficient'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. FX & Cross-Border Flows */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="globe" size={20} color="#3b82f6" />
          <Text style={styles.sectionTitle}>2. FX & Cross-Border Flows (Binance Bridge)</Text>
        </View>
        <View style={styles.card}>
          {dashboardData.fxFflows.length === 0 ? (
            <Text style={styles.emptyText}>No FX flows recorded</Text>
          ) : (
            dashboardData.fxFflows.map((flow, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemText}>
                  {flow.from_currency} → {flow.to_currency}
                </Text>
                <Text style={styles.itemValue}>
                  {formatCurrency(flow.amount, flow.from_currency)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* 3. Escrow Liabilities */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed" size={20} color="#f59e0b" />
          <Text style={styles.sectionTitle}>3. Escrow Liabilities (Systemic Risk)</Text>
        </View>
        <View style={styles.card}>
          {dashboardData.escrowLiabilities.length === 0 ? (
            <Text style={styles.emptyText}>No escrow liabilities</Text>
          ) : (
            dashboardData.escrowLiabilities.map((escrow, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemText}>Total Held in Escrow</Text>
                <Text style={styles.itemValue}>
                  {formatCurrency(escrow.amount, selectedCountry.currency)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* 4. Tax Revenue Collection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cash" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>4. Tax Revenue Collection</Text>
        </View>
        <View style={styles.card}>
          {dashboardData.taxRevenue.length === 0 ? (
            <Text style={styles.emptyText}>No tax records</Text>
          ) : (
            dashboardData.taxRevenue.map((tax, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemText}>
                  {tax.tax_type} - {new Date(tax.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.itemValue}>
                  {formatCurrency(tax.amount, selectedCountry.currency)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* 5. Agent Float Exposure */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people" size={20} color="#8b5cf6" />
          <Text style={styles.sectionTitle}>5. Agent Float Exposure</Text>
        </View>
        <View style={styles.card}>
          {dashboardData.agentFloat.length === 0 ? (
            <Text style={styles.emptyText}>No agent data</Text>
          ) : (
            dashboardData.agentFloat.map((agent, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemText}>Total Agent Float ({agent.agents} agents)</Text>
                <Text style={styles.itemValue}>
                  {formatCurrency(agent.totalFloat, selectedCountry.currency)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* 6. Daily Transaction Volume */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bar-chart" size={20} color="#06b6d4" />
          <Text style={styles.sectionTitle}>6. Daily Transaction Volume</Text>
        </View>
        <View style={styles.card}>
          {dashboardData.dailyVolume.length === 0 ? (
            <Text style={styles.emptyText}>No transactions in last 7 days</Text>
          ) : (
            dashboardData.dailyVolume.slice(0, 10).map((tx, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemText}>
                  {tx.direction} - {new Date(tx.created_at).toLocaleDateString()}
                </Text>
                <Text style={[
                  styles.itemValue,
                  { color: tx.direction === 'credit' ? '#10b981' : '#ef4444' }
                ]}>
                  {tx.direction === 'credit' ? '+' : '-'}
                  {formatCurrency(tx.amount, selectedCountry.currency)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#1a1a1a' },
  backButton: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  
  // Country Selector
  countrySelectorContainer: { position: 'relative', backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  countrySelector: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  countryFlag: { fontSize: 28 },
  countryInfo: { flex: 1 },
  countryName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  countryCurrency: { color: '#666', fontSize: 12 },
  countryDropdown: { maxHeight: 300, backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  countryList: { maxHeight: 300 },
  countryItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, backgroundColor: '#1a1a1a' },
  countryItemActive: { backgroundColor: '#2a2a2a' },
  countryItemFlag: { fontSize: 24 },
  countryItemInfo: { flex: 1 },
  countryItemName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  countryItemNameActive: { color: '#10b981' },
  countryItemCurrency: { color: '#666', fontSize: 11 },
  
  // Sections
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: '#666', fontSize: 13 },
  value: { color: '#fff', fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { color: '#10b981', fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', padding: 20 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  itemText: { color: '#fff', fontSize: 13, flex: 1 },
  itemValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  footer: { height: 40 },
});
