import { useState } from 'react';
// @ts-nocheck
import React, { useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMComments } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioCommentsScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const { user } = useAuthStore();
  const { comments, load, create, remove, loading } = useMComments(videoId);
  const [newComment, setNewComment] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<string | null>(null);

  useEffect(() => {
    if (videoId) load(videoId);
  }, [videoId]);

  const handleSend = async () => {
    if (!newComment.trim() || !user?.id || !videoId) return;
    await create({
      video_id: videoId,
      user_id: user.id,
      content: newComment.trim(),
      parent_id: replyTo,
    });
    setNewComment('');
    setReplyTo(null);
    load(videoId);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    load(videoId);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0a0a0a' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ padding: 16, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Comments</Text>
        <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{comments.length} comment(s)</Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#ff0000', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{item.full_name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{item.full_name || 'Anonymous'}</Text>
                <Text style={{ color: '#666', fontSize: 11 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              {item.is_pinned && (
                <View style={{ backgroundColor: '#ff000022', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: '#ff6b6b', fontSize: 10 }}>PINNED</Text>
                </View>
              )}
            </View>
            <Text style={{ color: '#ddd', fontSize: 14, lineHeight: 20 }}>{item.content}</Text>
            <View style={{ flexDirection: 'row', marginTop: 10, gap: 16 }}>
              <TouchableOpacity onPress={() => setReplyTo(item.id)}>
                <Text style={{ color: '#888', fontSize: 12 }}>Reply</Text>
              </TouchableOpacity>
              {item.user_id === user?.id && (
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={{ color: '#ff6b6b', fontSize: 12 }}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', padding: 32 }}>No comments yet. Be the first!</Text>}
      />

      {/* Input */}
      <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#222', backgroundColor: '#111' }}>
        {replyTo && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#888', fontSize: 12 }}>Replying to comment</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)} style={{ marginLeft: 8 }}>
              <Text style={{ color: '#ff6b6b', fontSize: 12 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
            placeholderTextColor="#555"
            multiline
            style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, maxHeight: 100 }}
          />
          <TouchableOpacity onPress={handleSend} style={{ backgroundColor: '#ff0000', borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
