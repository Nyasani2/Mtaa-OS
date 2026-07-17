import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useMRevenue } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const { width } = Dimensions.get('window');

export default function StudioAnalyticsScreen() {
  const { user } = useAuthStore();
  const studioId = user?.id; // In production, get actual studio ID
  const { timeseries, loadTimeseries, loading } = useMRevenue(studioId);
  const [range, setRange] = useState(7);

  useEffect(() => {
    if (studioId) loadTimeseries(undefined, range);
  }, [studioId, range]);

  const totalViews = timeseries.reduce((sum, d) => sum + (d.views || 0), 0);
  const totalRevenue = timeseries.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const avgCtr = timeseries.length > 0 ? timeseries.reduce((sum, d) => sum + (d.ctr || 0), 0) / timeseries.length : 0;

  const maxValue = Math.max(...timeseries.map(d => d.views || 0), 1);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ padding: 16, paddingTop: 48 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Analytics</Text>

        {/* Range Selector */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {[7, 30, 90].map(days => (
            <TouchableOpacity key={days} onPress={() => setRange(days)} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: range === days ? '#ff0000' : '#1a1a1a', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{days}D</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <SummaryCard label="Views" value={totalViews.toLocaleString()} />
          <SummaryCard label="Revenue" value={`KES ${totalRevenue.toLocaleString()}`} />
          <SummaryCard label="CTR" value={`${avgCtr.toFixed(1)}%`} />
        </View>

        {/* Bar Chart */}
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>Views Over Time</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 4 }}>
            {timeseries.map((point, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <View style={{
                  width: '80%',
                  height: `${((point.views || 0) / maxValue) * 100}%`,
                  backgroundColor: '#ff0000',
                  borderRadius: 4,
                  minHeight: 4,
                }} />
                <Text style={{ color: '#666', fontSize: 9, marginTop: 4 }}>{point.date?.slice(5)}</Text>
              </View>
            ))}
          </View>
          {timeseries.length === 0 && (
            <Text style={{ color: '#666', textAlign: 'center', padding: 20 }}>No data yet. Publish content to see analytics.</Text>
          )}
        </View>

        {/* Data Table */}
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>Detailed Breakdown</Text>
          {timeseries.slice().reverse().map((point, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' }}>
              <Text style={{ color: '#888', fontSize: 12 }}>{point.date}</Text>
              <Text style={{ color: '#fff', fontSize: 12 }}>{point.views?.toLocaleString()} views</Text>
              <Text style={{ color: '#00ff00', fontSize: 12 }}>KES {point.revenue?.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{value}</Text>
      <Text style={{ color: '#888', fontSize: 10, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
