import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Agent {
  id: string;
  business_name: string;
  city: string;
  is_active: boolean;
  rating: number;
  services: string[];
}

export default function AgentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [myAgent, setMyAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data: mine } = await supabase
          .from('agent_applications')
          .select('id, business_name, city, is_active, rating, services')
          .eq('user_id', user.id)
          .maybeSingle();
        setMyAgent(mine);
      }

      const { data: all } = await supabase
        .from('agent_applications')
        .select('id, business_name, city, is_active, rating, services')
        .eq('status', 'verified')
        .eq('is_active', true)
        .limit(20);
      setAgents(all || []);
    } catch (err) {
      console.error('Agent load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const serviceIcons: Record<string, string> = {
    'Cash Deposit': 'cash-outline',
    'Cash Withdrawal': 'cash-outline',
    'Money Transfer': 'swap-horizontal',
    'Bill Payment': 'receipt-outline',
    'Airtime Purchase': 'phone-portrait-outline',
    'Bank Transfer': 'card-outline',
    'Loan Disbursement': 'trending-up-outline',
    'SACCO Deposit': 'people-outline',
    'School Fees Payment': 'school-outline',
    'Utility Payment': 'flash-outline',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agents</Text>
        <TouchableOpacity onPress={() => router.push('/(agent)/transactions' as any)}>
          <Ionicons name="list-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* My Agent / Onboarding CTA */}
      {myAgent ? (
        <TouchableOpacity style={styles.myAgentCard} onPress={() => router.push({ pathname: '/(agent)/dashboard', params: { id: myAgent.id } } as any)}>
          <View style={styles.myAgentHeader}>
            <Ionicons name="storefront" size={28} color="#10B981" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.myAgentName}>{myAgent.business_name}</Text>
              <Text style={styles.myAgentMeta}>{myAgent.city}</Text>
            </View>
            <View style={[styles.statusBadge, myAgent.is_active ? styles.statusOpen : styles.statusClosed]}>
              <Text style={styles.statusText}>{myAgent.is_active ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
          <View style={styles.myAgentServices}>
            {myAgent.services?.slice(0, 4).map((s: any) => (
              <View key={s} style={styles.serviceTag}>
                <Ionicons name={serviceIcons[s] as any || 'checkmark-circle'} size={12} color="#10B981" />
                <Text style={styles.serviceText}>{s}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.onboardCard} onPress={() => router.push('/(agent)/onboarding' as any)}>
          <Ionicons name="storefront-outline" size={32} color="#10B981" />
          <Text style={styles.onboardTitle}>Become an Agent</Text>
          <Text style={styles.onboardDesc}>Register as an MTAA agent, offer financial services, and earn commission on every transaction.</Text>
          <View style={styles.onboardBtn}>
            <Text style={styles.onboardBtnText}>Apply Now</Text>
            <Ionicons name="arrow-forward" size={16} color="#0f172a" />
          </View>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Nearby Agents</Text>
      {loading ? (
        <ActivityIndicator color="#10B981" style={{ marginTop: 20 }} />
      ) : agents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={48} color="#475569" />
          <Text style={styles.emptyText}>No agents nearby</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {agents.map((agent: any) => (
            <TouchableOpacity key={agent.id} style={styles.agentCard} onPress={() => router.push({ pathname: '/(agent)/detail', params: { id: agent.id } } as any)}>
              <View style={styles.agentHeader}>
                <View style={styles.agentAvatar}>
                  <Ionicons name="storefront" size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.agentName}>{agent.business_name}</Text>
                  <Text style={styles.agentCity}>📍 {agent.city}</Text>
                </View>
                <Text style={styles.agentRating}>⭐ {agent.rating || 'New'}</Text>
              </View>
              <View style={styles.agentServices}>
                {agent.services?.slice(0, 3).map((s: any) => (
                  <View key={s} style={styles.serviceTagSmall}>
                    <Text style={styles.serviceTextSmall}>{s}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  onboardCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  onboardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  onboardDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  onboardBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 14 },
  onboardBtnText: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  myAgentCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  myAgentHeader: { flexDirection: 'row', alignItems: 'center' },
  myAgentName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  myAgentMeta: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusOpen: { backgroundColor: '#10B981' },
  statusClosed: { backgroundColor: '#EF4444' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  myAgentServices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  serviceTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#064e3b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  serviceText: { color: '#10B981', fontSize: 11, fontWeight: '600' },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginHorizontal: 20, marginBottom: 10 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#64748b', fontSize: 14, marginTop: 12 },
  agentCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  agentHeader: { flexDirection: 'row', alignItems: 'center' },
  agentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#064e3b', alignItems: 'center', justifyContent: 'center' },
  agentName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  agentCity: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  agentRating: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
  agentServices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  serviceTagSmall: { backgroundColor: '#064e3b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  serviceTextSmall: { color: '#10B981', fontSize: 10, fontWeight: '600' },
});
