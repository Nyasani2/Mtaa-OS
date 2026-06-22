import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2, Bookmark, Clock } from 'lucide-react-native';
import { StreetPostWithAuthor } from '@/lib/services/streets-service';

const { width: SCREEN_W } = Dimensions.get('window');

interface ArticleCardProps {
  post: StreetPostWithAuthor;
}

export default function ArticleCard({ post }: ArticleCardProps) {
  const router = useRouter();
  const authorName = post.creator?.display_name || 'User';
  const avatarUrl = post.creator?.avatar_url;

  const handlePress = () => {
    router.push({ pathname: '/streets/article/[id]', params: { id: post.id } });
  };

  const handleProfile = () => {
    if (!post.creator_id) return;
    router.push({ pathname: '/streets/profile/[id]', params: { id: post.creator_id } });
  };

  const wordCount = (post.content || post.caption || '').split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.9}>
      {/* Thumbnail if media exists */}
      {post.media_url && post.media_type !== 'video' && (
        <Image source={{ uri: post.media_url }} style={styles.thumbnail} resizeMode="cover" />
      )}

      <View style={styles.content}>
        {/* Author row */}
        <TouchableOpacity style={styles.authorRow} onPress={handleProfile}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>{authorName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.dot}>·</Text>
          <Clock size={12} color="#999" />
          <Text style={styles.readTime}>{readTime} min read</Text>
        </TouchableOpacity>

        {/* Title / Excerpt */}
        <Text style={styles.title} numberOfLines={2}>
          {post.caption || post.content?.substring(0, 120) || 'Untitled Article'}
        </Text>

        <Text style={styles.excerpt} numberOfLines={3}>
          {post.content || post.caption || ''}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Heart size={14} color="#999" />
            <Text style={styles.statText}>{post.likes_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <MessageCircle size={14} color="#999" />
            <Text style={styles.statText}>{post.comments_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Share2 size={14} color="#999" />
            <Text style={styles.statText}>{post.shares_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Bookmark size={14} color="#999" />
            <Text style={styles.statText}>{post.saves_count || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 14,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  avatarFallback: {
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  dot: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 6,
  },
  readTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 6,
  },
  excerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
});
