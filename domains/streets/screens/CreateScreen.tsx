// @ts-nocheck
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Switch, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Image as ImageIcon, Video, Camera } from 'lucide-react-native';
import { uploadMedia, createPost } from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import * as ImageManipulator from 'expo-image-manipulator';

const FILTERS = [
  { id: 'normal', label: 'Normal', actions: [] },
  { id: 'vivid', label: 'Vivid', actions: [{ saturate: 1.5 }, { contrast: 1.1 }] },
  { id: 'warm', label: 'Warm', actions: [{ sepia: 0.35 }, { saturate: 1.3 }] },
  { id: 'cool', label: 'Cool', actions: [{ hue: 15 }, { saturate: 1.2 }] },
  { id: 'bw', label: 'B&W', actions: [{ grayscale: 1 }] },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [mediaType, setMediaType] = useState('image');
  const [filter, setFilter] = useState(FILTERS[0]);
  const [posting, setPosting] = useState(false);
  const [processingFilter, setProcessingFilter] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const applyFilterMobile = async (file: any, filterActions: any[]) => {
    if (Platform.OS === 'web' || filterActions.length === 0) return file.uri;
    setProcessingFilter(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        file.uri,
        filterActions,
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setProcessingFilter(false);
      return manipulated.uri;
    } catch (e) {
      setProcessingFilter(false);
      return file.uri;
    }
  };

  const pick = async (type: string) => {
    // Note: In a full implementation, use expo-image-picker here
    // For now, this is a placeholder for the mobile picker logic
    console.log('Pick', type);
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedFile) return;
    if (!user?.id) return;
    
    setPosting(true);
    router.back(); // Return to feed immediately
    
    (async () => {
      try {
        let finalUri = selectedFile?.uri;
        // Apply filter on mobile before upload
        if (Platform.OS !== 'web' && mediaType === 'image' && selectedFile) {
          finalUri = await applyFilterMobile(selectedFile, filter.actions);
        }

        let mediaUrl, thumbnailUrl;
        if (finalUri) {
          // Create a mock file object for upload if on mobile
          const fileToUpload = Platform.OS === 'web' ? selectedFile : { uri: finalUri, name: 'post.jpg', type: 'image/jpeg' };
          const up = await uploadMedia(fileToUpload, user.id, () => {});
          mediaUrl = up.url;
          thumbnailUrl = up.thumbnailUrl;
        }
        
        await createPost({ 
          creatorId: user.id, 
          content: content.trim(), 
          mediaUrl, 
          thumbnailUrl, 
          mediaType, 
          isPublic: true 
        });
      } catch (e) { 
        console.error('[Create] background upload failed:', e); 
      }
    })();
  };

  // Web CSS filter string for preview
  const webFilterCss = filter.actions.length > 0 
    ? filter.actions.map((a: any) => {
        const key = Object.keys(a)[0];
        const val = a[key];
        return key === 'grayscale' ? `grayscale(${val})` : `${key}(${val})`;
      }).join(' ')
    : 'none';

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()}><X size={24} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>New Post</Text>
        <TouchableOpacity onPress={handlePost} disabled={posting || processingFilter} style={{ backgroundColor: (posting || processingFilter) ? '#666' : '#e91e63', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 }}>
          {posting || processingFilter ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Post</Text>}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        {selectedFile ? (
          <View style={{ marginBottom: 12 }}>
            {Platform.OS === 'web' ? (
              <img src={selectedFile.uri} alt="" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 12, filter: webFilterCss }} />
            ) : (
              <Image source={{ uri: selectedFile.uri }} style={{ width: '100%', height: 420, borderRadius: 12 }} resizeMode="cover" />
            )}
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {FILTERS.map((f) => (
                <TouchableOpacity key={f.id} onPress={() => setFilter(f)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: filter.id === f.id ? '#e91e63' : '#2a2a2a', marginRight: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 12 }}>{f.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => { setSelectedFile(null); setFilter(FILTERS[0]); }} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#2a2a2a' }}>
                <Text style={{ color: '#ff6b6b', fontSize: 12 }}>Remove</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <TouchableOpacity onPress={() => pick('image')} style={{ flex: 1, height: 160, backgroundColor: '#1a1a1a', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a2a' }}>
              <ImageIcon size={28} color="#e91e63" /><Text style={{ color: '#aaa', fontSize: 13, marginTop: 6 }}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pick('video')} style={{ flex: 1, height: 160, backgroundColor: '#1a1a1a', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a2a' }}>
              <Video size={28} color="#e91e63" /><Text style={{ color: '#aaa', fontSize: 13, marginTop: 6 }}>Video</Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput value={content} onChangeText={setContent} placeholder="What's on your mind?" placeholderTextColor="#666" multiline style={{ color: '#fff', fontSize: 15, minHeight: 80, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12 }} />
      </ScrollView>
    </View>
  );
}
