import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAgriculture } from '@/lib/civic/agriculture/civic_modules_v3/agriculture_kephis/controllers/useAgriculture';
import { SeedLicenseCard } from '@/lib/civic/agriculture/civic_modules_v3/agriculture_kephis/components/SeedLicenseCard';
import { CertificateCard } from '@/lib/civic/agriculture/civic_modules_v3/agriculture_kephis/components/CertificateCard';
import { MarketPriceCard } from '@/lib/civic/agriculture/civic_modules_v3/agriculture_kephis/components/MarketPriceCard';
import { AgricultureNav } from '@/lib/civic/agriculture/civic_modules_v3/agriculture_kephis/components/AgricultureNav';

export default function AgricultureScreen() {
  const router = useRouter();
  const { licenses, certificates, marketPrices, loading } = useAgriculture();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AgricultureNav title="KEPHIS Agriculture" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/agriculture/licenses' as any)}>
            <Ionicons name="leaf-outline" size={28} color="#10B981" />
            <Text style={styles.actionText}>Seed Licenses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/agriculture/certificates' as any)}>
            <Ionicons name="document-text-outline" size={28} color="#3B82F6" />
            <Text style={styles.actionText}>Certificates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/agriculture/pest-reports' as any)}>
            <Ionicons name="bug-outline" size={28} color="#EF4444" />
            <Text style={styles.actionText}>Pest Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/agriculture/prices' as any)}>
            <Ionicons name="trending-up-outline" size={28} color="#F59E0B" />
            <Text style={styles.actionText}>Market Prices</Text>
          </TouchableOpacity>
        </View>

        {/* Seed Licenses */}
        <Text style={styles.sectionTitle}>Recent Seed Licenses</Text>
        {licenses?.slice(0, 3).map((license: any) => (
          <SeedLicenseCard key={license.id} license={license} />
        ))}

        {/* Market Prices */}
        <Text style={styles.sectionTitle}>Market Prices</Text>
        {marketPrices?.slice(0, 3).map((price: any) => (
          <MarketPriceCard key={price.id} price={price} />
        ))}

        {/* Certificates */}
        <Text style={styles.sectionTitle}>Phytosanitary Certificates</Text>
        {certificates?.slice(0, 3).map((cert: any) => (
          <CertificateCard key={cert.id} certificate={cert} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 16 },
  actionCard: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  actionText: { color: '#fff', marginTop: 8, fontSize: 13, fontWeight: '600' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 12 },
});
