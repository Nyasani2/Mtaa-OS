import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useAds } from '../hooks/useAds';

export default function AdsScreen() {
  const { campaigns, createCampaign, pauseCampaign, resumeCampaign } = useAds();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Promote</Text>
        <Pressable style={styles.newBtn} onPress={() => createCampaign.mutate({ name: 'New Campaign', budget: 10, target: { type: 'all' } })}>
          <Text style={styles.newText}>➕ New Campaign</Text>
        </Pressable>
      </View>

      {campaigns?.map(campaign => (
        <View key={campaign.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{campaign.name}</Text>
            <View style={[styles.status, campaign.status === 'active' && styles.activeStatus]}>
              <Text style={styles.statusText}>{campaign.status}</Text>
            </View>
          </View>
          <Text style={styles.meta}>Budget: ${campaign.budget} • Spent: ${campaign.spent}</Text>
          <Text style={styles.meta}>Reach: {campaign.reach} • Clicks: {campaign.clicks}</Text>
          <View style={styles.actions}>
            {campaign.status === 'active' ? (
              <Pressable onPress={() => pauseCampaign.mutate(campaign.id)}>
                <Text style={styles.actionText}>⏸ Pause</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => resumeCampaign.mutate(campaign.id)}>
                <Text style={styles.actionText}>▶ Resume</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  newBtn: { backgroundColor: '#E91E63', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  newText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', margin: 8, padding: 16, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  status: { backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  activeStatus: { backgroundColor: '#E8F5E9' },
  statusText: { fontSize: 12, color: '#888' },
  meta: { fontSize: 13, color: '#666', marginBottom: 4 },
  actions: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  actionText: { color: '#E91E63', fontWeight: '600' },
});
