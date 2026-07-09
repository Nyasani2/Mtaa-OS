import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, Alert,
  Switch, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface LiveSettings {
  title: string;
  description: string;
  category: string;
  visibility: 'public' | 'unlisted' | 'subscribers' | 'members_only';
  enableChat: boolean;
  enableSuperChat: boolean;
  enableRecording: boolean;
  scheduledFor: string | null;
  cameraCount: number;
  monetization: boolean;
}

const CATEGORIES = ['Music', 'Gaming', 'Education', 'News', 'Sports', 'Comedy', 'Tech', 'Church', 'Radio', 'TV', 'Government', 'Business'];

export default function LiveSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [settings, setSettings] = useState<LiveSettings>({
    title: '',
    description: '',
    category: 'Music',
    visibility: 'public',
    enableChat: true,
    enableSuperChat: true,
    enableRecording: true,
    scheduledFor: null,
    cameraCount: 1,
    monetization: false,
  });
  const [isLive, setIsLive] = useState(false);
  const [streamKey, setStreamKey] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [streamId, setStreamId] = useState('');

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const updateSettings = (updates: Partial<LiveSettings>) => setSettings(prev => ({ ...prev, ...updates }));

  const generateStreamKey = () => {
    const key = `live_${user?.id?.slice(0, 8)}_${Date.now().toString(36)}`;
    setStreamKey(key);
    return key;
  };

  const goLive = async () => {
    if (!user?.id || !settings.title.trim()) {
      Alert.alert('Missing Info', 'Enter a stream title.');
      return;
    }

    const key = streamKey || generateStreamKey();

    const { data, error } = await supabase.from('mstudio_live_streams').insert({
      creator_id: user.id,
      title: settings.title,
      description: settings.description,
      category: settings.category.toLowerCase(),
      visibility: settings.visibility,
      stream_key: key,
      status: 'live',
      is_live: true,
      started_at: new Date().toISOString(),
      enable_chat: settings.enableChat,
      enable_super_chat: settings.enableSuperChat,
      enable_recording: settings.enableRecording,
      monetization_enabled: settings.monetization,
    }).select().single();

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setStreamId(data.id);
    setIsLive(true);

    // Subscribe to viewer count
    const channel = supabase.channel(`stream:${data.id}`)
      .on('broadcast', { event: 'viewer_count' }, payload => {
        setViewerCount(payload.count || 0);
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  };

  const endStream = async () => {
    if (!streamId) return;
    await supabase.from('mstudio_live_streams').update({
      status: 'ended',
      is_live: false,
      ended_at: new Date().toISOString(),
    }).eq('id', streamId);
    setIsLive(false);
    setStreamId('');
    setViewerCount(0);
    Alert.alert('Stream Ended', 'Your live stream has ended.');
  };

  const formatViewerCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  if (isLive) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView style={{ flex: 1 }} facing="front">
          {/* Live Overlay */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 16, paddingTop: 48 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,0,0,0.8)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 6 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>LIVE</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Feather name="eye" size={12} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, marginLeft: 4 }}>{formatViewerCount(viewerCount)}</Text>
              </View>
            </View>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 }} numberOfLines={1}>{settings.title}</Text>
          </View>

          {/* End Stream Button */}
          <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={endStream}
              style={{ backgroundColor: '#ff0000', borderRadius: 24, paddingHorizontal: 32, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Feather name="square" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>End Stream</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Go Live</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stream Preview */}
        <View style={{ margin: 16, aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
          {permission?.granted ? (
            <CameraView style={{ width: '100%', height: '100%' }} facing="front" />
          ) : (
            <>
              <Feather name="video-off" size={40} color="#444" />
              <TouchableOpacity onPress={requestPermission} style={{ marginTop: 12, backgroundColor: '#ff0000', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Allow Camera</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Title */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Stream Title</Text>
          <TextInput
            value={settings.title}
            onChangeText={t => updateSettings({ title: t })}
            placeholder="What's your stream about?"
            placeholderTextColor="#555"
            style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14 }}
          />
        </View>

        {/* Description */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Description</Text>
          <TextInput
            value={settings.description}
            onChangeText={t => updateSettings({ description: t })}
            multiline
            numberOfLines={2}
            placeholder="Tell viewers what to expect..."
            placeholderTextColor="#555"
            style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, textAlignVertical: 'top' }}
          />
        </View>

        {/* Category */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => updateSettings({ category: c })}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, backgroundColor: settings.category === c ? '#ff0000' : '#1a1a1a' }}
              >
                <Text style={{ color: '#fff', fontSize: 12 }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Visibility */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Visibility</Text>
          {[
            { key: 'public', label: 'Public', desc: 'Anyone can watch' },
            { key: 'subscribers', label: 'Subscribers Only', desc: 'Only your subscribers' },
            { key: 'members_only', label: 'Members Only', desc: 'Paid members only' },
            { key: 'unlisted', label: 'Unlisted', desc: 'Only with link' },
          ].map(v => (
            <TouchableOpacity
              key={v.key}
              onPress={() => updateSettings({ visibility: v.key as any })}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: settings.visibility === v.key ? '#1a1a1a' : 'transparent', borderWidth: 1, borderColor: settings.visibility === v.key ? '#ff0000' : '#333', marginBottom: 8 }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: settings.visibility === v.key ? '#ff0000' : '#555', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                {settings.visibility === v.key && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff0000' }} />}
              </View>
              <View>
                <Text style={{ color: '#fff', fontSize: 14 }}>{v.label}</Text>
                <Text style={{ color: '#666', fontSize: 11 }}>{v.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Toggles */}
        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          {[
            { key: 'enableChat', label: 'Live Chat', icon: 'message-square' },
            { key: 'enableSuperChat', label: 'Super Chat', icon: 'dollar-sign' },
            { key: 'enableRecording', label: 'Save Recording', icon: 'save' },
            { key: 'monetization', label: 'Enable Monetization', icon: 'trending-up' },
          ].map(toggle => (
            <View key={toggle.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name={toggle.icon as any} size={18} color="#888" />
                <Text style={{ color: '#fff', fontSize: 14, marginLeft: 12 }}>{toggle.label}</Text>
              </View>
              <Switch
                value={settings[toggle.key as keyof LiveSettings] as boolean}
                onValueChange={v => updateSettings({ [toggle.key]: v } as any)}
                trackColor={{ false: '#333', true: '#ff0000' }}
                thumbColor={settings[toggle.key as keyof LiveSettings] ? '#fff' : '#888'}
              />
            </View>
          ))}
        </View>

        {/* Camera Tiers Info */}
        <View style={{ margin: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Camera Setup</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {[
              { count: 1, label: '1 Camera', price: 'Free', color: '#00ff00' },
              { count: 2, label: '2 Cameras', price: 'Free', color: '#00ff00' },
              { count: 4, label: '4 Cameras', price: '10 KES/day', color: '#ffd700' },
            ].map(tier => (
              <TouchableOpacity
                key={tier.count}
                onPress={() => updateSettings({ cameraCount: tier.count })}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: settings.cameraCount === tier.count ? '#222' : '#111',
                  borderWidth: 1,
                  borderColor: settings.cameraCount === tier.count ? tier.color : '#333',
                  alignItems: 'center',
                }}
              >
                <Feather name="camera" size={18} color={tier.color} />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '500', marginTop: 4 }}>{tier.label}</Text>
                <Text style={{ color: tier.color, fontSize: 10, marginTop: 2 }}>{tier.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ color: '#666', fontSize: 11 }}>Multi-camera sync via Bluetooth/Wi-Fi available in premium tier.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Go Live Button */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a' }}>
        <TouchableOpacity
          onPress={goLive}
          disabled={!settings.title.trim()}
          style={{
            backgroundColor: settings.title.trim() ? '#ff0000' : '#333',
            borderRadius: 12,
            padding: 18,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' }} />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>GO LIVE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
