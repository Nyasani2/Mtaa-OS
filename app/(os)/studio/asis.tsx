import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { useMASIS } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioASISScreen() {
  const { user } = useAuthStore();
  const { content, load, create, loading } = useMASIS(user?.id);
  const [prompt, setPrompt] = useState('');
  const [generatedType, setGeneratedType] = useState('thumbnail');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || !user?.id) return;
    setGenerating(true);

    // In production: call Kimi API via ASIS
    // const response = await fetch('https://api.moonshot.cn/v1/chat/completions', { ... });

    setTimeout(async () => {
      setGenerating(false);
      await create({
        user_id: user.id,
        prompt: prompt.trim(),
        generated_type: generatedType,
        generated_data: { mock: true, result: 'Generated content placeholder' },
        ai_model: 'kimi',
      });
      setPrompt('');
      load();
      Alert.alert('Generated', 'ASIS has created your content!');
    }, 2000);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ padding: 16, paddingTop: 48 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>ASIS AI Studio</Text>
        <Text style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>Generate thumbnails, titles, descriptions, and more with AI</Text>

        {/* Type Selector */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {['thumbnail', 'title', 'description', 'tags', 'script'].map(type => (
            <TouchableOpacity key={type} onPress={() => setGeneratedType(type)} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: generatedType === type ? '#ff0000' : '#1a1a1a', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Prompt Input */}
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder={`Describe the ${generatedType} you want...`}
          placeholderTextColor="#555"
          multiline
          numberOfLines={4}
          style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, color: '#fff', fontSize: 14, height: 120, textAlignVertical: 'top', marginBottom: 16 }}
        />

        <TouchableOpacity onPress={handleGenerate} disabled={generating} style={{ backgroundColor: generating ? '#333' : '#ff0000', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{generating ? 'Generating...' : '🤖 Generate with ASIS'}</Text>
        </TouchableOpacity>

        {/* History */}
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Generation History</Text>
        {content.map((item) => (
          <View key={item.id} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#ff6b6b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>{item.generated_type}</Text>
              <Text style={{ color: '#666', fontSize: 11 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 13 }} numberOfLines={2}>{item.prompt}</Text>
            {item.generated_url && (
              <Text style={{ color: '#00ff00', fontSize: 12, marginTop: 6 }}>✓ Generated</Text>
            )}
          </View>
        ))}
        {content.length === 0 && <Text style={{ color: '#666', textAlign: 'center', padding: 20 }}>No generations yet.</Text>}
      </View>
    </ScrollView>
  );
}
