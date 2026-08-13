import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useMRevenue, useMMemberships, useMMerch, useMTips } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioMonetizationScreen() {
  const { user } = useAuthStore();
  const studioId = user?.id;
  const { summary, loadSummary, loading } = useMRevenue(studioId);
  const { tiers, load: loadTiers } = useMMemberships(studioId);
  const { items, load: loadMerch } = useMMerch(studioId);
  const { tips, load: loadTips } = useMTips(studioId);

  useEffect(() => {
    if (studioId) {
      loadSummary();
      loadTiers();
      loadMerch();
      loadTips();
    }
  }, [studioId]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ padding: 16, paddingTop: 48 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Monetization</Text>

        {/* Revenue Overview */}
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>TOTAL EARNINGS</Text>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>KES {summary?.total_net?.toLocaleString() || '0'}</Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
            <View>
              <Text style={{ color: '#888', fontSize: 11 }}>Gross</Text>
              <Text style={{ color: '#fff', fontSize: 14 }}>KES {summary?.total_revenue?.toLocaleString() || '0'}</Text>
            </View>
            <View>
              <Text style={{ color: '#888', fontSize: 11 }}>Platform Fee</Text>
              <Text style={{ color: '#ff6b6b', fontSize: 14 }}>KES {summary?.total_platform_fees?.toLocaleString() || '0'}</Text>
            </View>
          </View>
        </View>

        {/* Membership Tiers */}
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 10 }}>Membership Tiers</Text>
        {tiers.map((tier: any) => (
          <View key={tier.id} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{tier.name}</Text>
              <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{tier.description || 'No description'}</Text>
            </View>
            <Text style={{ color: '#00ff00', fontSize: 16, fontWeight: 'bold' }}>KES {tier.price}</Text>
          </View>
        ))}
        {tiers.length === 0 && <Text style={{ color: '#666', marginBottom: 16 }}>No membership tiers set up.</Text>}

        {/* Merch */}
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 8 }}>Merchandise</Text>
        {items.map((item: any) => (
          <View key={item.id} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>{item.inventory_count} in stock</Text>
            </View>
            <Text style={{ color: '#00ff00', fontSize: 16, fontWeight: 'bold' }}>KES {item.price}</Text>
          </View>
        ))}
        {items.length === 0 && <Text style={{ color: '#666', marginBottom: 16 }}>No merch items yet.</Text>}

        {/* Recent Tips */}
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 8 }}>Recent Tips</Text>
        {tips.slice(0, 5).map((tip: any) => (
          <View key={tip.id} style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontSize: 13 }}>{tip.sender_name || 'Anonymous'}</Text>
            <Text style={{ color: '#ff6b6b', fontWeight: '600' }}>KES {tip.amount}</Text>
          </View>
        ))}
        {tips.length === 0 && <Text style={{ color: '#666' }}>No tips yet.</Text>}
      </View>
    </ScrollView>
  );
}
