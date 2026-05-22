import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getInstalledApps } from '@/lib/apps-store/registry';
import { getLaunchRoute, getAppIcon, getAppColor } from '@/lib/apps-store/launcher';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';

export default function LauncherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [apps, setApps] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const installed = getInstalledApps();
    setApps(installed);
    setIsLoading(false);
  }, []);

  const filteredApps = apps.filter((app: any) =>
    app.name?.toLowerCase().includes(search.toLowerCase()) ||
    app.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <SafeAreaWrapper><LoadingState message="Loading apps..." /></SafeAreaWrapper>;

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <FontAwesome5 name="search" size={16} color="#94A3B8" />
          <TextInput style={styles.searchInput} placeholder="Search apps..." value={search} onChangeText={setSearch} placeholderTextColor="#94A3B8" />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><FontAwesome5 name="times-circle" size={16} color="#94A3B8" /></TouchableOpacity>}
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {filteredApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.appTile}
                onPress={() => {
                  const route = getLaunchRoute(app.id);
                  if (route) router.push(route);
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: (app.color || '#6366F1') + '20' }]}>
                  <FontAwesome5 name={getAppIcon(app.id) as any} size={24} color={app.color || '#6366F1'} />
                </View>
                <Text style={styles.appName} numberOfLines={1}>{app.name}</Text>
                <Text style={styles.appCategory}>{app.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {filteredApps.length === 0 && (
            <EmptyState title="No apps found" message={search ? `No apps matching "${search}"` : "Install apps from the AppStore"} />
          )}
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 10, color: 'white', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  appTile: { width: '30%', aspectRatio: 0.85, backgroundColor: '#1E293B', borderRadius: 16, padding: 12, alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  appName: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  appCategory: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
});
