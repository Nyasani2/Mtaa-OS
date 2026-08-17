import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAgent } from '../../hooks/useAgent';

interface AgentHubScreenProps {
  onNavigate: (screen: string) => void;
}

export default function AgentHubScreen({ onNavigate }: AgentHubScreenProps) {
  const { agent, dashboard } = useAgent();

  const isActive = agent?.status === 'active';

  const menuItems = [
    {
      title: 'Register as Agent',
      desc: 'Apply to become a kiosk, mobile or stationary agent',
      icon: '📝',
      screen: 'AgentRegistration',
      show: !agent,
      color: '#007AFF',
    },
    {
      title: 'Agent Dashboard',
      desc: 'Float balance, stats, QR code, history',
      icon: '📊',
      screen: 'AgentDashboard',
      show: isActive,
      color: '#007AFF',
    },
    {
      title: 'Customer Deposit',
      desc: 'Take cash, credit customer wallet (+0.5%)',
      icon: '📥',
      screen: 'AgentDeposit',
      show: isActive,
      color: '#28a745',
    },
    {
      title: 'Customer Withdrawal',
      desc: 'Give cash, debit customer wallet (+0.5%)',
      icon: '📤',
      screen: 'AgentWithdrawal',
      show: isActive,
      color: '#dc3545',
    },
    {
      title: 'Top Up Float',
      desc: 'Add more float from your wallet',
      icon: '💰',
      screen: 'AgentFloatTopup',
      show: isActive,
      color: '#ffc107',
    },
    {
      title: 'Find Agents',
      desc: 'Locate nearby agents on the map',
      icon: '🗺️',
      screen: 'AgentMap',
      show: true,
      color: '#6f42c1',
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#007AFF', padding: 20, paddingTop: 40 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Agent Services</Text>
        {isActive && (
          <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
              KES {agent?.float_balance?.toLocaleString()}
            </Text>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 12, marginLeft: 12,
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{agent?.agent_type}</Text>
            </View>
          </View>
        )}
        {isActive && (
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
            Commission today: KES {dashboard?.today_stats?.commission?.toLocaleString() || 0}
          </Text>
        )}
      </View>

      {/* Menu Grid */}
      <View style={{ padding: 12 }}>
        {menuItems.filter(item => item.show).map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onNavigate(item.screen)}
            style={{
              backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
              padding: 16, borderRadius: 12, marginBottom: 10,
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
            }}
          >
            <View style={{
              width: 48, height: 48, borderRadius: 12, backgroundColor: item.color + '15',
              justifyContent: 'center', alignItems: 'center', marginRight: 14,
            }}>
              <Text style={{ fontSize: 24 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{item.desc}</Text>
            </View>
            <Text style={{ fontSize: 20, color: '#ccc' }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status Banner */}
      {agent && agent.status !== 'active' && (
        <View style={{
          margin: 16, marginTop: 0, padding: 16, borderRadius: 12,
          backgroundColor: agent.status === 'pending_approval' ? '#fff3cd' : '#f8d7da',
          borderWidth: 1, borderColor: agent.status === 'pending_approval' ? '#ffc107' : '#dc3545',
        }}>
          <Text style={{
            fontSize: 14, fontWeight: '600',
            color: agent.status === 'pending_approval' ? '#856404' : '#721c24',
          }}>
            {agent.status === 'pending_approval' ? '⏳ Awaiting Admin Approval' :
             agent.status === 'approved' ? '✅ Approved — Pay KES 100,000 to Activate' :
             '❌ Account ' + agent.status}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

