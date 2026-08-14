import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Tribe } from '../types';

 
const DEFAULT_TRIBE_COVER = require('@/assets/images/default-tribe-cover.png');
 
const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');

interface TribeCardProps {
  tribe: Tribe;
  onPress: () => void;
}

export const TribeCard: React.FC<TribeCardProps> = ({ tribe, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Image source={{ uri: tribe.cover_url || DEFAULT_TRIBE_COVER }} style={styles.cover} />
    <View style={styles.content}>
      <Image source={{ uri: tribe.avatar_url || DEFAULT_AVATAR }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{tribe.name}</Text>
        <Text style={styles.category}>{tribe.category?.name?.toUpperCase() || 'GENERAL'}</Text>
        <Text style={styles.members}>{tribe.member_count.toLocaleString()} members</Text>
        <Text numberOfLines={2} style={styles.description}>{tribe.description}</Text>
      </View>
    </View>
    {(tribe as any).verified && (
      <View style={styles.verifiedBadge}>
        <Text style={styles.verifiedText}>✓ VERIFIED</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#1a1a2e', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  cover: { width: '100%', height: 120 },
  content: { flexDirection: 'row', padding: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#e94560', marginRight: 12 },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  category: { color: '#e94560', fontSize: 11, marginTop: 2 },
  members: { color: '#a0a0a0', fontSize: 13, marginTop: 4 },
  description: { color: '#888', fontSize: 13, marginTop: 6, lineHeight: 18 },
  verifiedBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#e94560', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  verifiedText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});
