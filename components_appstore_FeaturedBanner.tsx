import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { AppItem } from '@/types/appstore';

interface Props {
  app?: { name: string; icon: string; tagline: string };
  apps?: AppItem[];
  onPress?: () => void;
}

export function FeaturedBanner({ app, apps, onPress }: Props) {
  const displayApp = app || (apps && apps[0] ? { name: apps[0].name, icon: apps[0].icon, tagline: apps[0].description } : null);
  if (!displayApp) return null;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: displayApp.icon }} style={styles.icon} />
      <View style={styles.info}>
        <Text style={styles.tag}>FEATURED</Text>
        <Text style={styles.name}>{displayApp.name}</Text>
        <Text style={styles.tagline}>{displayApp.tagline}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: '#1a1a1a', margin: 16, padding: 20, borderRadius: 16 },
  icon: { width: 64, height: 64, borderRadius: 16 },
  info: { marginLeft: 16, justifyContent: 'center' },
  tag: { color: '#00d26a', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  name: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 4 },
  tagline: { color: '#888', fontSize: 14, marginTop: 2 },
});

export default FeaturedBanner;
