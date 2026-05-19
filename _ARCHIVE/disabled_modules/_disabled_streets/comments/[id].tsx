import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, Alert, TextInput, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string;
}

export default function CommentsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [post, setPost] = useState<any>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchPostAndComments();
  }, [id]);

  const fetchPostAndComments = async () => {
    if (!id) return;
    setLoading(true);

    const { data: postData } = await supabase
      .from('streets_posts')
      .select('*, author:profiles(full_name, avatar_url)')
      .eq('id', id)
      .single();

    setPost(postData);

    const { data, error } = await supabase
      .from('streets_comments')
      .select('*, author:profiles(full_name, avatar_url)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    if (data) {
      setComments(data.map((c: any) => ({
        id: c.id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        author_name: c.author?.full_name || 'Unknown',
        author_avatar: c.author?.avatar_url || '',
      })));
    }
  };

  const handleSend = async () => {
    if (!newComment.trim() || !user?.id || !id) return;

    setSending(true);
    const { error } = await supabase
      .from('streets_comments')
      .insert({
        post_id: id as string,
        user_id: user.id,
        content: newComment.trim(),
        created_at: new Date().toISOString(),
      });

    setSending(false);
    setNewComment('');

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      fetchPostAndComments();
    }
  };

  const renderItem = ({ item }: { item: Comment }) => (
    <View style={styles.commentRow}>
      {item.author_avatar ? (
        <Image source={{ uri: item.author_avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      )}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.authorName}>{item.author_name}</Text>
          <Text style={styles.commentTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {post && (
        <View style={styles.postPreview}>
          <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={comments}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySub}>Be the first to comment</Text>
            </View>
          }
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#888"
          value={newComment}
          onChange={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, (!newComment.trim() || sending) && styles.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={!newComment.trim() || sending}
        >
          <Text style={styles.sendText}>{sending ? '...' : '➤'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  postPreview: {
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  postContent: { color: '#aaa', fontSize: 14 },
  list: { padding: 16, paddingBottom: 100 },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 14 },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  authorName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  commentTime: { color: '#666', fontSize: 11 },
  commentText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#666', fontSize: 16 },
  emptySub: { color: '#444', fontSize: 12, marginTop: 8 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 10,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: '#fff', fontSize: 16 },
  backButton: { padding: 16, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
