import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, Heart, Play, TrendingUp } from 'lucide-react-native';
import { useStreets } from '@/domains/streets/hooks/useStreets';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 48) / 3;

export default function ProfileStreetsSection() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const userId = user?.id || profile?.id;
  const { userPosts, authors, loadUserPosts, handleBoost } = useStreets();
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserPosts(userId).then(() => setLoading(false));
    }
  }, [userId, loadUserPosts]);

  if (loading) {
    return (
      <View style={{ paddingVertical: 30, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#e91e63" />
      </View>
    );
  }

  if (userPosts.length === 0) {
    return (
      <View style={{ paddingVertical: 30, alignItems: 'center' }}>
        <Text style={{ color: '#666', fontSize: 14 }}>No Streets posts yet</Text>
        <TouchableOpacity
          onPress={() => router.push('/streets/create')}
          style={{ marginTop: 10, backgroundColor: '#e91e63', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Create Post</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Streets</Text>
        <Text style={{ color: '#888', fontSize: 13 }}>{userPosts.length} posts</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 4 }}>
        {userPosts.map((post) => {
          const isVideo = post.media_type === 'video';
          const thumbnail = post.thumbnail_url || post.media_url;

          return (
            <TouchableOpacity
              key={post.id}
              onPress={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
              style={{ width: GRID_SIZE, height: GRID_SIZE, backgroundColor: '#1a1a1a', borderRadius: 8, overflow: 'hidden', position: 'relative' }}
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt=""
                  style={{ width: GRID_SIZE, height: GRID_SIZE, objectFit: 'cover' }}
                />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#666', fontSize: 11, textAlign: 'center', padding: 4 }} numberOfLines={3}>
                    {post.content || 'Post'}
                  </Text>
                </View>
              )}

              {/* Video indicator */}
              {isVideo && (
                <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, padding: 3 }}>
                  <Play size={12} color="#fff" fill="#fff" />
                </View>
              )}

              {/* Analytics overlay on select */}
              {selectedPost === post.id && (
                <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ alignItems: 'center' }}>
                      <Eye size={16} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 12, marginTop: 2 }}>{post.view_count || 0}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Heart size={16} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 12, marginTop: 2 }}>{post.likes_count || 0}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleBoost(post.id, 500, 7)}
                    style={{ marginTop: 8, backgroundColor: '#e91e63', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}
                  >
                    <TrendingUp size={12} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 11, marginLeft: 4 }}>Boost</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
