import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const MOCK_APPS = [
  { id: '1', name: 'MTaxi', description: 'Ride hailing', color: '#2196f3', installed: false },
  { id: '2', name: 'MTruck', description: 'Logistics', color: '#4caf50', installed: false },
  { id: '3', name: 'Shop', description: 'E-commerce', color: '#ff9800', installed: true },
  { id: '4', name: 'Health', description: 'Medical records', color: '#f44336', installed: true },
];

const MOCK_CATEGORIES = [
  { id: 'transport', name: 'Transport', apps: ['1', '2'] },
  { id: 'commerce', name: 'Commerce', apps: ['3'] },
  { id: 'health', name: 'Health', apps: ['4'] },
];

export default function AppStoreScreen() {
  const router = useRouter();

  const handleInstall = (appId: string) => {
    console.log('Install', appId);
  };

  const handleLaunch = (appId: string) => {
    const routes: Record<string, string> = {
      '1': '/mtaxi',
      '2': '/mtruck',
      '3': '/shop',
      '4': '/health'
    };
    const route = routes[appId];
    if (route) router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Store</Text>
      <Text style={styles.section}>Featured</Text>
      <FlatList
        data={MOCK_APPS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 4 }]} onPress={() => handleLaunch(item.id)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            {!item.installed && (
              <TouchableOpacity style={styles.installBtn} onPress={() => handleInstall(item.id)}>
                <Text style={styles.installText}>Install</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
      />
      <Text style={styles.section}>Categories</Text>
      <FlatList
        data={MOCK_CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.category}>
            <Text style={styles.catName}>{item.name}</Text>
            <Text>{item.apps.length} apps</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  name: { fontWeight: '600', fontSize: 16 },
  desc: { fontSize: 12, color: '#666', marginTop: 4 },
  installBtn: { backgroundColor: '#2196f3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start', marginTop: 8 },
  installText: { color: '#fff', fontSize: 12 },
  category: { backgroundColor: '#f5f5f5', padding: 12, marginBottom: 8, borderRadius: 8 },
  catName: { fontWeight: '600' }
});
