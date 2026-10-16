import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

async function uploadTribeMedia(file: any, userId: string) {
  let blobToUpload: any;
  if (Platform.OS !== 'web' && file.uri) {
    const b64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
    blobToUpload = new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0))) as any;
  } else {
    const response = await fetch(file.uri);
    blobToUpload = await response.blob();
  }
  const path = `${userId}/${Date.now()}-${file.fileName || 'media'}`;
  const { error } = await supabase.storage.from('tribe-media').upload(path, blobToUpload, { contentType: file.type || 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('tribe-media').getPublicUrl(path);
  return data.publicUrl;
}

export default function TribeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => { loadPosts(); }, [id]);

  const loadPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tribe_posts')
      .select('*, creator:user_id(full_name, avatar_url), likes:tribe_post_likes(count)')
      .eq('tribe_id', id)
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (!user?.id) return;
    const { data: existing } = await supabase.from('tribe_post_likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
    if (existing) {
      await supabase.from('tribe_post_likes').delete().eq('id', existing.id);
    } else {
      await supabase.from('tribe_post_likes').insert({ post_id: postId, user_id: user.id });
    }
    loadPosts();
  };

  const handlePost = async () => {
    if (!newPost.trim() && !selectedMedia) return;
    if (!user?.id) return;
    setPosting(true);
    try {
      let mediaUrl = null;
      if (selectedMedia) {
        mediaUrl = await uploadTribeMedia(selectedMedia, user.id);
      }
      await supabase.from('tribe_posts').insert({
        tribe_id: id,
        creator_id: user.id,
        content: newPost.trim(),
        media_url: mediaUrl,
        created_at: new Date().toISOString(),
      });
      setNewPost('');
      setSelectedMedia(null);
      loadPosts();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setPosting(false);
    }
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) setSelectedMedia(result.assets[0]);
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}><ActivityIndicator color="#fff" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' }}>Tribe Feed</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
        <TextInput placeholder="Write a post..." placeholderTextColor="#64748b" value={newPost} onChangeText={setNewPost} multiline style={{ color: '#fff', minHeight: 60 }} />
        {selectedMedia && <Text style={{ color: '#10b981', marginTop: 8 }}>Media selected: {selectedMedia.fileName}</Text>}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <TouchableOpacity onPress={pickMedia} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, backgroundColor: '#1e293b', borderRadius: 8 }}>
            <Ionicons name="image" size={18} color="#fff" /><Text style={{ color: '#fff' }}>Add Media</Text>
            </TouchableOpacity>
          <TouchableOpacity onPress={handlePost} disabled={posting} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, backgroundColor: '#3b82f6', borderRadius: 8, marginLeft: 'auto' }}>
            {posting ? <ActivityIndicator color="#fff" /> : <><Ionicons name="send" size={18} color="#fff" /><Text style={{ color: '#fff' }}>Post</Text></>}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                <Text style={{ color: '#fff' }}>{item.creator?.full_name?.[0] || '?'}</Text>
              </View>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{item.creator?.full_name || 'Unknown'}</Text>
            </View>
            <Text style={{ color: '#fff', marginBottom: 8 }}>{item.content}</Text>
            {item.media_url && <View style={{ width: '100%', height: 200, backgroundColor: '#0f172a', borderRadius: 8, marginBottom: 8, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#64748b' }}>Media Attached</Text></View>}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
              <TouchableOpacity onPress={() => handleLike(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="heart" size={18} color="#ef4444" />
                <Text style={{ color: '#fff' }}>{item.likes?.[0]?.count || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
