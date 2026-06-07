import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useWalletStore } from '@/lib/wallet/wallet.store';
import { useAuthStore } from '@/lib/kernel/auth.store';
import { supabase } from '@/lib/kernel/supabase';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5';
  route: string;
  color: string;
}

interface ServiceItem {
  id: string;
  label: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5';
  route: string;
  badge?: number;
}

interface ActivityItem {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdraw' | 'escrow' | 'qr' | 'savings' | 'gofund';
  title: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  counterparty?: string;
}

export default function WalletHomeV2() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance, currency, fetchBalance } = useWalletStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const quickActions: QuickAction[] = [
    { id: 'send', label: 'Send', icon: 'paper-plane', iconFamily: 'Ionicons', route: '/(os)/wallet/send', color: '#4F46E5' },
    { id: 'receive', label: 'Receive', icon: 'download', iconFamily: 'Ionicons', route: '/(os)/wallet/receive', color: '#10B981' },
    { id: 'qr', label: 'Scan QR', icon: 'qr-code', iconFamily: 'Ionicons', route: '/(os)/wallet/qr-scan', color: '#F59E0B' },
    { id: 'deposit', label: 'Deposit', icon: 'add-circle', iconFamily: 'Ionicons', route: '/(os)/wallet/deposit', color: '#3B82F6' },
  ];

  const financialServices: ServiceItem[] = [
    { id: 'banking', label: 'Banking', icon: 'bank', iconFamily: 'MaterialCommunityIcons', route: '/(os)/wallet/banking-hub' },
    { id: 'gofund', label: 'GoFund', icon: 'hand-heart', iconFamily: 'MaterialCommunityIcons', route: '/(os)/wallet/gofund-hub' },
    { id: 'savings', label: 'Savings', icon: 'piggy-bank', iconFamily: 'FontAwesome5', route: '/(os)/wallet/savings-hub' },
    { id: 'sacco', label: 'SACCO', icon: 'account-group', iconFamily: 'MaterialCommunityIcons', route: '/(os)/wallet/sacco-hub' },
    { id: 'insurance', label: 'Insurance', icon: 'shield-check', iconFamily: 'MaterialCommunityIcons', route: '/(os)/wallet/insurance-hub' },
    { id: 'government', label: 'Gov't', icon: 'landmark', iconFamily: 'FontAwesome5', route: '/(os)/wallet/government-hub' },
    { id: 'credit', label: 'Credit', icon: 'credit-card', iconFamily: 'Ionicons', route: '/(os)/wallet/credit' },
    { id: 'escrow', label: 'Escrow', icon: 'lock-closed', iconFamily: 'Ionicons', route: '/(os)/wallet/escrow' },
  ];

  const civicServices: ServiceItem[] = [
    { id: 'tax', label: 'Tax / KRA', icon: 'receipt', iconFamily: 'Ionicons', route: '/(os)/wallet/tax' },
    { id: 'business', label: 'Business', icon: 'business', iconFamily: 'Ionicons', route: '/(os)/wallet/business' },
    { id: 'agent', label: 'Agent', icon: 'people', iconFamily: 'Ionicons', route: '/(os)/wallet/agent' },
    { id: 'partners', label: 'Partners', icon: 'storefront', iconFamily: 'Ionicons', route: '/(os)/wallet/partner-ecosystem' },
  ];

  const fetchActivity = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('id, type, amount, currency, status, created_at, recipient_name, sender_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const mapped: ActivityItem[] = (data || []).map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        title: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
        amount: tx.amount,
        currency: tx.currency || 'KES',
        status: tx.status,
        timestamp: tx.created_at,
        counterparty: tx.recipient_name || tx.sender_name,
      }));

      setActivity(mapped);
    } catch (err) {
      console.error('Activity fetch error:', err);
    }
  }, [user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { count, error } = await supabase
        .from('wallet_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      setUnreadNotifications(count || 0);
    } catch (err) {
      console.error('Notification count error:', err);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchBalance(), fetchActivity(), fetchNotifications()]);
    setRefreshing(false);
  }, [fetchBalance, fetchActivity, fetchNotifications]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchBalance(), fetchActivity(), fetchNotifications()]);
      setLoading(false);
    };
    init();
  }, [fetchBalance, fetchActivity, fetchNotifications]);

  const renderIcon = (item: QuickAction | ServiceItem, size: number, color?: string) => {
    const props = { name: item.icon as any, size, color: color || '#374151' };
    switch (item.iconFamily) {
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons {...props} />;
      case 'FontAwesome5':
        return <FontAwesome5 {...props} />;
      default:
        return <Ionicons {...props} />;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'send': return { name: 'arrow-up', color: '#EF4444' };
      case 'receive': return { name: 'arrow-down', color: '#10B981' };
      case 'deposit': return { name: 'add', color: '#3B82F6' };
      case 'withdraw': return { name: 'remove', color: '#F59E0B' };
      case 'escrow': return { name: 'lock-closed', color: '#8B5CF6' };
      case 'qr': return { name: 'qr-code', color: '#EC4899' };
      case 'savings': return { name: 'piggy-bank', color: '#10B981' };
      case 'gofund': return { name: 'heart', color: '#EF4444' };
      default: return { name: 'swap-horizontal', color: '#9CA3AF' };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading your wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()},</Text>
          <Text style={styles.userName}>{user?.full_name || user?.email?.split('@')[0] || 'User'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(os)/wallet/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#374151" />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(os)/wallet/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
            <Ionicons
              name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceAmount}>
          {balanceVisible ? formatAmount(balance || 0, currency || 'KES') : '••••••'}
        </Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={styles.balanceAction}
            onPress={() => router.push('/(os)/wallet/history')}
          >
            <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.balanceActionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.balanceAction}
            onPress={() => router.push('/(os)/wallet/withdraw')}
          >
            <Ionicons name="cash-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.balanceActionText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickAction}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                {renderIcon(action, 24, action.color)}
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Financial Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Services</Text>
        <View style={styles.servicesGrid}>
          {financialServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceItem}
              onPress={() => router.push(service.route as any)}
            >
              <View style={styles.serviceIcon}>
                {renderIcon(service, 22, '#4F46E5')}
              </View>
              <Text style={styles.serviceLabel}>{service.label}</Text>
              {service.badge ? (
                <View style={styles.serviceBadge}>
                  <Text style={styles.serviceBadgeText}>{service.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Civic & Business Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Civic & Business</Text>
        <View style={styles.servicesGrid}>
          {civicServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceItem}
              onPress={() => router.push(service.route as any)}
            >
              <View style={styles.serviceIcon}>
                {renderIcon(service, 22, '#059669')}
              </View>
              <Text style={styles.serviceLabel}>{service.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(os)/wallet/history')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {activity.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your recent activity will appear here</Text>
          </View>
        ) : (
          activity.map((item) => {
            const icon = getActivityIcon(item.type);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.activityItem}
                onPress={() => router.push(`/(os)/wallet/history?id=${item.id}` as any)}
              >
                <View style={[styles.activityIcon, { backgroundColor: icon.color + '15' }]}>
                  <Ionicons name={icon.name as any} size={18} color={icon.color} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  {item.counterparty ? (
                    <Text style={styles.activitySubtext}>{item.counterparty}</Text>
                  ) : null}
                  <Text style={styles.activityTime}>{formatTime(item.timestamp)}</Text>
                </View>
                <View style={styles.activityRight}>
                  <Text style={[styles.activityAmount, { color: item.type === 'receive' || item.type === 'deposit' ? '#10B981' : '#374151' }]}>
                    {item.type === 'receive' || item.type === 'deposit' ? '+' : '-'}{formatAmount(item.amount, item.currency)}
                  </Text>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 13,
    color: '#6B7280',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 16,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 16,
  },
  balanceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceActionText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceItem: {
    width: '22%',
    minWidth: 72,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  serviceBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activitySubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  activityRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#D1D5DB',
    marginTop: 4,
  },
  bottomPadding: {
    height: 32,
  },
});
