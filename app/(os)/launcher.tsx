import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { APP_REGISTRY, getAppById } from '@/lib/mtaa/appstore/unified-registry';

export default function LauncherScreen() {
  const router = useRouter();

  const installedApps = APP_REGISTRY.filter(app => app.isInstalled || app.isOSApp);

  const handleLaunch = (appId: string) => {
    const app = getAppById(appId);
    if (!app) {
      console.warn(`[Launcher] App "${appId}" not found`);
      return;
    }
    console.log(`[Launcher] Opening ${app.name} at ${app.route}`);
    router.push(app.route as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Launcher</Text>
      <FlatList
        data={installedApps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.appTile} 
            onPress={() => handleLaunch(item.id)}
          >
            <View style={[styles.icon, { backgroundColor: item.color }]}>
              <Text style={styles.iconText}>{item.name[0]}</Text>
            </View>
            <View style={styles.appInfo}>
              <Text style={styles.appTitle}>{item.name}</Text>
              <Text style={styles.appDesc}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0a0a0a' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#fff' },
  appTile: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#1a1a1a', 
    padding: 16, 
    marginBottom: 8, 
    borderRadius: 12 
  },
  icon: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12
  },
  iconText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  appInfo: { flex: 1 },
  appTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  appDesc: { fontSize: 12, color: '#888', marginTop: 2 }
});
