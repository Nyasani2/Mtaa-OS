import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface FeedCardProps {
  post: any;
  isVisible: boolean;
}

export default function FeedCard({ post, isVisible }: FeedCardProps) {
  const router = useRouter();
  const creatorName = post.creator?.full_name || post.creator?.username || 'User';

  return (
    <View style={styles.container}>
      <View style={styles.mediaPlaceholder}>
        {post.media_url ? (
          <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
        ) : (
          <View style={styles.mediaFallback}>
            <Text style={styles.mediaFallbackText}>📝</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="heart" size={32} color="#fff" />
          <Text style={styles.actionText}>{post.likes_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble" size={32} color="#fff" />
          <Text style={styles.actionText}>{post.comments_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social" size={32} color="#fff" />
          <Text style={styles.actionText}>{post.shares_count || 0}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <TouchableOpacity
          style={styles.creatorRow}
          onPress={() => router.push(`/streets/profile/${post.creator_id}`)}
        >
          {post.creator?.avatar_url ? (
            <Image source={{ uri: post.creator.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {creatorName.charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.creatorName}>{creatorName}</Text>
        </TouchableOpacity>
        <Text style={styles.content} numberOfLines={3}>
          {post.content || post.title || ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: Dimensions.get('window').height,
    backgroundColor: '#000',
  },
  mediaPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  mediaFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaFallbackText: {
    fontSize: 64,
  },
  actions: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  info: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 80,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#333',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
});
