import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '@/lib/civic/transport/civic_modules_v3/transport_ntsa/hooks/useVehicles';
import { useLicenses } from '@/lib/civic/transport/civic_modules_v3/transport_ntsa/hooks/useLicenses';
import { useOffences } from '@/lib/civic/transport/civic_modules_v3/transport_ntsa/hooks/useOffences';
import { TransportNav } from '@/lib/civic/transport/civic_modules_v3/transport_ntsa/components/TransportNav';
import { VehicleCard } from '@/lib/civic/transport/civic_modules_v3/transport_ntsa/components/VehicleCard';
import { LicenseCard } from '@/lib/civic/transport/civic_modules_v3/transport_ntsa/components/LicenseCard';

export default function TransportScreen() {
  const router = useRouter();
  const { vehicles, loading: vLoading } = useVehicles();
  const { licenses, loading: lLoading } = useLicenses();
  const { offences, loading: oLoading } = useOffences();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TransportNav title="NTSA Transport" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/transport/vehicles')}>
            <Ionicons name="car-outline" size={28} color="#3B82F6" />
            <Text style={styles.actionText}>Vehicles</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/transport/licenses')}>
            <Ionicons name="card-outline" size={28} color="#10B981" />
            <Text style={styles.actionText}>Licenses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/transport/offences')}>
            <Ionicons name="alert-circle-outline" size={28} color="#EF4444" />
            <Text style={styles.actionText}>Offences</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(civic)/transport/incidents')}>
            <Ionicons name="warning-outline" size={28} color="#F59E0B" />
            <Text style={styles.actionText}>Incidents</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Vehicles */}
        <Text style={styles.sectionTitle}>Recent Vehicle Registrations</Text>
        {vehicles?.slice(0, 3).map((vehicle: any) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}

        {/* Recent Licenses */}
        <Text style={styles.sectionTitle}>Recent Licenses</Text>
        {licenses?.slice(0, 3).map((license: any) => (
          <LicenseCard key={license.id} license={license} />
        ))}

        {/* Offences */}
        <Text style={styles.sectionTitle}>Recent Offences</Text>
        {offences?.slice(0, 3).map((offence: any) => (
          <View key={offence.id} style={styles.offenceCard}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.offenceTitle}>{offence.type}</Text>
              <Text style={styles.offenceDesc}>Plate: {offence.plate_number} | Fine: KES {offence.fine_amount}</Text>
            </View>
          </View>
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
  offenceCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    alignItems: 'center',
  },
  offenceTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  offenceDesc: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
});
