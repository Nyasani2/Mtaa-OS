import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAgent } from '../../hooks/useAgent';
import QRCode from 'react-native-qrcode-svg';

export default function AgentDashboardScreen() {
  const { agent, dashboard, loading, refreshDashboard } = useAgent();

  if (!agent || agent.status !== 'active') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#666' }}>You are not an active agent</Text>
      </View>
    );
  }

  const stats = dashboard?.today_stats;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f5f5f5' }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshDashboard} />}
    >
      {/* Header Card */}
      <View style={{ backgroundColor: '#007AFF', padding: 20, paddingTop: 40 }}>
        <Text style={{ color: '#fff', fontSize: 14, opacity: 0.8 }}>{agent.business_name}</Text>
        <Text style={{ color: '#fff', fontSize: 12, opacity: 0.7, marginTop: 2 }}>{agent.agent_type.toUpperCase()}</Text>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 10 }}>
          KES {agent.float_balance?.toLocaleString()}
        </Text>
        <Text style={{ color: '#fff', fontSize: 12, opacity: 0.8 }}>Float Balance</Text>
      </View>

      {/* Stats Grid */}
      <View style={{ flexDirection: 'row', padding: 12, marginTop: -20 }}>
        {[
          { label: 'Today Deposits', value: stats?.deposits || 0, color: '#28a745' },
          { label: 'Today Withdrawals', value: stats?.withdrawals || 0, color: '#dc3545' },
          { label: 'Commission', value: stats?.commission || 0, color: '#ffc107' },
          { label: 'Transactions', value: stats?.transaction_count || 0, color: '#6c757d' },
        ].map((s, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: '#fff', margin: 4, padding: 12, borderRadius: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: s.color }}>KES {s.value.toLocaleString()}</Text>
            <Text style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* QR Code */}
      <View style={{ backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Your Agent QR Code</Text>
        {agent.qr_code_data ? (
          <QRCode value={agent.qr_code_data} size={180} />
        ) : (
          <Text style={{ color: '#888' }}>No QR code available</Text>
        )}
        <Text style={{ fontSize: 12, color: '#888', marginTop: 10, textAlign: 'center' }}>
          Customers scan this to verify your agent status
        </Text>
      </View>

      {/* Recent Transactions */}
      <View style={{ backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Recent Transactions</Text>
        {dashboard?.recent_transactions?.length === 0 && (
          <Text style={{ color: '#888', fontSize: 14 }}>No transactions yet</Text>
        )}
        {dashboard?.recent_transactions?.map((tx) => (
          <View key={tx.id} style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500' }}>
                {tx.transaction_type === 'customer_deposit' ? '📥 Deposit' : '📤 Withdrawal'}
              </Text>
              <Text style={{ fontSize: 12, color: '#888' }}>{tx.customer_phone} • {tx.reference_code}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: tx.transaction_type === 'customer_deposit' ? '#28a745' : '#dc3545' }}>
                {tx.transaction_type === 'customer_deposit' ? '+' : '-'}KES {tx.amount?.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 11, color: '#ffc107' }}>+KES {tx.commission?.toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Float History */}
      <View style={{ backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 12, marginBottom: 30 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Float History</Text>
        {dashboard?.float_history?.slice(0, 5).map((h) => (
          <View key={h.id} style={{
            flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
            borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '500' }}>{h.description}</Text>
              <Text style={{ fontSize: 11, color: '#888' }}>{new Date(h.created_at).toLocaleTimeString()}</Text>
            </View>
            <Text style={{
              fontSize: 13, fontWeight: '600',
              color: h.amount > 0 ? '#28a745' : h.amount < 0 ? '#dc3545' : '#333',
            }}>
              {h.amount > 0 ? '+' : ''}{h.amount?.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

