import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  FlatList, Alert, ActivityIndicator, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface UploadFile {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: string;
  title: string;
  description: string;
  category: string;
  visibility: 'public' | 'unlisted' | 'private' | 'members_only';
  tags: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  error?: string;
}

const CATEGORIES = ['Music', 'Gaming', 'Education', 'News', 'Sports', 'Comedy', 'Tech', 'Entertainment', 'Podcast', 'Other'];
const VISIBILITY_OPTIONS = [
  { key: 'public', label: 'Public', desc: 'Everyone can see' },
  { key: 'unlisted', label: 'Unlisted', desc: 'Only with link' },
  { key: 'private', label: 'Private', desc: 'Only you' },
  { key: 'members_only', label: 'Members Only', desc: 'Subscribers only' },
];

export default function UploadCenterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickFiles = async () => {
    const remainingSlots = 5 - files.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limit reached', 'You can upload up to 5 videos at a time.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets) {
      const newFiles: UploadFile[] = result.assets.map((asset, idx) => ({
        id: `upload-${Date.now()}-${idx}`,
        uri: asset.uri,
        name: asset.fileName || `video-${idx + 1}.mp4`,
        size: asset.fileSize || 0,
        type: asset.mimeType || 'video/mp4',
        title: asset.fileName?.replace(/\.[^/.]+$/, '') || `Untitled ${idx + 1}`,
        description: '',
        category: 'Other',
        visibility: 'public',
        tags: '',
        progress: 0,
        status: 'pending',
      }));

      setFiles(prev => [...prev, ...newFiles]);
      if (!activeFileId) setActiveFileId(newFiles[0].id);
    }
  };

  const updateFile = (id: string, updates: Partial<UploadFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (activeFileId === id && filtered.length > 0) setActiveFileId(filtered[0].id);
      if (filtered.length === 0) setActiveFileId(null);
      return filtered;
    });
  };

  const uploadFile = async (file: UploadFile) => {
    if (!user?.id) return;
    updateFile(file.id, { status: 'uploading', progress: 0 });

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop() || 'mp4';
      const filePath = `${user.id}/${Date.now()}-${file.id}.${fileExt}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('mstudio-videos')
        .upload(filePath, blob, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      updateFile(file.id, { progress: 60 });

      // Get public URL
      const { data: urlData } = supabase.storage.from('mstudio-videos').getPublicUrl(filePath);
      const videoUrl = urlData?.publicUrl || '';

      updateFile(file.id, { progress: 80 });

      // Insert into database
      const { error: dbError } = await supabase.from('mstudio_videos').insert({
        creator_id: user.id,
        title: file.title,
        description: file.description,
        video_url: videoUrl,
        storage_path: filePath,
        category: file.category.toLowerCase(),
        visibility: file.visibility,
        tags: file.tags.split(',').map(t => t.trim()).filter(Boolean),
        status: file.visibility === 'private' ? 'private' : 'published',
        file_size: file.size,
        mime_type: file.type,
      });

      if (dbError) throw dbError;

      updateFile(file.id, { progress: 100, status: 'done' });
    } catch (err: any) {
      updateFile(file.id, { status: 'error', error: err.message });
    }
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    for (const file of files) {
      if (file.status === 'pending' || file.status === 'error') {
        await uploadFile(file);
      }
    }

    setIsUploading(false);
    Alert.alert('Upload Complete', 'Your videos have been uploaded.', [
      { text: 'Go to Studio', onPress: () => router.push('/(os)/studio/creator-profile') },
      { text: 'Upload More', onPress: () => { setFiles([]); setActiveFileId(null); } },
    ]);
  };

  const activeFile = files.find(f => f.id === activeFileId);
  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length;
  const doneCount = files.filter(f => f.status === 'done').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      {/* Header */}
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Upload Center</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* File List */}
        {files.length > 0 && (
          <View style={{ padding: 16 }}>
            <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{files.length}/5 files • {doneCount} done • {pendingCount} pending</Text>
            <FlatList
              data={files}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setActiveFileId(item.id)}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 8,
                    marginRight: 8,
                    backgroundColor: activeFileId === item.id ? '#ff0000' : '#1a1a1a',
                    borderWidth: 2,
                    borderColor: activeFileId === item.id ? '#ff0000' : item.status === 'done' ? '#00ff00' : item.status === 'error' ? '#ff0000' : '#333',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {item.status === 'done' ? (
                    <MaterialIcons name="check-circle" size={32} color="#00ff00" />
                  ) : item.status === 'error' ? (
                    <MaterialIcons name="error" size={32} color="#ff0000" />
                  ) : item.status === 'uploading' ? (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{item.progress}%</Text>
                    </View>
                  ) : (
                    <Feather name="film" size={28} color="#666" />
                  )}
                  <TouchableOpacity
                    onPress={() => removeFile(item.id)}
                    style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Feather name="x" size={12} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Add Files Button */}
        {files.length < 5 && (
          <TouchableOpacity
            onPress={pickFiles}
            style={{ margin: 16, borderWidth: 2, borderColor: '#333', borderStyle: 'dashed', borderRadius: 12, padding: 30, alignItems: 'center', backgroundColor: '#111' }}
          >
            <Feather name="plus" size={32} color="#666" />
            <Text style={{ color: '#888', marginTop: 8, fontSize: 14 }}>Add Videos</Text>
            <Text style={{ color: '#555', marginTop: 4, fontSize: 12 }}>Up to 5 files • MP4, MOV, AVI</Text>
          </TouchableOpacity>
        )}

        {/* Metadata Form */}
        {activeFile && (
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Details: {activeFile.name}</Text>

            <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Title</Text>
            <TextInput
              value={activeFile.title}
              onChangeText={text => updateFile(activeFile.id, { title: text })}
              style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, marginBottom: 12 }}
              placeholderTextColor="#555"
            />

            <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Description</Text>
            <TextInput
              value={activeFile.description}
              onChangeText={text => updateFile(activeFile.id, { description: text })}
              multiline
              numberOfLines={3}
              style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, marginBottom: 12, textAlignVertical: 'top', minHeight: 80 }}
              placeholderTextColor="#555"
              placeholder="Tell viewers about your video..."
            />

            <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => updateFile(activeFile.id, { category: cat })}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 16,
                    backgroundColor: activeFile.category === cat ? '#ff0000' : '#1a1a1a',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12 }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Visibility</Text>
            {VISIBILITY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => updateFile(activeFile.id, { visibility: opt.key as any })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: activeFile.visibility === opt.key ? '#1a1a1a' : 'transparent',
                  borderWidth: 1,
                  borderColor: activeFile.visibility === opt.key ? '#ff0000' : '#333',
                  marginBottom: 8,
                }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: activeFile.visibility === opt.key ? '#ff0000' : '#555',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  {activeFile.visibility === opt.key && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff0000' }} />}
                </View>
                <View>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>{opt.label}</Text>
                  <Text style={{ color: '#666', fontSize: 11 }}>{opt.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, marginTop: 8 }}>Tags (comma separated)</Text>
            <TextInput
              value={activeFile.tags}
              onChangeText={text => updateFile(activeFile.id, { tags: text })}
              style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, marginBottom: 16 }}
              placeholderTextColor="#555"
              placeholder="music, tutorial, vlog..."
            />
          </View>
        )}

        {/* Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      {files.length > 0 && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#1a1a1a' }}>
          <TouchableOpacity
            onPress={startUpload}
            disabled={isUploading || pendingCount === 0}
            style={{
              backgroundColor: isUploading || pendingCount === 0 ? '#333' : '#ff0000',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="upload-cloud" size={18} color="#fff" />
            )}
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              {isUploading ? 'Uploading...' : `Upload ${pendingCount} Video${pendingCount !== 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
