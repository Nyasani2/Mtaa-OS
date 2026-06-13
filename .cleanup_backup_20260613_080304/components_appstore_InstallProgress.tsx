import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

interface Props {
  progress?: number;
  status?: 'downloading' | 'installing' | 'complete' | 'error';
  appName?: string;
  onClose?: () => void;
}

export function InstallProgress({ progress = 0, status = 'installing', appName, onClose }: Props) {
  const statusText = status === 'downloading' ? 'Downloading...' : status === 'installing' ? 'Installing...' : status === 'complete' ? 'Installed!' : 'Error';
  return (
    <View style={styles.container}>
      {appName && <Text style={styles.appName}>{appName}</Text>}
      <ActivityIndicator color="#00d26a" />
      <Text style={styles.status}>{statusText}</Text>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
      {onClose && (
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 24, backgroundColor: '#1a1a1a', borderRadius: 16 },
  appName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  status: { color: '#fff', marginTop: 12, fontSize: 14 },
  bar: { width: '100%', height: 4, backgroundColor: '#333', borderRadius: 2, marginTop: 12 },
  fill: { height: '100%', backgroundColor: '#00d26a', borderRadius: 2 },
  closeBtn: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 24, backgroundColor: '#333', borderRadius: 8 },
  closeText: { color: '#fff', fontSize: 14 },
});

export default InstallProgress;
