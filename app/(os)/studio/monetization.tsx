import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

type MonetizationTab = 'overview' | 'memberships' | 'products' | 'tips' | 'sponsors' | 'payouts';

interface RevenueStream {
  id: string;
  name: string;
  icon: string;
  amount: number;
  enabled: boolean;
  color: string;
}

interface MembershipTier {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  benefits: string[];
  subscriber_count: number;
}

interface DigitalProduct {
  id: string;
  name: string;
  price: number;
  type: 'course' | 'ebook' | 'template' | 'preset' | 'other';
  sales_count: number;
  revenue: number;
}

interface TipRecord {
  id: string;
  from_user: string;
  amount: number;
  message: string;
  created_at: string;
}

interface PayoutRecord {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  requested_at: string;
  completed_at?: string;
}

export default function MonetizationFullScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<MonetizationTab>('overview');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [streams, setStreams] = useState<RevenueStream[]>([
    { id: 'ads', name: 'Ad Revenue', icon: 'monitor', amount: 0, enabled: false, color: '#ef4444' },
    { id: 'memberships', name: 'Memberships', icon: 'users', amount: 0, enabled: false, color: '#6366f1' },
    { id: 'tips', name: 'Tips', icon: 'heart', amount: 0, enabled: false, color: '#ec4899' },
    { id: 'products', name: 'Digital Products', icon: 'package', amount: 0, enabled: false, color: '#10b981' },
    { id: 'courses', name: 'Course Sales', icon: 'book-open', amount: 0, enabled: false, color: '#f59e0b' },
    { id: 'events', name: 'Event Tickets', icon: 'calendar', amount: 0, enabled: false, color: '#8b5cf6' },
    { id: 'merch', name: 'Merchandise', icon: 'shopping-bag', amount: 0, enabled: false, color: '#06b6d4' },
    { id: 'music', name: 'Music Sales', icon: 'music', amount: 0, enabled: false, color: '#f97316' },
    { id: 'podcasts', name: 'Podcast Subs', icon: 'mic', amount: 0, enabled: false, color: '#84cc16' },
    { id: 'sponsors', name: 'Sponsorships', icon: 'award', amount: 0, enabled: false, color: '#d946ef' },
    { id: 'affiliate', name: 'Affiliate Links', icon: 'link', amount: 0, enabled: false, color: '#14b8a6' },
  ]);
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [tips, setTips] = useState<TipRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('wallet');

  // New tier form
  const [newTierName, setNewTierName] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');
  const [newTierInterval, setNewTierInterval] = useState<'month' | 'year'>('month');
  const [newTierBenefits, setNewTierBenefits] = useState('');

  // New product form
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductType, setNewProductType] = useState<'course' | 'ebook' | 'template' | 'preset' | 'other'>('course');

  useEffect(() => {
    fetchMonetizationData();
  }, []);

  const fetchMonetizationData = async () => {
    if (!user?.id) return;
    try {
      // Fetch earnings summary
      const { data: earnings } = await supabase
        .from('studio_creator_earnings')
        .select('*')
        .eq('creator_id', user.id)
        .order('period', { ascending: false })
        .limit(1);
      if (earnings && earnings[0]) {
        setTotalEarnings(earnings[0].total_earnings || 0);
        setThisMonth(earnings[0].month_earnings || 0);
      }

      // Fetch membership tiers
      const { data: tiers } = await supabase
        .from('studio_membership_tiers')
        .select('*')
        .eq('creator_id', user.id);
      setMembershipTiers(tiers || []);

      // Fetch products
      const { data: prods } = await supabase
        .from('studio_digital_products')
        .select('*')
        .eq('creator_id', user.id);
      setProducts(prods || []);

      // Fetch tips
      const { data: tipData } = await supabase
        .from('studio_tips')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      setTips(tipData || []);

      // Fetch payouts
      const { data: payoutData } = await supabase
        .from('studio_payouts')
        .select('*')
        .eq('creator_id', user.id)
        .order('requested_at', { ascending: false });
      setPayouts(payoutData || []);
    } catch (e) {
      console.error('Monetization fetch error:', e);
    }
  };

  const toggleStream = async (streamId: string, enabled: boolean) => {
    setStreams(prev => prev.map(s => s.id === streamId ? { ...s, enabled } : s));
    try {
      await supabase.from('studio_revenue_streams').upsert({
        creator_id: user?.id,
        stream_type: streamId,
        enabled,
        updated_at: new Date().toISOString(),
      });
    } catch (e) { console.error(e); }
  };

  const createTier = async () => {
    if (!newTierName.trim() || !newTierPrice || !user?.id) return;
    try {
      await supabase.from('studio_membership_tiers').insert({
        creator_id: user.id,
        name: newTierName,
        price: parseFloat(newTierPrice),
        interval: newTierInterval,
        benefits: newTierBenefits.split('\n').filter(Boolean),
      });
      setNewTierName(''); setNewTierPrice(''); setNewTierBenefits('');
      fetchMonetizationData();
    } catch (e) { console.error(e); }
  };

  const createProduct = async () => {
    if (!newProductName.trim() || !newProductPrice || !user?.id) return;
    try {
      await supabase.from('studio_digital_products').insert({
        creator_id: user.id,
        name: newProductName,
        price: parseFloat(newProductPrice),
        type: newProductType,
      });
      setNewProductName(''); setNewProductPrice('');
      fetchMonetizationData();
    } catch (e) { console.error(e); }
  };

  const requestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0 || amount > totalEarnings) {
      Alert.alert('Invalid Amount', 'Enter a valid amount not exceeding your balance.');
      return;
    }
    try {
      await supabase.from('studio_payouts').insert({
        creator_id: user?.id,
        amount,
        method: payoutMethod,
        status: 'pending',
      });
      setPayoutAmount('');
      fetchMonetizationData();
    } catch (e) { console.error(e); }
  };

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Earnings Cards */}
      <View style={styles.earningsRow}>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <Text style={styles.earningsValue}>${totalEarnings.toFixed(2)}</Text>
        </View>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>This Month</Text>
          <Text style={styles.earningsValue}>${thisMonth.toFixed(2)}</Text>
        </View>
      </View>

      {/* Revenue Streams */}
      <Text style={styles.sectionTitle}>Revenue Streams</Text>
      <Text style={styles.sectionSub}>Enable streams to start earning</Text>
      {streams.map(stream => (
        <View key={stream.id} style={styles.streamRow}>
          <View style={[styles.streamIcon, { backgroundColor: `${stream.color}22` }]}>
            <Feather name={stream.icon as any} size={18} color={stream.color} />
          </View>
          <View style={styles.streamInfo}>
            <Text style={styles.streamName}>{stream.name}</Text>
            <Text style={styles.streamAmount}>${stream.amount.toFixed(2)} earned</Text>
          </View>
          <Switch
            value={stream.enabled}
            onValueChange={(v) => toggleStream(stream.id, v)}
            trackColor={{ false: '#333', true: stream.color }}
            thumbColor={stream.enabled ? '#fff' : '#666'}
          />
        </View>
      ))}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('memberships')}>
          <Feather name="users" size={20} color="#6366f1" />
          <Text style={styles.quickActionText}>Create Membership</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('products')}>
          <Feather name="package" size={20} color="#10b981" />
          <Text style={styles.quickActionText}>Sell Product</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('payouts')}>
          <Feather name="dollar-sign" size={20} color="#f59e0b" />
          <Text style={styles.quickActionText}>Request Payout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderMemberships = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Membership Tiers</Text>
      {membershipTiers.map(tier => (
        <View key={tier.id} style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierName}>{tier.name}</Text>
            <Text style={styles.tierPrice}>${tier.price}/{tier.interval}</Text>
          </View>
          <Text style={styles.tierSubs}>{tier.subscriber_count} subscribers</Text>
          {tier.benefits.map((b, i) => (
            <View key={i} style={styles.tierBenefit}>
              <Feather name="check" size={12} color="#10b981" />
              <Text style={styles.tierBenefitText}>{b}</Text>
            </View>
          ))}
        </View>
      ))}

      <Text style={styles.formSection}>Create New Tier</Text>
      <TextInput style={styles.formInput} value={newTierName} onChangeText={setNewTierName} placeholder="Tier name (e.g., Gold)" placeholderTextColor="#666" />
      <TextInput style={styles.formInput} value={newTierPrice} onChangeText={setNewTierPrice} placeholder="Price (e.g., 9.99)" placeholderTextColor="#666" keyboardType="decimal-pad" />
      <View style={styles.intervalRow}>
        <TouchableOpacity onPress={() => setNewTierInterval('month')} style={[styles.intervalBtn, newTierInterval === 'month' && styles.intervalBtnActive]}>
          <Text style={[styles.intervalText, newTierInterval === 'month' && styles.intervalTextActive]}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setNewTierInterval('year')} style={[styles.intervalBtn, newTierInterval === 'year' && styles.intervalBtnActive]}>
          <Text style={[styles.intervalText, newTierInterval === 'year' && styles.intervalTextActive]}>Yearly</Text>
        </TouchableOpacity>
      </View>
      <TextInput style={[styles.formInput, styles.benefitsInput]} value={newTierBenefits} onChangeText={setNewTierBenefits} placeholder="Benefits (one per line)&#10;• Early access&#10;• Exclusive content&#10;• Member badge" placeholderTextColor="#666" multiline numberOfLines={4} textAlignVertical="top" />
      <TouchableOpacity style={styles.createBtn} onPress={createTier}>
        <Text style={styles.createBtnText}>Create Tier</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderProducts = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Digital Products</Text>
      {products.map(product => (
        <View key={product.id} style={styles.productCard}>
          <View style={styles.productLeft}>
            <View style={[styles.productIcon, { backgroundColor: product.type === 'course' ? '#f59e0b22' : product.type === 'ebook' ? '#6366f122' : '#10b98122' }]}>
              <Feather name={product.type === 'course' ? 'book-open' : product.type === 'ebook' ? 'book' : 'file-text'} size={18} color={product.type === 'course' ? '#f59e0b' : product.type === 'ebook' ? '#6366f1' : '#10b981'} />
            </View>
            <View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>{product.type} • {product.sales_count} sales</Text>
            </View>
          </View>
          <View style={styles.productRight}>
            <Text style={styles.productPrice}>${product.price}</Text>
            <Text style={styles.productRevenue}>${product.revenue.toFixed(2)}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.formSection}>Add New Product</Text>
      <TextInput style={styles.formInput} value={newProductName} onChangeText={setNewProductName} placeholder="Product name" placeholderTextColor="#666" />
      <TextInput style={styles.formInput} value={newProductPrice} onChangeText={setNewProductPrice} placeholder="Price" placeholderTextColor="#666" keyboardType="decimal-pad" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
        {(['course', 'ebook', 'template', 'preset', 'other'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setNewProductType(t)} style={[styles.typeChip, newProductType === t && styles.typeChipActive]}>
            <Text style={[styles.typeChipText, newProductType === t && styles.typeChipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.createBtn} onPress={createProduct}>
        <Text style={styles.createBtnText}>Add Product</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTips = () => (
    <FlatList
      data={tips}
      keyExtractor={t => t.id}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Feather name="heart" size={48} color="#333" />
          <Text style={styles.emptyText}>No tips yet</Text>
          <Text style={styles.emptySub}>Fans can send tips from your channel</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.tipCard}>
          <View style={styles.tipLeft}>
            <View style={styles.tipAvatar}>
              <Text style={styles.tipAvatarText}>{item.from_user.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.tipFrom}>{item.from_user}</Text>
              <Text style={styles.tipMessage} numberOfLines={2}>{item.message || 'Sent a tip'}</Text>
            </View>
          </View>
          <Text style={styles.tipAmount}>+${item.amount.toFixed(2)}</Text>
        </View>
      )}
    />
  );

  const renderSponsors = () => (
    <View style={styles.sponsorContainer}>
      <View style={styles.sponsorCard}>
        <Feather name="award" size={32} color="#d946ef" />
        <Text style={styles.sponsorTitle}>Sponsorship Hub</Text>
        <Text style={styles.sponsorDesc}>Connect with brands looking for creators in your niche. Set your rates and availability.</Text>
        <TouchableOpacity style={styles.sponsorBtn}>
          <Text style={styles.sponsorBtnText}>Set Sponsorship Rates</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sponsorSection}>Your Rates</Text>
      {[
        { type: 'Dedicated Video', rate: '$500', available: true },
        { type: 'Product Integration', rate: '$300', available: true },
        { type: 'Shoutout', rate: '$100', available: false },
        { type: 'Brand Collaboration', rate: '$1,000', available: true },
      ].map((rate, i) => (
        <View key={i} style={styles.rateRow}>
          <View style={styles.rateLeft}>
            <Text style={styles.rateType}>{rate.type}</Text>
            <View style={[styles.rateBadge, rate.available ? styles.rateAvailable : styles.rateUnavailable]}>
              <Text style={styles.rateBadgeText}>{rate.available ? 'Available' : 'Unavailable'}</Text>
            </View>
          </View>
          <Text style={styles.rateValue}>{rate.rate}</Text>
        </View>
      ))}
    </View>
  );

  const renderPayouts = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.payoutBalance}>
        <Text style={styles.payoutBalanceLabel}>Available Balance</Text>
        <Text style={styles.payoutBalanceValue}>${totalEarnings.toFixed(2)}</Text>
      </View>

      <Text style={styles.formSection}>Request Payout</Text>
      <TextInput style={styles.formInput} value={payoutAmount} onChangeText={setPayoutAmount} placeholder="Amount to withdraw" placeholderTextColor="#666" keyboardType="decimal-pad" />
      <Text style={styles.formLabel}>Payout Method</Text>
      <View style={styles.methodRow}>
        {['wallet', 'bank', 'mobile'].map(m => (
          <TouchableOpacity key={m} onPress={() => setPayoutMethod(m)} style={[styles.methodBtn, payoutMethod === m && styles.methodBtnActive]}>
            <Feather name={m === 'wallet' ? 'credit-card' : m === 'bank' ? 'briefcase' : 'smartphone'} size={16} color={payoutMethod === m ? '#6366f1' : '#666'} />
            <Text style={[styles.methodText, payoutMethod === m && styles.methodTextActive]}>{m === 'wallet' ? 'MTAA Wallet' : m === 'bank' ? 'Bank Transfer' : 'Mobile Money'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.createBtn} onPress={requestPayout}>
        <Text style={styles.createBtnText}>Request Payout</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Payout History</Text>
      {payouts.map(p => (
        <View key={p.id} style={styles.payoutItem}>
          <View>
            <Text style={styles.payoutAmount}>${p.amount.toFixed(2)}</Text>
            <Text style={styles.payoutMethod}>{p.method}</Text>
          </View>
          <View style={[styles.payoutStatus, p.status === 'completed' && styles.payoutStatusCompleted, p.status === 'failed' && styles.payoutStatusFailed]}>
            <Text style={styles.payoutStatusText}>{p.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monetization</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/wallet')}>
          <Feather name="credit-card" size={22} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {[
          { id: 'overview' as MonetizationTab, label: 'Overview', icon: 'pie-chart' },
          { id: 'memberships' as MonetizationTab, label: 'Memberships', icon: 'users' },
          { id: 'products' as MonetizationTab, label: 'Products', icon: 'package' },
          { id: 'tips' as MonetizationTab, label: 'Tips', icon: 'heart' },
          { id: 'sponsors' as MonetizationTab, label: 'Sponsors', icon: 'award' },
          { id: 'payouts' as MonetizationTab, label: 'Payouts', icon: 'dollar-sign' },
        ].map(t => (
          <TouchableOpacity key={t.id} onPress={() => setActiveTab(t.id)} style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}>
            <Feather name={t.icon as any} size={14} color={activeTab === t.id ? '#6366f1' : '#666'} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'memberships' && renderMemberships()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'tips' && renderTips()}
        {activeTab === 'sponsors' && renderSponsors()}
        {activeTab === 'payouts' && renderPayouts()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  tabScroll: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  tabBtnActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: '#6366f1' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#6366f1', fontWeight: '700' },

  content: { flex: 1, padding: 16 },

  // Overview
  earningsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  earningsCard: { flex: 1, backgroundColor: '#141414', borderRadius: 12, padding: 16 },
  earningsLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  earningsValue: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  sectionSub: { color: '#666', fontSize: 12, marginBottom: 12 },
  streamRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', padding: 12, borderRadius: 8, marginBottom: 8 },
  streamIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  streamInfo: { flex: 1, marginLeft: 12 },
  streamName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  streamAmount: { color: '#666', fontSize: 12, marginTop: 2 },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  quickAction: { flex: 1, alignItems: 'center', backgroundColor: '#141414', padding: 14, borderRadius: 8, gap: 6 },
  quickActionText: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // Memberships
  tierCard: { backgroundColor: '#141414', borderRadius: 12, padding: 16, marginBottom: 12 },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  tierPrice: { color: '#6366f1', fontSize: 16, fontWeight: '700' },
  tierSubs: { color: '#9ca3af', fontSize: 12, marginTop: 2, marginBottom: 8 },
  tierBenefit: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  tierBenefitText: { color: '#e5e5e5', fontSize: 13 },
  formSection: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  formInput: { backgroundColor: '#1f1f1f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14, marginBottom: 10 },
  benefitsInput: { minHeight: 80, textAlignVertical: 'top' },
  intervalRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  intervalBtn: { flex: 1, alignItems: 'center', padding: 10, backgroundColor: '#1f1f1f', borderRadius: 8 },
  intervalBtnActive: { borderWidth: 1, borderColor: '#6366f1' },
  intervalText: { color: '#666', fontSize: 13, fontWeight: '600' },
  intervalTextActive: { color: '#6366f1' },
  createBtn: { backgroundColor: '#6366f1', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Products
  productCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#141414', padding: 12, borderRadius: 8, marginBottom: 8 },
  productLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  productName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  productMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  productRight: { alignItems: 'flex-end' },
  productPrice: { color: '#fff', fontSize: 14, fontWeight: '700' },
  productRevenue: { color: '#10b981', fontSize: 12, marginTop: 2 },
  typeScroll: { marginVertical: 10 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  typeChipActive: { backgroundColor: '#6366f1' },
  typeChipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  typeChipTextActive: { fontWeight: '700' },

  // Tips
  tipCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#141414', padding: 12, borderRadius: 8, marginBottom: 8 },
  tipLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  tipAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tipFrom: { color: '#fff', fontSize: 14, fontWeight: '600' },
  tipMessage: { color: '#9ca3af', fontSize: 12, marginTop: 2, maxWidth: 200 },
  tipAmount: { color: '#10b981', fontSize: 16, fontWeight: '700' },

  // Sponsors
  sponsorContainer: { padding: 16 },
  sponsorCard: { alignItems: 'center', backgroundColor: '#141414', borderRadius: 16, padding: 24, marginBottom: 20 },
  sponsorTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  sponsorDesc: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  sponsorBtn: { backgroundColor: '#d946ef', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  sponsorBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sponsorSection: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  rateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#141414', padding: 12, borderRadius: 8, marginBottom: 8 },
  rateLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rateType: { color: '#fff', fontSize: 14, fontWeight: '600' },
  rateBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rateAvailable: { backgroundColor: 'rgba(16,185,129,0.2)' },
  rateUnavailable: { backgroundColor: 'rgba(239,68,68,0.2)' },
  rateBadgeText: { fontSize: 10, fontWeight: '700' },
  rateValue: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Payouts
  payoutBalance: { backgroundColor: '#141414', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20 },
  payoutBalanceLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  payoutBalanceValue: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  formLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase' },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1f1f1f', padding: 10, borderRadius: 8 },
  methodBtnActive: { borderWidth: 1, borderColor: '#6366f1' },
  methodText: { color: '#666', fontSize: 12, fontWeight: '600' },
  methodTextActive: { color: '#6366f1' },
  payoutItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#141414', padding: 12, borderRadius: 8, marginBottom: 8 },
  payoutAmount: { color: '#fff', fontSize: 14, fontWeight: '700' },
  payoutMethod: { color: '#666', fontSize: 12, marginTop: 2 },
  payoutStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: '#1f1f1f' },
  payoutStatusCompleted: { backgroundColor: 'rgba(16,185,129,0.2)' },
  payoutStatusFailed: { backgroundColor: 'rgba(239,68,68,0.2)' },
  payoutStatusText: { color: '#9ca3af', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  // Empty
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySub: { color: '#666', fontSize: 13, marginTop: 4 },
});
