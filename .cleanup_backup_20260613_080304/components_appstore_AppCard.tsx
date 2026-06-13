import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

interface Props {
  app: { id: string; name: string; icon: string; category: string; rating?: number };
  installed?: boolean;
  installing?: boolean;
  onInstall?: () => void;
  onUninstall?: () => void;
  onPress?: () => void;
}

export function AppCard({ app, installed, installing, onInstall, onUninstall, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: app.icon }} style={styles.icon} />
      <View style={styles.info}>
        <Text style={styles.name}>{app.name}</Text>
        <Text style={styles.category}>{app.category}</Text>
        {app.rating && <Text style={styles.rating}>★ {app.rating}</Text>}
        {installed !== undefined && (
          <TouchableOpacity
            style={[styles.btn, installed ? styles.uninstall : styles.install]}
            onPress={(e) => { e.stopPropagation(); installed ? onUninstall?.() : onInstall?.(); }}
          >
            <Text style={styles.btnText}>{installing ? '...' : installed ? 'Uninstall' : 'Install'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 12, backgroundColor: '#1a1a1a', borderRadius: 12, marginBottom: 8 },
  icon: { width: 48, height: 48, borderRadius: 12 },
  info: { marginLeft: 12, justifyContent: 'center', flex: 1 },
  name: { color: '#fff', fontSize: 15, fontWeight: '600' },
  category: { color: '#888', fontSize: 12, marginTop: 2 },
  rating: { color: '#ffaa00', fontSize: 12, marginTop: 2 },
  btn: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start' },
  install: { backgroundColor: '#00d26a' },
  uninstall: { backgroundColor: '#333' },
  btnText: { color: '#000', fontSize: 12, fontWeight: '700' },
});

export default AppCard;
