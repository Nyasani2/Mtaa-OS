// @ts-nocheck
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Switch, ActivityIndicator, Platform, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Image as ImageIcon, Video, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia, createPost } from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { stripExifData } from '@/lib/services/privacy-service';

const FILTERS = [
{ id: 'normal', label: 'Normal', css: 'none' },
{ id: 'vivid', label: 'Vivid', css: 'saturate(1.5) contrast(1.1)' },
{ id: 'warm', label: 'Warm', css: 'sepia(0.35) saturate(1.3)' },
{ id: 'cool', label: 'Cool', css: 'hue-rotate(15deg) saturate(1.2)' },
{ id: 'bw', label: 'B&W', css: 'grayscale(1)' },
];

export default function CreatePostScreen() {
const router = useRouter();
const { user } = useAuthStore();
const [content, setContent] = useState('');
const [caption, setCaption] = useState('');
const [hashtags, setHashtags] = useState([]);
const [hashtagInput, setHashtagInput] = useState('');
const [isPublic, setIsPublic] = useState(true);
const [selectedFile, setSelectedFile] = useState(null);
const [mediaType, setMediaType] = useState('image');
const [filter, setFilter] = useState(FILTERS[0]);
const [recording, setRecording] = useState(false);
const [posting, setPosting] = useState(false);
const [localError, setLocalError] = useState(null);
const fileInputRef = useRef(null);
const previewUrl = selectedFile ? selectedFile.uri : null;

const openCamera = async () => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setLocalError('Camera permission not granted.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedFile({ uri: asset.uri, type: asset.type, name: asset.fileName || 'camera-capture' });
      setMediaType(asset.type?.startsWith('video') ? 'video' : 'image');
    }
  } catch (e) {
    setLocalError('Failed to open camera.');
  }
};

const pick = async (type: string) => {
  setMediaType(type);
  if (Platform.OS === 'web') {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'video' ? 'video/*' : 'image/*';
      fileInputRef.current.click();
    }
  } else {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setLocalError('Media library permission not granted.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({ uri: asset.uri, type: asset.type, name: asset.fileName || 'library-pick' });
      }
    } catch (e) {
      setLocalError('Failed to pick media.');
    }
  }
};

const onFile = async (e) => { 
const f = e.target.files?.[0]; 
if (f) { 
  // Strip EXIF data from images before upload
  if (Platform.OS === 'web' && f.type.startsWith('image/')) {
    try {
      const strippedUri = await stripExifData(URL.createObjectURL(f));
      const response = await fetch(strippedUri);
      const strippedBlob = await response.blob();
      const strippedFile = new File([strippedBlob], f.name, { type: f.type });
      setSelectedFile(strippedFile);
    } catch (err) {
      console.error('EXIF strip failed:', err);
      setSelectedFile(f);
    }
  } else {
    // On native, ImagePicker already handles the file/uri safely
    setSelectedFile({ uri: f.uri || URL.createObjectURL(f), type: f.type, name: f.name });
  }
  setMediaType(f.type.startsWith('video') ? 'video' : 'image'); 
} 
};

const addHashtag = () => { const t = hashtagInput.trim().replace(/^#/, ''); if (t && !hashtags.includes(t)) setHashtags([...hashtags, t]); setHashtagInput(''); };

const handlePost = async () => {
setLocalError(null);
if (!content.trim() && !selectedFile) { setLocalError('Add text or select media.'); return; }
if (!user?.id) { setLocalError('You must be logged in.'); return; }
const file = selectedFile, type = mediaType;
const payload = { content: content.trim(), caption: caption.trim() || undefined, hashtags, isPublic };
setPosting(true);
router.back(); // return to feed; upload continues in background
(async () => {
try {
let mediaUrl, thumbnailUrl;
if (file) { const up = await uploadMedia(file, user.id, () => {}); mediaUrl = up.url; thumbnailUrl = up.thumbnailUrl; }
await createPost({ creatorId: user.id, content: payload.content, caption: payload.caption, mediaUrl, thumbnailUrl, mediaType: type, hashtags: payload.hashtags, isPublic: payload.isPublic });
console.log('[Create] background upload complete');
} catch (e: any) { 
  console.error('[Create] background upload failed:', e);
  // Alert the user even if they navigated back, to prevent silent failure
  Alert.alert('Post Failed', e.message || 'Could not upload post. Please check your connection and try again.');
} finally {
  setPosting(false);
}
})();
};

return (
<View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
{Platform.OS === 'web' && <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={onFile} />}
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 }}>
<TouchableOpacity onPress={() => router.back()}><X size={24} color="#fff" /></TouchableOpacity>
<Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>New Post</Text>
<TouchableOpacity onPress={handlePost} disabled={posting} style={{ backgroundColor: posting ? '#666' : '#e91e63', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 }}>
{posting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Post</Text>}
</TouchableOpacity>
</View>
<ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
{localError && <View style={{ backgroundColor: '#3a1a1a', borderRadius: 8, padding: 12, marginBottom: 12 }}><Text style={{ color: '#ff6b6b', fontSize: 13 }}>{localError}</Text></View>}
{selectedFile ? (
<View style={{ marginBottom: 12 }}>
{Platform.OS === 'web' ? (
  mediaType === 'video' ? 
    <video src={previewUrl} controls muted style={{ width: '100%', maxHeight: 420, borderRadius: 12, filter: filter.css }} /> : 
    <img src={previewUrl} alt="" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 12, filter: filter.css }} />
) : (
  <Image source={{ uri: previewUrl }} style={{ width: '100%', height: 240, borderRadius: 12 }} />
)}
<View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
{FILTERS.map((f) => (
<TouchableOpacity key={f.id} onPress={() => setFilter(f)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: filter.id === f.id ? '#e91e63' : '#2a2a2a' }}>
<Text style={{ color: '#fff', fontSize: 12 }}>{f.label}</Text>
</TouchableOpacity>
))}
<TouchableOpacity onPress={() => setSelectedFile(null)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#2a2a2a' }}>
<Text style={{ color: '#ff6b6b', fontSize: 12 }}>Remove</Text>
</TouchableOpacity>
</View>
</View>
) : (
<View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
<TouchableOpacity onPress={() => pick('image')} style={{ flex: 1, height: 160, backgroundColor: '#1a1a1a', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a2a' }}>
<ImageIcon size={28} color="#e91e63" /><Text style={{ color: '#aaa', fontSize: 13, marginTop: 6 }}>Photo</Text>
</TouchableOpacity>
<TouchableOpacity onPress={() => pick('video')} style={{ flex: 1, height: 160, backgroundColor: '#1a1a1a', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a2a' }}>
<Video size={28} color="#e91e63" /><Text style={{ color: '#aaa', fontSize: 13, marginTop: 6 }}>Video</Text>
</TouchableOpacity>
<TouchableOpacity onPress={openCamera} style={{ flex: 1, height: 160, backgroundColor: '#1a1a1a', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a2a' }}>
<Camera size={28} color="#e91e63" /><Text style={{ color: '#aaa', fontSize: 13, marginTop: 6 }}>Camera</Text>
</TouchableOpacity>
</View>
)}
<TextInput value={content} onChangeText={setContent} placeholder="What's on your mind?" placeholderTextColor="#666" multiline style={{ color: '#fff', fontSize: 15, minHeight: 80 }} />
<TextInput value={caption} onChangeText={setCaption} placeholder="Add a caption (optional)" placeholderTextColor="#666" style={{ color: '#fff', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 10, marginTop: 8 }} />
<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
<TextInput value={hashtagInput} onChangeText={setHashtagInput} placeholder="Add hashtag" placeholderTextColor="#666" onSubmitEditing={addHashtag} style={{ flex: 1, color: '#fff', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 10 }} />
<TouchableOpacity onPress={addHashtag} style={{ marginLeft: 8 }}><Text style={{ color: '#e91e63', fontSize: 20 }}>+</Text></TouchableOpacity>
</View>
{hashtags.length > 0 && (
<View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 }}>
{hashtags.map((t) => (
<TouchableOpacity key={t} onPress={() => setHashtags(hashtags.filter((x) => x !== t))} style={{ backgroundColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
<Text style={{ color: '#e91e63', fontSize: 12 }}>#{t} ✕</Text>
</TouchableOpacity>
))}
</View>
)}
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
<Text style={{ color: '#fff', fontSize: 14 }}>Public</Text>
<Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: '#e91e63' }} />
</View>
<Text style={{ color: '#666', fontSize: 11, marginTop: 8 }}>🔒 Privacy: GPS & device metadata automatically stripped from photos</Text>
<View style={{ height: 40 }} />
</ScrollView>

</View>
);
}
