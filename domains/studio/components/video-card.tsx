import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail_url?: string;
  video_url?: string;
  creator_name?: string;
  creator_avatar?: string;
  view_count?: number;
  duration_seconds?: number;
  created_at?: string;
  size?: 'compact' | 'medium' | 'large';
  is_streets?: boolean;
}

export default function VideoCard({
  id,
  title,
  thumbnail_url,
  creator_name,
  view_count = 0,
  size = 'medium',
  is_streets = false,
}: VideoCardProps) {
  const router = useRouter();

  const handleShare = async () => {
    try {
      const shareUrl = Platform.OS === 'web' 
        ? `${window.location.origin}/studio/watch/${id}`
        : `mtaaos://studio/watch/${id}`; // Deep link for mobile

      await Share.share({
        message: `Check out "${title}" by ${creator_name || 'Unknown'} on MTAA OS!`,
        url: shareUrl,
        title: title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const cardHeight = size === 'compact' ? 220 : size === 'large' ? 320 : 260;

  return (
    <TouchableOpacity
      style={[styles.card, { height: cardHeight }]}
      onPress={() => router.push(`/(os)/studio/watch/${id}` as any)}
    >
      <Image
        source={{ uri: thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Thumbnail' }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.meta}>
          <Text style={styles.creator}>{creator_name || 'Unknown'}</Text>
          <Text style={styles.views}>{view_count.toLocaleString()} views</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
        <Ionicons name="share-social" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', backgroundColor: '#1a1a1a', borderRadius: 12, overflow: 'hidden', marginBottom: 12, position: 'relative' },
  thumbnail: { width: '100%', height: '70%' },
  info: { padding: 10, flex: 1 },
  title: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  creator: { color: '#888', fontSize: 11 },
  views: { color: '#666', fontSize: 11 },
  shareBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 6 },
});
