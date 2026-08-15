// @ts-nocheck
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Image as ImageIcon, Video, Camera } from 'lucide-react-native';
import { uploadMedia, createPost } from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [posting, setPosting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const fileInputRef = useRef(null);
  const camVideoRef = useRef(null);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);

  const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : null;

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream; setCameraOpen(true);
      setTimeout(() => { if (camVideoRef.current) { camVideoRef.current.srcObject = stream; camVideoRef.current.play(); } }, 120);
    } catch (e) { setLocalError('Camera not available in this browser.'); }
  };
  const stopCamera = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; setCameraOpen(false); setRecording(false); };
  const toggleRecord = () => {
    if (!streamRef.current) return;
    if (!recording) {
      chunksRef.current = [];
      const rec = new MediaRecorder(streamRef.current);
      rec.ondataavailable = (ev) => chunksRef.current.push(ev.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setSelectedFile(new File([blob], 'mtaa-rec-' + Date.now() + '.webm', { type: 'video/webm' }));
        setMediaType('video'); stopCamera();
      };
      rec.start(); recRef.current = rec; setRecording(true);
    } else { recRef.current?.stop(); setRecording(false); }
  };

  const pick = (type) => { setMediaType(type); if (fileInputRef.current) { fileInputRef.current.accept = type === 'video' ? 'video/*' : 'image/*'; fileInputRef.current.click(); } };
  const onFile = (e) => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); setMediaType(f.type.startsWith('video') ? 'video' : 'image'); } };
  const addHashtag = () => { const t = hashtagInput.trim().replace(/^#/, ''); if (t && !hashtags.includes(t)) setHashtags([...hashtags, t]); setHashtagInput(''); };

  const handlePost = async () => {
    setLocalError(null);
    if (!content.trim() && !selectedFile) { setLocalError('Add text or select media.'); return; }
    if (!user?.id) { setLocalError('You must be logged in.'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLocalError('Session expired - log in again.'); return; }
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
      } catch (e) { console.error('[Create] background upload failed:', e); }
    })();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={onFile} />
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
            {mediaType === 'video'
              ? <video src={previewUrl} controls muted style={{ width: '100%', maxHeight: 420, borderRadius: 12, filter: filter.css }} />
              : <img src={previewUrl} alt="" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 12, filter: filter.css }} />}
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
        <Text style={{ color: '#666', fontSize: 11, marginTop: 8 }}>Posts upload in the background - you can keep browsing.</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {cameraOpen && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: '#000', zIndex: 50, justifyContent: 'center', alignItems: 'center' }}>
          <video ref={camVideoRef} muted playsInline style={{ width: '100%', maxHeight: '70%' }} />
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
            <TouchableOpacity onPress={toggleRecord} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: recording ? '#ff3b30' : '#e91e63', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{recording ? 'Stop' : 'Rec'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={stopCamera} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' }}>
              <X size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
