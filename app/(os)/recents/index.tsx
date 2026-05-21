import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaWrapper } from '../../components/ui/SafeAreaWrapper';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRecentActivity } from '../../hooks/useRecentActivity';

export default function RecentsIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activities, isLoading, error, refetch } = useRecentActivity();

  if (isLoading) return <SafeAreaWrapper><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#1E40AF" /></View></SafeAreaWrapper>;

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Recents</Text>
        <Text style={styles.subtitle}>Recently used apps and activities</Text>
        {(!activities || activities.length === 0) ? (
          <EmptyState icon="history" title="No recent activity" message="Apps you use will appear here" />
        ) : (
          activities.map((activity: any) => (
            <TouchableOpacity key={activity.id} style={styles.activityItem} onPress={() => { if (activity.route) router.push(activity.route); }}>
              <View style={[styles.activityIcon, { backgroundColor: activity.color + '15' || '#F1F5F9' }]}>
                <FontAwesome5 name={activity.icon || 'circle'} size={18} color={activity.color || '#64748B'} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={14} color="#CBD5E1" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 20 },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  activityIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  activityTime: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
