import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

interface AgentLocation {
  id: string;
  business_name: string;
  agent_type: string;
  location_lat: number;
  location_lng: number;
  float_balance: number;
}

export default function AgentMapScreen() {
  const [agents, setAgents] = useState<AgentLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agents')
      .select('id, business_name, agent_type, location_lat, location_lng, float_balance')
      .eq('status', 'active')
      .order('float_balance', { ascending: false });
    setAgents(data || []);
    setLoading(false);
  };

  const filtered = agents.filter(a =>
    a.business_name.toLowerCase().includes(search.toLowerCase()) ||
    a.agent_type.toLowerCase().includes(search.toLowerCase())
  );

  const typeEmoji = (t: string) => t === 'kiosk' ? '🏪' : t === 'mobile' ? '🛵' : '🏢';

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ padding: 16, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Find an Agent</Text>
        <TextInput
          placeholder="Search by name or type..."
          value={search}
          onChangeText={setSearch}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15 }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={{
            backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10,
            flexDirection: 'row', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 32, marginRight: 14 }}>{typeEmoji(item.agent_type)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600' }}>{item.business_name}</Text>
              <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.agent_type}</Text>
              <Text style={{ fontSize: 12, color: '#007AFF', marginTop: 4 }}>
                Float: KES {item.float_balance?.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity style={{
              backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Transact</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No agents found nearby</Text>
        }
      />
    </View>
  );
}
