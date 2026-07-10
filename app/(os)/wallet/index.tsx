import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Minus,
  ArrowRightLeft,
  QrCode,
  Landmark,
  ShieldCheck,
  Receipt,
  CreditCard,
  TrendingUp,
  Users,
  Heart,
  Settings,
  MapPin,
  UserPlus,
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  description: string;
}

export default function WalletDashboard() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const fetchWalletData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const newErrors: string[] = [];

    try {
      // Fetch wallet balance - handle 406 gracefully
      const { data: accountData, error: accountError } = await supabase
        .from('wallet_accounts')
        .select('balance, available_balance')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (accountError) {
        console.warn('Wallet accounts error:', accountError.message);
        newErrors.push(`wallet_accounts: ${accountError.message}`);
        setBalance(0);
      } else {
        setBalance(accountData?.available_balance || accountData?.balance || 0);
      }

      // Fetch recent transactions
      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txError) {
        console.warn('Transactions error:', txError.message);
        newErrors.push(`wallet_transactions: ${txError.message}`);
        setTransactions([]);
      } else {
        setTransactions(txData || []);
      }

      // Fetch user home settings (silent fail)
      const { error: settingsError } = await supabase
        .from('user_home_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError) {
        console.warn('Home settings error:', settingsError.message);
      }

      setErrors(newErrors);
    } catch (err: any) {
      console.error('Wallet data fetch error:', err);
      setErrors([err.message]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const formatAmount = (amount: number) => {
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ActionButton = ({
    icon: Icon,
    label,
    color,
    onPress,
  }: {
    icon: any;
    label: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{ alignItems: 'center', marginHorizontal: 8 }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: color,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <Icon size={24} color="#fff" />
      </View>
      <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>{label}</Text>
    </TouchableOpacity>
  );

  const HubButton = ({
    icon: Icon,
    label,
    color,
    onPress,
  }: {
    icon: any;
    label: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        width: '23%',
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: color + '15',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Icon size={22} color={color} />
      </View>
      <Text style={{ fontSize: 11, color: '#374151', fontWeight: '500', textAlign: 'center' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>
              Good day, {profile?.full_name || profile?.username || 'User'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/wallet/settings')}>
              <Settings size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={{ padding: 20 }}>
          <View
            style={{
              backgroundColor: '#1F2937',
              borderRadius: 20,
              padding: 24,
            }}
          >
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>
              Available Balance
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 20 }}>
              {formatAmount(balance)}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <ActionButton
                icon={Plus}
                label="Top Up"
                color="#10B981"
                onPress={() => router.push('/wallet/top-up')}
              />
              <ActionButton
                icon={Minus}
                label="Withdraw"
                color="#EF4444"
                onPress={() => router.push('/wallet/withdraw')}
              />
              <ActionButton
                icon={ArrowRightLeft}
                label="Transfer"
                color="#3B82F6"
                onPress={() => router.push('/wallet/transfer')}
              />
              <ActionButton
                icon={QrCode}
                label="Scan"
                color="#8B5CF6"
                onPress={() => router.push('/wallet/scan')}
              />
            </View>
          </View>
        </View>

        {/* Financial Hubs */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
            Financial Hubs
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <HubButton icon={Landmark} label="Treasury" color="#059669" onPress={() => router.push('/wallet/treasury-hub')} />
            <HubButton icon={ShieldCheck} label="Escrow" color="#D97706" onPress={() => router.push('/wallet/escrow-hub')} />
            <HubButton icon={Receipt} label="Tax" color="#DC2626" onPress={() => router.push('/wallet/tax-hub')} />
            <HubButton icon={CreditCard} label="Cards" color="#7C3AED" onPress={() => router.push('/wallet/cards')} />
          </View>
        </View>

        {/* Cashpoint Services */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
            Cashpoint Services
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push('/wallet/cashpoint-map')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#ECFDF5',
                padding: 16,
                borderRadius: 16,
                gap: 12,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                <MapPin size={22} color="#fff" />
              </View>
              <View>
                <Text style={{ fontWeight: '600', color: '#065F46', fontSize: 14 }}>Find Cashpoint</Text>
                <Text style={{ fontSize: 11, color: '#059669' }}>Withdraw cash nearby</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/wallet/become-cashpoint')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFF7ED',
                padding: 16,
                borderRadius: 16,
                gap: 12,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' }}>
                <UserPlus size={22} color="#fff" />
              </View>
              <View>
                <Text style={{ fontWeight: '600', color: '#9A3412', fontSize: 14 }}>Become Cashpoint</Text>
                <Text style={{ fontSize: 11, color: '#EA580C' }}>Start earning</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* More */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
            More
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <HubButton icon={TrendingUp} label="Invest" color="#3B82F6" onPress={() => router.push('/wallet/invest')} />
            <HubButton icon={Users} label="SACCO" color="#EC4899" onPress={() => router.push('/wallet/sacco')} />
            <HubButton icon={Heart} label="GoFund" color="#EF4444" onPress={() => router.push('/wallet/gofund')} />
            <HubButton icon={Settings} label="Settings" color="#6B7280" onPress={() => router.push('/wallet/settings')} />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>
              Recent Transactions
            </Text>
            <TouchableOpacity>
              <Text style={{ fontSize: 13, color: '#3B82F6', fontWeight: '500' }}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color="#3B82F6" />
          ) : transactions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((tx) => (
              <View
                key={tx.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F3F4F6',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '500', color: '#1F2937', fontSize: 14 }}>
                    {tx.description || tx.type}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                    {formatDate(tx.created_at)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontWeight: '600',
                    fontSize: 14,
                    color:
                      tx.type === 'deposit' || tx.type === 'receive'
                        ? '#10B981'
                        : tx.type === 'withdrawal' || tx.type === 'send'
                        ? '#EF4444'
                        : '#1F2937',
                  }}
                >
                  {tx.type === 'deposit' || tx.type === 'receive' ? '+' : '-'}
                  {formatAmount(tx.amount)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Error Display (dev only) */}
        {errors.length > 0 && (
          <View style={{ padding: 20, marginTop: 10 }}>
            <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600', marginBottom: 4 }}>
              Debug Errors:
            </Text>
            {errors.map((err, i) => (
              <Text key={i} style={{ fontSize: 11, color: '#FCA5A5' }}>
                • {err}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
