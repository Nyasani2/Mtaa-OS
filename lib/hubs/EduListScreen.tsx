// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export function makeEduList(config: any) {
  const {
    table, title, subtitle, accent = '#10b981', icon = 'school',
    columns, route, emptyText, orderBy = 'created_at', orderAsc = false, limit = 100,
    filters, canCreate = false, createRoute,
  } = config;

  return function EduListScreen() {
    const router = useRouter();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
      let q: any = supabase.from(table).select('*');
      if (filters) {
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
      }
      q = q.order(orderBy, { ascending: orderAsc }).limit(limit);
      const { data, error } = await q;
      if (!error) setRows(data || []);
    };

    useEffect(() => { (async () => { await load(); setLoading(false); })(); }, []);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    if (loading) return <View style={s.center}><ActivityIndicator size="large" color={accent} /></View>;

    return (
      <View style={s.container}>
        <View style={[s.header, { backgroundColor: accent }]}>
          <Ionicons name={icon} size={28} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{title}</Text>
            {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
          </View>
          {canCreate && (
            <TouchableOpacity style={s.addBtn} onPress={() => router.push(createRoute as any)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={rows}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={s.list}
          ListEmptyComponent={<View style={s.empty}><Ionicons name={icon} size={56} color="#cbd5e1" /><Text style={s.emptyText}>{emptyText || 'No records yet'}</Text></View>}
          keyExtractor={(r) => String(r.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.row} onPress={() => route && router.push(`${route}?id=${item.id}` as any)}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{columns.map((c: any) => item[c]).join(' · ')}</Text>
                {item.status && <Text style={s.rowMeta}>Status: {item.status}</Text>}
                <Text style={s.rowMeta}>{new Date(item.created_at || item.scheduled_at || item.date || Date.now()).toLocaleDateString()}</Text>
              </View>
              {route && <Ionicons name="chevron-forward" size={20} color="#94a3b8" />}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 52 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  rowMeta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 15, color: '#94a3b8', marginTop: 12 },
});
