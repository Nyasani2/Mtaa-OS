import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  MapPin,
  Navigation,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface CashpointAgent {
  id: string;
  business_name: string;
  business_address: string;
  latitude: number;
  longitude: number;
  agent_code: string;
  float_balance: number;
  status: string;
  operating_hours: string;
  services_offered: any;
  distance?: number;
}

export default function CashpointMapScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mode, setMode] = useState<'deposit' | 'withdrawal'>('withdrawal');
  const [agents, setAgents] = useState<CashpointAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyAgents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let lat = -1.2921;
      let lng = 36.8219;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false,
            });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setLocation({ lat, lng });
        } catch (locErr) {
          console.warn('Location error, using default:', locErr);
          setLocation({ lat, lng });
        }
      }

      const { data, error: fetchError } = await supabase
        .from('cashpoint_agents')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('Fetch agents error:', fetchError);
        setError(fetchError.message);
        setAgents([]);
        return;
      }

      const agentsWithDistance = (data || []).map((agent: CashpointAgent) => {
        const dLat = (agent.latitude - lat) * Math.PI / 180;
        const dLng = (agent.longitude - lng) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat * Math.PI / 180) *
            Math.cos(agent.latitude * Math.PI / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = 6371 * c;
        return { ...agent, distance };
      });

      agentsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setAgents(agentsWithDistance);
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(err.message || 'Failed to load cashpoints');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNearbyAgents();
  }, [fetchNearbyAgents]);

  const formatDistance = (km: number | undefined) => {
    if (!km) return '';
    if (km < 1) return `${(km * 1000).toFixed(0)}m away`;
    return `${km.toFixed(1)}km away`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>
              Find Cashpoint
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              {mode === 'withdrawal' ? 'Withdraw cash' : 'Deposit cash'}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#F3F4F6',
            borderRadius: 12,
            padding: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => setMode('deposit')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: mode === 'deposit' ? '#10B981' : 'transparent',
              gap: 6,
            }}
          >
            <ArrowDownCircle size={16} color={mode === 'deposit' ? '#fff' : '#6B7280'} />
            <Text
              style={{
                fontWeight: '600',
                color: mode === 'deposit' ? '#fff' : '#6B7280',
                fontSize: 13,
              }}
            >
              Deposit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('withdrawal')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: mode === 'withdrawal' ? '#10B981' : 'transparent',
              gap: 6,
            }}
          >
            <ArrowUpCircle size={16} color={mode === 'withdrawal' ? '#fff' : '#6B7280'} />
            <Text
              style={{
                fontWeight: '600',
                color: mode === 'withdrawal' ? '#fff' : '#6B7280',
                fontSize: 13,
              }}
            >
              Withdrawal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ marginTop: 16, color: '#6B7280', fontSize: 14 }}>
              Finding nearby cashpoints...
            </Text>
            {location && (
              <Text style={{ marginTop: 4, color: '#9CA3AF', fontSize: 12 }}>
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </Text>
            )}
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              Error loading cashpoints
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={fetchNearbyAgents}
              style={{
                backgroundColor: '#3B82F6',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : agents.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <MapPin size={36} color="#9CA3AF" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4 }}>
              0 cashpoints nearby
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
              {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} — ` : ''}No approved cashpoint agents found in your area.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/wallet/become-cashpoint')}
              style={{
                backgroundColor: '#10B981',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Become a Cashpoint</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
              {agents.length} cashpoint{agents.length !== 1 ? 's' : ''} nearby
            </Text>
            {agents.map((agent) => (
              <TouchableOpacity
                key={agent.id}
                onPress={() => {
                  Alert.alert(
                    agent.business_name,
                    `${agent.business_address}

Agent Code: ${agent.agent_code}
Float: KSh ${agent.float_balance?.toLocaleString() || '0'}
Hours: ${agent.operating_hours || 'N/A'}
Distance: ${formatDistance(agent.distance)}`,
                    [
                      { text: 'Close', style: 'cancel' },
                      {
                        text: mode === 'withdrawal' ? 'Withdraw' : 'Deposit',
                        onPress: () => {
                          router.push(`/wallet/cashpoint?agentId=${agent.id}&mode=${mode}`);
                        },
                      },
                    ]
                  );
                }}
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#F3F4F6',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: '#1F2937', fontSize: 15, marginBottom: 2 }}>
                      {agent.business_name}
                    </Text>
                    <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 8 }}>
                      {agent.business_address}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Navigation size={12} color="#3B82F6" />
                        <Text style={{ fontSize: 11, color: '#3B82F6' }}>
                          {formatDistance(agent.distance)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor:
                        agent.float_balance > 10000
                          ? '#ECFDF5'
                          : agent.float_balance > 0
                          ? '#FEF3C7'
                          : '#FEE2E2',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color:
                          agent.float_balance > 10000
                            ? '#059669'
                            : agent.float_balance > 0
                            ? '#D97706'
                            : '#DC2626',
                      }}
                    >
                      KSh {agent.float_balance?.toLocaleString() || '0'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
