import { useState } from 'react';
// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Video } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function LiveActiveScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [live, setLive] = useState(false);
  const [camError, setCamError] = useState(null);
  const [viewers, setViewers] = useState(0);
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState('');
  const [superChat, setSuperChat] = useState('');
  const channelRef = useRef(null);

  useEffect(() => {
    const ch = supabase.channel('mtaa-live-room-1');
    channelRef.current = ch;
    ch.on('presence', { event: 'sync' }, () => setViewers(Object.keys(ch.presenceState()).length))
      .on('broadcast', { event: 'chat' }, (e) => setChat((c) => [...c, e.payload]))
      .subscribe(async (status) => { if (status === 'SUBSCRIBED') await ch.track({ user: user?.id || 'anon' }); });
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
        setLive(true);
      } catch (e) { setCamError('Camera unavailable - viewers can still chat.'); }
    })();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); supabase.removeChannel(ch); };
  }, []);

  const send = (isSuper) => {
    const text = isSuper ? ('💰 KES ' + (superChat || '0') + ': ' + msg) : msg;
    if (!text.trim()) return;
    const payload = { user: user?.email?.split('@')[0] || 'viewer', text };
    channelRef.current?.send({ type: 'broadcast', event: 'chat', payload });
    setChat((c) => [...c, payload]); setMsg(''); if (isSuper) setSuperChat('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}><ArrowLeft size={22} color="#fff" /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Live Stream {live && <Text style={{ color: '#ff3b30' }}>• LIVE</Text>}</Text>
          <Text style={{ color: '#888', fontSize: 12 }}>{viewers} viewers</Text>
        </View>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <video ref={videoRef} muted playsInline style={{ width: '100%', maxHeight: '60%' }} />
        {camError && <Text style={{ color: '#888', fontSize: 13, marginTop: 8 }}>{camError}</Text>}
      </View>
      <ScrollView style={{ maxHeight: 160, paddingHorizontal: 16 }}>
        {chat.map((c, i) => (
          <Text key={i} style={{ color: '#ddd', fontSize: 13, marginBottom: 6 }}>
            <Text style={{ color: '#e91e63', fontWeight: '600' }}>{c.user}: </Text>{c.text}
          </Text>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#1f1f1f' }}>
        <TextInput value={superChat} onChangeText={setSuperChat} placeholder="Super Chat KES" placeholderTextColor="#666" keyboardType="numeric" style={{ width: 110, backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, color: '#fff', fontSize: 13 }} />
        <TextInput value={msg} onChangeText={setMsg} placeholder="Say something..." placeholderTextColor="#666" style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14 }} />
        <TouchableOpacity onPress={() => send(false)} style={{ backgroundColor: '#e91e63', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
