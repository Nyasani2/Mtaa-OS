import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface RevenueBreakdown {
  totalRevenue: number;
  adRevenue: number;
  marketplaceRevenue: number;
  tipsRevenue: number;
  superChatRevenue: number;
  membershipRevenue: number;
  pendingPayout: number;
  lastPayout: number;
  lastPayoutDate: string;
  transactions: {
    id: string;
    type: 'ad' | 'marketplace' | 'tip' | 'super_chat' | 'membership' | 'payout';
    amount: number;
    description: string;
    created_at: string;
  }[];
}

const REVENUE_TYPES = [
  { key: 'ad', label: 'Ad Revenue', icon: 'play-circle', color: '#ff0000', split: '50% You / 50% MTAA' },
  { key: 'marketplace', label: 'Marketplace', icon: 'shopping-bag', color: '#00ff00', split: '90% You / 10% MTAA' },
  { key: 'tip', label: 'Tips', icon: 'heart', color: '#ff6b6b', split: '100% You' },
  { key: 'super_chat', label: 'Super Chat', icon: 'message-square', color: '#ffd700', split: '100% You' },
  { key: 'membership', label: 'Memberships', icon: 'users', color: '#1DA1F2', split: '100% You' },
];

export default function RevenueScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<RevenueBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');

  const fetchRevenue = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: rev } = await supabase
      .from('mstudio_revenue')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    const { data: payouts } = await supabase
      .from('mstudio_payouts')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const transactions = (rev || []).map((r: any) => ({
      id: r.id,
      type: r.revenue_type,
      amount: r.amount,
      description: r.description || `${r.revenue_type} revenue`,
      created_at: r.created_at,
    }));

    const adRev = rev?.filter((r: any) => r.revenue_type === 'ad').reduce((a: number, r: any) => a + (r.amount || 0), 0) || 0;
    const marketRev = rev?.filter((r: any) => r.revenue_type === 'marketplace').reduce((a: number, r: any) => a + (r.amount || 0), 0) || 0;
    const tipsRev = rev?.filter((r: any) => r.revenue_type === 'tip').reduce((a: number, r: any) => a + (r.amount || 0), 0) || 0;
    const superRev = rev?.filter((r: any) => r.revenue_type === 'super_chat').reduce((a: number, r: any) => a + (r.amount || 0), 0) || 0;
    const memberRev = rev?.filter((r: any) => r.revenue_type === 'membership').reduce((a: number, r: any) => a + (r.amount || 0), 0) || 0;

    setData({
      totalRevenue: adRev + marketRev + tipsRev + superRev + memberRev,
      adRevenue: adRev,
      marketplaceRevenue: marketRev,
      tipsRevenue: tipsRev,
      superChatRevenue: superRev,
      membershipRevenue: memberRev,
      pendingPayout: (adRev + marketRev + tipsRev + superRev + memberRev) - (payouts?.[0]?.amount || 0),
      lastPayout: payouts?.[0]?.amount || 0,
      lastPayoutDate: payouts?.[0]?.created_at || '',
      transactions,
    });
    setLoading(false);
  };

  useEffect(() => { fetchRevenue(); }, [user?.id]);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  const formatDate = (date: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff0000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      {/* Header */}
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Revenue</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/wallet')}>
          <Feather name="credit-card" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 }}>
        {(['overview', 'transactions'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab ? '#ff0000' : '#1a1a1a',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: activeTab === tab ? '#fff' : '#888', fontSize: 14, fontWeight: '500', textTransform: 'capitalize' }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' ? (
          <>
            {/* Total Revenue Card */}
            <View style={{ margin: 16, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, alignItems: 'center' }}>
              <Text style={{ color: '#888', fontSize: 13 }}>Total Lifetime Revenue</Text>
              <Text style={{ color: '#fff', fontSize: 36, fontWeight: 'bold', marginTop: 8 }}>KES {formatNumber(data?.totalRevenue || 0)}</Text>
              <View style={{ flexDirection: 'row', marginTop: 16, gap: 24 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#00ff00', fontSize: 16, fontWeight: 'bold' }}>KES {formatNumber(data?.pendingPayout || 0)}</Text>
                  <Text style={{ color: '#888', fontSize: 11 }}>Available</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>KES {formatNumber(data?.lastPayout || 0)}</Text>
                  <Text style={{ color: '#888', fontSize: 11 }}>Last Payout</Text>
                </View>
              </View>
              <TouchableOpacity
                style={{ marginTop: 20, backgroundColor: '#ff0000', borderRadius: 24, paddingHorizontal: 32, paddingVertical: 12 }}
                onPress={() => router.push('/(os)/wallet')}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Withdraw to Wallet</Text>
              </TouchableOpacity>
            </View>

            {/* Revenue Breakdown */}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 12 }}>Revenue Sources</Text>
            {REVENUE_TYPES.map(type => {
              const amount = type.key === 'ad' ? data?.adRevenue :
                type.key === 'marketplace' ? data?.marketplaceRevenue :
                type.key === 'tip' ? data?.tipsRevenue :
                type.key === 'super_chat' ? data?.superChatRevenue :
                data?.membershipRevenue || 0;

              return (
                <View key={type.key} style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${type.color}20`, justifyContent: 'center', alignItems: 'center' }}>
                        <Feather name={type.icon as any} size={18} color={type.color} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>{type.label}</Text>
                        <Text style={{ color: '#666', fontSize: 11 }}>{type.split}</Text>
                      </View>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>KES {formatNumber(amount)}</Text>
                  </View>
                </View>
              );
            })}

            {/* Transparency Note */}
            <View style={{ margin: 16, marginTop: 8, padding: 16, backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#222' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Feather name="shield" size={16} color="#00ff00" />
                <Text style={{ color: '#00ff00', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>100% Transparent</Text>
              </View>
              <Text style={{ color: '#888', fontSize: 12, lineHeight: 18 }}>
                All revenue splits are displayed live. No hidden fees. Wallet updates instantly when revenue is earned. Ad revenue is split 50/50 between you and MTAA. Marketplace transactions have a 10% platform fee. Tips, Super Chats, and Memberships are 100% yours.
              </Text>
            </View>
          </>
        ) : (
          /* Transactions Tab */
          <>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 12 }}>Recent Transactions</Text>
            {(data?.transactions || []).length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Feather name="dollar-sign" size={40} color="#333" />
                <Text style={{ color: '#666', marginTop: 12 }}>No transactions yet</Text>
              </View>
            ) : (
              (data?.transactions || []).map((t, idx) => (
                <View key={t.id} style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>{t.description}</Text>
                      <Text style={{ color: '#666', fontSize: 11, marginTop: 2 }}>{formatDate(t.created_at)}</Text>
                    </View>
                    <Text style={{ color: t.type === 'payout' ? '#ff6b6b' : '#00ff00', fontSize: 16, fontWeight: 'bold' }}>
                      {t.type === 'payout' ? '-' : '+'}KES {formatNumber(t.amount)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
