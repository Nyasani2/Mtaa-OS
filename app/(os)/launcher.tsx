import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const LAUNCHER_APPS = [
  { id: 'wallet', title: 'Wallet', route: '/wallet' },
  { id: 'shop', title: 'Shop', route: '/shop' },
  { id: 'mtaxi', title: 'MTaxi', route: '/mtaxi' },
  { id: 'health', title: 'Health', route: '/health' },
  { id: 'settings', title: 'Settings', route: '/settings' },
];

export default function LauncherScreen() {
  const router = useRouter();

  const handleLaunch = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Launcher</Text>
      <FlatList
        data={LAUNCHER_APPS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.appTile} onPress={() => handleLaunch(item.route)}>
            <Text style={styles.appTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  appTile: { backgroundColor: '#f5f5f5', padding: 16, marginBottom: 8, borderRadius: 8, alignItems: 'center' },
  appTitle: { fontSize: 16, fontWeight: '600' }
});
