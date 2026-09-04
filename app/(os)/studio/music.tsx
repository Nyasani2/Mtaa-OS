import React, { useState, useEffect } from 'react';

import { Alert, View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Alert, useMMusic } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioMusicScreen() {
  const { user } = useAuthStore();
  const { tracks, load, loading } = useMMusic(user?.id);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { load(); }, []);

  const filteredTracks = tracks.filter((t: any) => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = () => {
    Alert.alert('Upload Music', 'Open file picker to upload audio track');
    // In production: use expo-document-picker
  };

  const handleGenerate = () => {
    Alert.alert('AI Music', 'Generate royalty-free music with ASIS');
    // In production: call ASIS/Kimi API
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 16, paddingTop: 48 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Music Library</Text>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search tracks..."
        placeholderTextColor="#555"
        style={{ backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, marginBottom: 16 }}
      />

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <TouchableOpacity onPress={handleUpload} style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#333' }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>📁 Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGenerate} style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ff000044' }}>
          <Text style={{ color: '#ff6b6b', fontWeight: '600' }}>🤖 AI Generate</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTracks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#ff000022', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Text style={{ color: '#ff0000', fontSize: 20 }}>♪</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{item.title}</Text>
              <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{item.artist || 'Unknown'} • {item.genre || 'No genre'} • {formatDuration(item.duration)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: item.is_approved === 'approved' ? '#00ff00' : '#ffaa00', fontSize: 11 }}>{item.is_approved}</Text>
              <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{item.usage_count} uses</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', padding: 32 }}>No tracks yet. Upload or generate music.</Text>}
      />
    </View>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
