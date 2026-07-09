import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'ready' | 'processing' | 'done' | 'error';
  result?: string;
}

const AI_TOOLS = [
  { id: 'thumbnail', name: 'Generate Thumbnail', description: 'AI-generated thumbnail from video frames', icon: 'image' },
  { id: 'noise', name: 'Remove Noise', description: 'Clean up audio/video background noise', icon: 'mic-off' },
  { id: 'subtitles', name: 'Auto Subtitles', description: 'Generate captions in multiple languages', icon: 'type' },
  { id: 'translate', name: 'Translate', description: 'Translate content to Swahili, French, etc.', icon: 'globe' },
  { id: 'dub', name: 'Auto Dub', description: 'Dub audio in different languages', icon: 'headphones' },
  { id: 'master', name: 'Music Mastering', description: 'Professional audio mastering', icon: 'music' },
  { id: 'color', name: 'Color Grading', description: 'AI color correction and grading', icon: 'sun' },
  { id: 'chapters', name: 'Auto Chapters', description: 'Generate video chapter timestamps', icon: 'list' },
  { id: 'highlights', name: 'Auto Highlights', description: 'Extract best moments from video', icon: 'star' },
  { id: 'seo', name: 'SEO Optimize', description: 'Optimize title, tags, description', icon: 'search' },
  { id: 'copyright', name: 'Copyright Scan', description: 'Check for copyright violations', icon: 'shield' },
];

export default function AIStudioScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [tools, setTools] = useState<Record<string, AITool>>(() =>
    Object.fromEntries(AI_TOOLS.map(t => [t.id, { ...t, status: 'ready' }]))
  );
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);

  const runTool = async (toolId: string) => {
    setActiveTool(toolId);
    setProcessing(true);
    setTools(prev => ({ ...prev, [toolId]: { ...prev[toolId], status: 'processing' } }));

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));

    const results: Record<string, string> = {
      thumbnail: 'Thumbnail generated with 3 variants. Best match: frame at 00:42.',
      noise: 'Noise profile analyzed. 94% reduction applied to background hum.',
      subtitles: 'Subtitles generated in English, Swahili, and French. SRT files ready.',
      translate: 'Content translated to Swahili (98% accuracy) and French (95% accuracy).',
      dub: 'Auto-dub generated in Swahili. Lip-sync alignment: 87% match.',
      master: 'Audio mastered: -14 LUFS integrated, true peak -1.0 dB.',
      color: 'Color grade applied: warm African sunset palette.',
      chapters: '12 chapters detected. Average chapter length: 4m 32s.',
      highlights: '5 highlight clips extracted. Best clip: 00:42-01:15 (engagement score: 94).',
      seo: 'Optimized title: "How to Build a Creator Business in Kenya 2026" | Tags: #creator #kenya #business',
      copyright: 'Scan complete. No copyright violations detected. 2 fair-use samples flagged for review.',
    };

    setTools(prev => ({
      ...prev,
      [toolId]: { ...prev[toolId], status: 'done', result: results[toolId] || 'Processing complete.' },
    }));
    setProcessing(false);
  };

  const tool = activeTool ? tools[activeTool] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      {/* Header */}
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>AI Studio</Text>
          <Text style={{ color: '#888', fontSize: 11 }}>Powered by ASIS</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ASIS Banner */}
        <View style={{ margin: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, alignItems: 'center' }}>
          <MaterialCommunityIcons name="robot" size={48} color="#ff0000" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>ASIS Creator Assistant</Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
            AI-powered tools to enhance your content. Built on Kamos Theory.
          </Text>
        </View>

        {/* Active Tool Result */}
        {tool && (
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Feather name={tool.icon as any} size={20} color="#ff0000" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 }}>{tool.name}</Text>
              {tool.status === 'processing' && <ActivityIndicator size="small" color="#ff0000" style={{ marginLeft: 10 }} />}
              {tool.status === 'done' && <Feather name="check-circle" size={18} color="#00ff00" style={{ marginLeft: 10 }} />}
            </View>

            {tool.status === 'ready' && (
              <Text style={{ color: '#888', fontSize: 13 }}>{tool.description}</Text>
            )}

            {tool.status === 'processing' && (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <ActivityIndicator size="large" color="#ff0000" />
                <Text style={{ color: '#888', marginTop: 12 }}>ASIS is processing...</Text>
                <Text style={{ color: '#555', fontSize: 11, marginTop: 4 }}>This may take a few moments</Text>
              </View>
            )}

            {tool.status === 'done' && tool.result && (
              <View>
                <Text style={{ color: '#fff', fontSize: 13, lineHeight: 20 }}>{tool.result}</Text>
                <TouchableOpacity
                  onPress={() => { /* Apply result */ }}
                  style={{ marginTop: 12, backgroundColor: '#ff0000', borderRadius: 8, padding: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Apply to Content</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Custom Prompt */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Ask ASIS anything</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="e.g., Generate a thumbnail for my Afrobeat video..."
              placeholderTextColor="#555"
              style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14 }}
            />
            <TouchableOpacity
              onPress={() => { if (inputText.trim()) { setInputText(''); Alert.alert('ASIS', 'Custom prompt sent to ASIS engine.'); }}}
              style={{ backgroundColor: '#ff0000', borderRadius: 8, padding: 12, justifyContent: 'center' }}
            >
              <Feather name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tools Grid */}
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 12 }}>AI Tools</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 }}>
          {AI_TOOLS.map(t => (
            <TouchableOpacity
              key={t.id}
              onPress={() => runTool(t.id)}
              disabled={processing}
              style={{
                width: '50%',
                padding: 4,
              }}
            >
              <View style={{
                backgroundColor: tools[t.id].status === 'done' ? '#0a1a0a' : '#1a1a1a',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: tools[t.id].status === 'done' ? '#00ff00' : tools[t.id].status === 'processing' ? '#ff0000' : '#222',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Feather name={t.icon as any} size={20} color={tools[t.id].status === 'done' ? '#00ff00' : '#ff0000'} />
                  {tools[t.id].status === 'done' && <Feather name="check" size={14} color="#00ff00" />}
                  {tools[t.id].status === 'processing' && <ActivityIndicator size="small" color="#ff0000" />}
                </View>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', marginTop: 10 }}>{t.name}</Text>
                <Text style={{ color: '#666', fontSize: 11, marginTop: 4 }} numberOfLines={2}>{t.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
