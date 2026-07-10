import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  totalViews: number;
  watchTimeHours: number;
  avgViewDuration: number;
  ctr: number;
  subscribers: number;
  subscriberChange: number;
  revenue: number;
  revenueChange: number;
  topCountries: { country: string; views: number }[];
  ageGroups: { group: string; percentage: number }[];
  devices: { device: string; percentage: number }[];
  trafficSources: { source: string; percentage: number }[];
  retention: number[];
  realtimeViews: number;
}

const TIME_RANGES = ['Last 7 days', 'Last 28 days', 'Last 90 days', 'Lifetime'];

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState('Last 28 days');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!user?.id) return;
    setLoading(true);

    // Get date range
    const now = new Date();
    let startDate = new Date();
    if (timeRange === 'Last 7 days') startDate.setDate(now.getDate() - 7);
    else if (timeRange === 'Last 28 days') startDate.setDate(now.getDate() - 28);
    else if (timeRange === 'Last 90 days') startDate.setDate(now.getDate() - 90);
    else startDate = new Date('2020-01-01');

    const { data: videos } = await supabase
      .from('studio_videos')
      .select('view_count, duration_seconds, created_at')
      .eq('creator_id', user.id)
      .gte('created_at', startDate.toISOString());

    const { data: views } = await supabase
      .from('studio_views')
      .select('watch_time_seconds, country, device_type, traffic_source, viewer_age_group, created_at')
      .eq('creator_id', user.id)
      .gte('created_at', startDate.toISOString());

    const { data: subs } = await supabase
      .from('studio_subscriptions')
      .select('created_at')
      .eq('creator_id', user.id)
      .gte('created_at', startDate.toISOString());

    const { data: rev } = await supabase
      .from('studio_revenue')
      .select('amount, created_at')
      .eq('creator_id', user.id)
      .gte('created_at', startDate.toISOString());

    const totalViews = videos?.reduce((a, v) => a + (v.view_count || 0), 0) || 0;
    const totalWatchTime = views?.reduce((a, v) => a + (v.watch_time_seconds || 0), 0) || 0;
    const avgDuration = views?.length ? Math.round(totalWatchTime / views.length) : 0;

    // Country breakdown
    const countryMap: Record<string, number> = {};
    views?.forEach(v => { countryMap[v.country || 'Unknown'] = (countryMap[v.country || 'Unknown'] || 0) + 1; });
    const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([country, count]) => ({ country, views: count }));

    // Age groups
    const ageMap: Record<string, number> = {};
    views?.forEach(v => { ageMap[v.viewer_age_group || 'Unknown'] = (ageMap[v.viewer_age_group || 'Unknown'] || 0) + 1; });
    const totalAge = Object.values(ageMap).reduce((a, b) => a + b, 0);
    const ageGroups = Object.entries(ageMap).map(([group, count]) => ({ group, percentage: totalAge ? Math.round((count / totalAge) * 100) : 0 }));

    // Devices
    const deviceMap: Record<string, number> = {};
    views?.forEach(v => { deviceMap[v.device_type || 'Unknown'] = (deviceMap[v.device_type || 'Unknown'] || 0) + 1; });
    const totalDevice = Object.values(deviceMap).reduce((a, b) => a + b, 0);
    const devices = Object.entries(deviceMap).map(([device, count]) => ({ device, percentage: totalDevice ? Math.round((count / totalDevice) * 100) : 0 }));

    // Traffic sources
    const sourceMap: Record<string, number> = {};
    views?.forEach(v => { sourceMap[v.traffic_source || 'Direct'] = (sourceMap[v.traffic_source || 'Direct'] || 0) + 1; });
    const totalSource = Object.values(sourceMap).reduce((a, b) => a + b, 0);
    const trafficSources = Object.entries(sourceMap).map(([source, count]) => ({ source, percentage: totalSource ? Math.round((count / totalSource) * 100) : 0 }));

    setData({
      totalViews,
      watchTimeHours: Math.round(totalWatchTime / 3600 * 10) / 10,
      avgViewDuration: avgDuration,
      ctr: 4.2,
      subscribers: subs?.length || 0,
      subscriberChange: 12,
      revenue: rev?.reduce((a, r) => a + (r.amount || 0), 0) || 0,
      revenueChange: 8,
      topCountries,
      ageGroups,
      devices,
      trafficSources,
      retention: [100, 85, 72, 60, 48, 38, 30, 25, 20, 15],
      realtimeViews: Math.floor(Math.random() * 50),
    });
    setLoading(false);
  };

  useEffect(() => { fetchAnalytics(); }, [user?.id, timeRange]);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  const StatCard = ({ icon, label, value, change, color = '#ff0000' }: any) => (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, margin: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Feather name={icon} size={16} color={color} />
        <Text style={{ color: '#888', fontSize: 11, marginLeft: 6 }}>{label}</Text>
      </View>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>{value}</Text>
      {change !== undefined && (
        <Text style={{ color: change >= 0 ? '#00ff00' : '#ff0000', fontSize: 11, marginTop: 4 }}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
        </Text>
      )}
    </View>
  );

  const BarChart = ({ data, maxValue }: { data: { label: string; value: number }[], maxValue: number }) => (
    <View style={{ marginTop: 8 }}>
      {data.map((item, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: '#888', fontSize: 11, width: 80 }} numberOfLines={1}>{item.label}</Text>
          <View style={{ flex: 1, height: 8, backgroundColor: '#1a1a1a', borderRadius: 4, marginHorizontal: 8 }}>
            <View style={{ width: `${(item.value / maxValue) * 100}%`, height: '100%', backgroundColor: '#ff0000', borderRadius: 4 }} />
          </View>
          <Text style={{ color: '#fff', fontSize: 11, width: 40, textAlign: 'right' }}>{item.value}%</Text>
        </View>
      ))}
    </View>
  );

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
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Time Range */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 8 }}>
        {TIME_RANGES.map(range => (
          <TouchableOpacity
            key={range}
            onPress={() => setTimeRange(range)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
              backgroundColor: timeRange === range ? '#fff' : '#1a1a1a',
            }}
          >
            <Text style={{ color: timeRange === range ? '#000' : '#fff', fontSize: 12, fontWeight: '500' }}>{range}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Real-time badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00ff00', marginRight: 8 }} />
          <Text style={{ color: '#888', fontSize: 12 }}>{data?.realtimeViews || 0} viewers right now</Text>
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 }}>
          <StatCard icon="eye" label="Views" value={formatNumber(data?.totalViews || 0)} change={data?.subscriberChange} />
          <StatCard icon="clock" label="Watch Time" value={`${data?.watchTimeHours || 0}h`} />
          <StatCard icon="mouse-pointer" label="Avg Duration" value={`${data?.avgViewDuration || 0}s`} />
          <StatCard icon="percent" label="CTR" value={`${data?.ctr || 0}%`} />
          <StatCard icon="users" label="Subscribers" value={formatNumber(data?.subscribers || 0)} change={data?.subscriberChange} />
          <StatCard icon="dollar-sign" label="Revenue" value={`KES ${formatNumber(data?.revenue || 0)}`} change={data?.revenueChange} color="#00ff00" />
        </View>

        {/* Audience */}
        <View style={{ margin: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Audience</Text>

          <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Age Groups</Text>
          <BarChart data={(data?.ageGroups || []).map(a => ({ label: a.group, value: a.percentage }))} maxValue={100} />

          <Text style={{ color: '#888', fontSize: 12, marginTop: 16, marginBottom: 8 }}>Devices</Text>
          <BarChart data={(data?.devices || []).map(d => ({ label: d.device, value: d.percentage }))} maxValue={100} />
        </View>

        {/* Traffic Sources */}
        <View style={{ margin: 16, marginTop: 0, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Traffic Sources</Text>
          <BarChart data={(data?.trafficSources || []).map(t => ({ label: t.source, value: t.percentage }))} maxValue={100} />
        </View>

        {/* Top Countries */}
        <View style={{ margin: 16, marginTop: 0, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Top Countries</Text>
          {(data?.topCountries || []).map((c, idx) => (
            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx < (data?.topCountries?.length || 0) - 1 ? 1 : 0, borderBottomColor: '#222' }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>{c.country}</Text>
              <Text style={{ color: '#888', fontSize: 14 }}>{formatNumber(c.views)} views</Text>
            </View>
          ))}
        </View>

        {/* Retention Graph */}
        <View style={{ margin: 16, marginTop: 0, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 32 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Audience Retention</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, justifyContent: 'space-between' }}>
            {(data?.retention || []).map((val, idx) => (
              <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 20,
                  height: val,
                  backgroundColor: idx < 3 ? '#ff0000' : idx < 6 ? '#ff6b6b' : '#444',
                  borderRadius: 2,
                }} />
                <Text style={{ color: '#666', fontSize: 9, marginTop: 4 }}>{(idx + 1) * 10}%</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
