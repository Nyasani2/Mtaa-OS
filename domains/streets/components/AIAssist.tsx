import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AIAssistProps {
  content: string;
  onApply: (text: string) => void;
}

export default function AIAssist({ content, onApply }: AIAssistProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateCaptions = async () => {
    setLoading(true);
    try {
      // Simulated AI caption generation based on content keywords
      const keywords = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const templates = [
        `Check this out! ${content.slice(0, 30)}...`,
        `When you realize ${content.slice(0, 20)}...`,
        `POV: ${content.slice(0, 25)}`,
        `Just dropped this. ${content.slice(0, 30)}`,
        `The vibes are immaculate ${content.slice(0, 20)}`,
      ];
      setSuggestions(templates);
    } finally {
      setLoading(false);
    }
  };

  const generateHashtags = async () => {
    setLoading(true);
    try {
      const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
      const baseTags = ['mtaa', 'streets', 'viral', 'trending', 'fyp'];
      const derivedTags = words.slice(0, 5).map((w: string) => w.replace(/[^a-z0-9]/g, ''));
      const allTags = [...new Set([...baseTags, ...derivedTags])].filter(t => t.length > 2);
      setSuggestions(allTags.map(t => `#${t}`));
    } finally {
      setLoading(false);
    }
  };

  const translateCaption = async () => {
    setLoading(true);
    try {
      // Simulated translation — in production this calls ASIS/Kimi API
      const translations = [
        `[ES] ${content}`,
        `[FR] ${content}`,
        `[SW] ${content}`,
      ];
      setSuggestions(translations);
    } finally {
      setLoading(false);
    }
  };

  const getInsights = async () => {
    setLoading(true);
    try {
      setSuggestions([
        'Best posting time: 6-8 PM (peak engagement)',
        'Your audience is most active on weekends',
        'Add a question to boost comments by 40%',
        'Videos under 60s get 2x more views',
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginTop: 12 }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
        <Ionicons name="sparkles" size={18} color="#00d4ff" /> ASIS AI Assist
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <TouchableOpacity onPress={generateCaptions} style={{ backgroundColor: '#222', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: '#00d4ff', fontSize: 13, fontWeight: '600' }}>Captions</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={generateHashtags} style={{ backgroundColor: '#222', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: '#00d4ff', fontSize: 13, fontWeight: '600' }}>Hashtags</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={translateCaption} style={{ backgroundColor: '#222', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: '#00d4ff', fontSize: 13, fontWeight: '600' }}>Translate</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={getInsights} style={{ backgroundColor: '#222', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: '#00d4ff', fontSize: 13, fontWeight: '600' }}>Insights</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#00d4ff" style={{ marginVertical: 12 }} />}

      {suggestions.map((s, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onApply(s)}
          style={{ backgroundColor: '#0a1a2a', borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 2, borderLeftColor: '#00d4ff' }}
        >
          <Text style={{ color: '#fff', fontSize: 13 }}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
