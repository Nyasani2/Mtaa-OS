import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface ProfileAvatarProps {
  uri?: string | null;
  size?: number;
  verified?: boolean;
}

export function ProfileAvatar({ uri, size = 40, verified = false }: ProfileAvatarProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: uri || 'https://via.placeholder.com/100' }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
      {verified && <View style={[styles.badge, { bottom: 0, right: 0 }]}><Text style={styles.badgeText}>✓</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  image: { backgroundColor: '#E5E7EB' },
  badge: { position: 'absolute', backgroundColor: '#3B82F6', width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '700' },
});
