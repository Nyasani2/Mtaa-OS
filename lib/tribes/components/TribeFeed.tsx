import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { TribePost } from '../types';
import { useTribePosts } from '../hooks/useTribes';

interface TribeFeedProps {
  tribeId: string;
}

export const TribeFeed: React.FC<TribeFeedProps> = ({ tribeId }) => {
  const { posts, loading, createPost, refresh } = useTribePosts(tribeId);
  const [newPost, setNewPost] = useState('');

  const handlePost = async () => {
    if (!newPost.trim()) return;
    await createPost(newPost);
    setNewPost('');
  };

  const renderPost = ({ item }: { item: TribePost }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image source={{ uri: item.author?.avatar_url || 'https://via.placeholder.com/40' }} style={styles.authorAvatar} />
        <View>
          <Text style={styles.authorName}>{item.author?.full_name || 'Anonymous'}</Text>
          <Text style={styles.postTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        {item.is_pinned && <Text style={styles.pinnedBadge}>📌 PINNED</Text>}
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      {item.media_urls?.length > 0 && (
        <Image source={{ uri: item.media_urls[0] }} style={styles.postImage} />
      )}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>❤️ {item.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>💬 {item.comments_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>↗️ {item.shares_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.composeBox}>
        <TextInput
          style={styles.input}
          placeholder="Share something with your tribe..."
          placeholderTextColor="#666"
          value={newPost}
          onChangeText={setNewPost}
          multiline
        />
        <TouchableOpacity style={styles.postBtn} onPress={handlePost}>
          <Text style={styles.postBtnText}>Post</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={refresh}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  composeBox: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  input: { backgroundColor: '#1a1a3e', borderRadius: 12, padding: 12, color: '#fff', minHeight: 80, textAlignVertical: 'top' },
  postBtn: { backgroundColor: '#e94560', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  postBtnText: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 16 },
  postCard: { backgroundColor: '#1a1a3e', borderRadius: 12, padding: 16, marginBottom: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  authorName: { color: '#fff', fontWeight: 'bold' },
  postTime: { color: '#666', fontSize: 12 },
  pinnedBadge: { color: '#e94560', fontSize: 11, marginLeft: 'auto', fontWeight: 'bold' },
  postContent: { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  postImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#2a2a4a', paddingTop: 12 },
  actionBtn: { flex: 1, alignItems: 'center' },
  actionText: { color: '#a0a0a0' }
});
