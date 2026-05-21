import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKernelState } from '../hooks/useKernelState';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Card } from '../components/ui/Card';
import { SafeAreaWrapper } from '../components/ui/SafeAreaWrapper';
import { SystemHealthDashboard } from '../app/(os)/components/system/SystemHealthDashboard';

export default function SystemStatusScreen() {
  const insets = useSafeAreaInsets();
  const { status, isLoading, error, refetch } = useKernelState();

  if (isLoading) return <SafeAreaWrapper><LoadingState message="Checking system health..." /></SafeAreaWrapper>;
  if (error) return <SafeAreaWrapper><ErrorState title="System check failed" message={error.message || 'Unable to retrieve system status'} onRetry={refetch} /></SafeAreaWrapper>;

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>System Status</Text>
        <SystemHealthDashboard status={status} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {status?.services?.map((service: any) => (
            <Card key={service.id} title={service.name} subtitle={service.status} icon={service.status === 'healthy' ? 'check-circle' : 'exclamation-triangle'} iconColor={service.status === 'healthy' ? '#059669' : '#DC2626'} badge={service.status === 'healthy' ? 'UP' : 'DOWN'} badgeColor={service.status === 'healthy' ? '#059669' : '#DC2626'} />
          )) || <Card title="All systems operational" subtitle="No issues detected" icon="check-circle" iconColor="#059669" />}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 12 },
});
