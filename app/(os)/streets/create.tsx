import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Image as ImageIcon, Video, Plus, Trash2 } from 'lucide-react-native';
import { useStreets } from '@/lib/hooks/useStreets';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { createPost } from '@/lib/services/streets-service';

function VideoPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <video
        ref={videoRef}
        src={URL.createObjectURL(file)}
        controls
        preload="metadata"
        onLoadedMetadata={(e) => { const v = e.currentTarget; setDuration(Math.round(v.duration)); URL.revokeObjectURL(v.src); }}
        style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', borderRadius: 12, backgroundColor: '#000' }}
      />
      <button onClick={onRemove} style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 16, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Trash2 size={16} color="#fff" />
      </button>
      {duration > 0 && (
        <div style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '4px 10px' }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>{Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</Text>
        </div>
      )}
    </div>
  );
}

function ImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url] = useState(() => URL.createObjectURL(file));
  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <img src={url} alt="Preview" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 12 }} />
      <button onClick={onRemove} style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 16, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Trash2 size={16} color="#fff" />
      </button>
    </div>
  );
}

export default function CreatePostScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const {    localError } = useStreets();

  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | undefined>();
  const [localError, setLocalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = useCallback((type: 'image' | 'video') => {
    setMediaType(type);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'video' ? 'video/*' : 'image/*';
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setLocalError('File too large. Max 50MB.'); return; }

    if (mediaType === 'video' && file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > 300) { setLocalError('Video must be 5 minutes or less.'); setSelectedFile(null); }
        else { setSelectedFile(file); setLocalError(null); }
      };
    } else {
      setSelectedFile(file);
      setLocalError(null);
    }
    e.target.value = '';
  }, [mediaType]);

  const addHashtag = useCallback(() => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) { setHashtags((prev) => [...prev, tag]); setHashtagInput(''); }
  }, [hashtagInput, hashtags]);

  const removeHashtag = useCallback((tag: string) => { setHashtags((prev) => prev.filter((t) => t !== tag)); }, []);

  const handlePost = useCallback(async () => {
    setLocalError(null);
    if (!content.trim() && !selectedFile) { setLocalError('Please add text or select media.'); return; }

    if (!user?.id) { setLocalError('You must be logged in to post.'); return; }
    setIsPosting(true);
    try {
      const result = await createPost({
      creatorId: user.id,
      content: content.trim(),
      caption: caption.trim() || undefined,
      mediaUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
      mediaType,
      hashtags,
      isPublic });

    if (result) router.back();
    } catch (e: any) { setLocalError(e.message || 'Failed to create post'); }
    finally { setIsPosting(false); }
  }, [content, caption, selectedFile, mediaType, hashtags, isPublic,  router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#0a0a0a' }}>
        <TouchableOpacity onPress={() => router.back()}><X size={24} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>New Post</Text>
        <TouchableOpacity onPress={handlePost} disabled= style={{ backgroundColor:  ? '#666' : '#e91e63', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 }}>
          { ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Post</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        {(localError || localError) && (
          <View style={{ backgroundColor: '#3a1a1a', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <Text style={{ color: '#ff6b6b', fontSize: 13 }}>{localError || localError}</Text>
          </View>
        )}

        {!selectedFile && (
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity onPress={() => pickFile('image')} style={{ flex: 1, aspectRatio: 1, backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={32} color="#e91e63" />
              <Text style={{ color: '#fff', marginTop: 8, fontSize: 13 }}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickFile('video')} style={{ flex: 1, aspectRatio: 1, backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={32} color="#e91e63" />
              <Text style={{ color: '#fff', marginTop: 8, fontSize: 13 }}>Video</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedFile && mediaType === 'video' && <VideoPreview file={selectedFile} onRemove={() => { setSelectedFile(null); setMediaType(undefined); }} />}
        {selectedFile && mediaType === 'image' && <ImagePreview file={selectedFile} onRemove={() => { setSelectedFile(null); setMediaType(undefined); }} />}

        { &&  > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={{ height: 4, backgroundColor: '#333', borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ height: 4, backgroundColor: '#e91e63', borderRadius: 2, width: `$%` }} />
            </View>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 4, textAlign: 'center' }}>{ < 100 ? 'Uploading...' : 'Processing...'}</Text>
          </View>
        )}

        <TextInput value={content} onChangeText={setContent} placeholder="What's on your mind?" placeholderTextColor="#666" multiline maxLength={500} style={{ color: '#fff', fontSize: 15, minHeight: 80, textAlignVertical: 'top', marginBottom: 8 }} />
        <Text style={{ color: '#666', fontSize: 12, textAlign: 'right', marginBottom: 16 }}>{content.length}/500</Text>

        <TextInput value={caption} onChangeText={setCaption} placeholder="Add a caption (optional)" placeholderTextColor="#666" style={{ color: '#fff', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 10, marginBottom: 16 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TextInput value={hashtagInput} onChangeText={setHashtagInput} placeholder="Add hashtag" placeholderTextColor="#666" onSubmitEditing={addHashtag} style={{ flex: 1, color: '#fff', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 10 }} />
          <TouchableOpacity onPress={addHashtag} style={{ marginLeft: 8, padding: 8 }}><Plus size={20} color="#e91e63" /></TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {hashtags.map((tag) => (
            <View key={tag} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e91e63', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: '#fff', fontSize: 13 }}>#{tag}</Text>
              <TouchableOpacity onPress={() => removeHashtag(tag)} style={{ marginLeft: 6 }}><X size={14} color="#fff" /></TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>Public</Text>
          <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: '#333', true: '#e91e63' }} thumbColor="#fff" />
        </View>
      </ScrollView>
    </View>
  );
}
