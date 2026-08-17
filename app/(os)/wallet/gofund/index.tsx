import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoFundHubScreen() {
  const router = useRouter();

  const campaigns = [
    { id: '1', title: 'Community Water Project', type: 'community', raised: 125000, target: 200000, donors: 45 },
    { id: '2', title: 'School Fees for 10 Students', type: 'education', raised: 78000, target: 150000, donors: 32 },
    { id: '3', title: 'Medical Emergency - John', type: 'emergency', raised: 45000, target: 100000, donors: 28 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GoFund</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/wallet/gofund/create-campaign')}>
          <Text style={styles.createButtonText}>+ Start Campaign</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categories}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {['All', 'Community', 'Education', 'Health', 'Emergency', 'Business'].map((cat, i) => (
            <TouchableOpacity key={cat} style={[styles.categoryPill, i === 0 && styles.categoryPillActive]}>
              <Text style={[styles.categoryText, i === 0 && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.campaignsList} showsVerticalScrollIndicator={false}>
        {campaigns.map((campaign) => (
          <TouchableOpacity key={campaign.id} style={styles.campaignCard} onPress={() => router.push(`/wallet/gofund/${campaign.id}`)}>
            <View style={styles.campaignImage}>
              <Text style={styles.campaignImagePlaceholder}>📷</Text>
            </View>
            <View style={styles.campaignContent}>
              <Text style={styles.campaignType}>{campaign.type}</Text>
              <Text style={styles.campaignTitle}>{campaign.title}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(campaign.raised / campaign.target) * 100}%` }]} />
              </View>
              <View style={styles.campaignStats}>
                <Text style={styles.campaignRaised}>KSh {campaign.raised.toLocaleString()}</Text>
                <Text style={styles.campaignDonors}>{campaign.donors} donors</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  createButton: { backgroundColor: '#00D68F', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  createButtonText: { color: '#0A0A0A', fontSize: 14, fontWeight: '600' },
  categories: { marginBottom: 16 },
  categoryScroll: { paddingHorizontal: 24 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1A1A1A', marginRight: 8 },
  categoryPillActive: { backgroundColor: '#00D68F' },
  categoryText: { color: '#888888', fontSize: 14 },
  categoryTextActive: { color: '#0A0A0A', fontWeight: '600' },
  campaignsList: { flex: 1, paddingHorizontal: 24 },
  campaignCard: { backgroundColor: '#1A1A1A', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  campaignImage: { height: 160, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  campaignImagePlaceholder: { fontSize: 48 },
  campaignContent: { padding: 16 },
  campaignType: { color: '#00D68F', fontSize: 12, textTransform: 'uppercase', fontWeight: '600', marginBottom: 8 },
  campaignTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#333333', borderRadius: 3, marginBottom: 12 },
  progressFill: { height: 6, backgroundColor: '#00D68F', borderRadius: 3 },
  campaignStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  campaignRaised: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  campaignDonors: { color: '#888888', fontSize: 14 },
});

