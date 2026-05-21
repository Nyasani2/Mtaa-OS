import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInstalledApps } from '../hooks/useInstalledApps';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { SafeAreaWrapper } from '../components/ui/SafeAreaWrapper';

export default function LauncherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { apps, isLoading, error, refetch } = useInstalledApps();
  const [search, setSearch] = React.useState('');
  const filteredApps = apps?.filter((app: any) => app.name?.toLowerCase().includes(search.toLowerCase()) || app.category?.toLowerCase().includes(search.toLowerCase())) || [];

  if (isLoading) return <SafeAreaWrapper><LoadingState message="Loading apps..." /></SafeAreaWrapper>;
  if (error) return <SafeAreaWrapper><ErrorState title="Apps unavailable" message={error.message || 'Failed to load installed apps'} onRetry={refetch} /></SafeAreaWrapper>;

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <FontAwesome5 name="search" size={16} color="#94A3B8" />
          <TextInput style={styles.searchInput} placeholder="Search apps..." value={search} onChangeText={setSearch} placeholderTextColor="#94A3B8" />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><FontAwesome5 name="times-circle" size={16} color="#94A3B8" /></TouchableOpacity>}
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
          {filteredApps.length === 0 ? (
            <EmptyState icon="th-large" title={search ? 'No apps found' : 'No apps installed'} message={search ? 'Try a different search term' : 'Visit the AppStore to install apps'} actionLabel={!search ? 'Open AppStore' : undefined} onAction={!search ? () => router.push('/(os)/appstore') : undefined} />
          ) : (
            <View style={styles.appsGrid}>
              {filteredApps.map((app: any) => (
                <TouchableOpacity key={app.id} style={styles.appCard} onPress={() => router.push(app.route as any)}>
                  <View style={[styles.appIcon, { backgroundColor: (app.color || '#64748B') + '15' }]}>
                    <FontAwesome5 name={app.icon || 'app'} size={24} color={app.color || '#64748B'} />
                  </View>
                  <Text style={styles.appName} numberOfLines={1}>{app.name}</Text>
                  <Text style={styles.appCategory}>{app.category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, color: '#334155' },
  appsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  appCard: { width: '30%', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  appIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  appName: { fontSize: 13, fontWeight: '600', color: '#334155', textAlign: 'center' },
  appCategory: { fontSize: 10, color: '#94A3B8', marginTop: 2, textTransform: 'uppercase' },
});
