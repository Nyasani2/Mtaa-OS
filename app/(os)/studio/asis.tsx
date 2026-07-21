import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useMASIS } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const KIMI_API_KEY = process.env.EXPO_PUBLIC_KIMI_API_KEY || '';
const KIMI_BASE_URL = 'https://api.moonshot.cn/v1';

export default function StudioASISScreen() {
  const { user } = useAuthStore();
  const { content, load, create, loading } = useMASIS(user?.id);
  const [prompt, setPrompt] = useState('');
  const [generatedType, setGeneratedType] = useState('thumbnail');
  const [generating, setGenerating] = useState(false);

  const generateWithKimi = async (userPrompt: string, type: string): Promise<string> => {
    if (!KIMI_API_KEY) {
      throw new Error('Kimi API key not configured');
    }

    const systemPrompts: Record<string, string> = {
      thumbnail: 'You are an expert thumbnail designer. Generate a compelling thumbnail concept with title, color scheme, and visual description. Respond in JSON: { "title": "...", "colors": [...], "description": "..." }',
      title: 'You are a YouTube title optimization expert. Generate 5 catchy, SEO-optimized titles. Respond in JSON: { "titles": [...] }',
      description: 'You are a video description writer. Generate an engaging, SEO-optimized description with hashtags. Respond in JSON: { "description": "...", "hashtags": [...] }',
      tags: 'You are a metadata expert. Generate relevant tags/keywords. Respond in JSON: { "tags": [...] }',
      script: 'You are a video scriptwriter. Generate a compelling script outline. Respond in JSON: { "hook": "...", "outline": [...], "cta": "..." }',
    };

    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: systemPrompts[type] || systemPrompts.description },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Kimi API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Kimi returned empty response');
    }

    return content;
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user?.id) {
      Alert.alert('Error', 'Please enter a prompt and ensure you are logged in.');
      return;
    }

    setGenerating(true);

    try {
      // Call real Kimi API
      const response = await generateWithKimi(prompt.trim(), generatedType);

      // Parse JSON response safely
      let parsedData: any;
      try {
        parsedData = JSON.parse(response);
      } catch {
        // If not valid JSON, store as text
        parsedData = { result: response };
      }

      // Save to database
      const { error: dbError } = await create({
        user_id: user.id,
        prompt: prompt.trim(),
        generated_type: generatedType,
        generated_data: parsedData,
        ai_model: 'kimi',
      });

      if (dbError) throw dbError;

      setPrompt('');
      await load();
      Alert.alert('Generated', `ASIS has created your ${generatedType}!`);
    } catch (err: any) {
      console.error('[ASIS Studio] Generate error:', err);
      Alert.alert('Generation Failed', err.message || 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
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

        {/* Generate Button */}
        <TouchableOpacity 
          onPress={handleGenerate} 
          disabled={generating || !prompt.trim()}
          style={{ 
            backgroundColor: generating || !prompt.trim() ? '#333' : '#ff0000', 
            paddingVertical: 14, 
            borderRadius: 12, 
            alignItems: 'center',
            marginBottom: 24
          }}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Generate with ASIS</Text>
          )}
        </TouchableOpacity>

        {/* Generated Content List */}
        {loading ? (
          <ActivityIndicator color="#ff0000" />
        ) : (
          <FlatList
            data={content || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <Text style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>{item.generated_type.toUpperCase()}</Text>
                <Text style={{ color: '#fff', fontSize: 13 }} numberOfLines={3}>{item.prompt}</Text>
                <Text style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>
                  {typeof item.generated_data === 'string' ? item.generated_data : JSON.stringify(item.generated_data).slice(0, 100)}...
                </Text>
              </View>
            )}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}
