import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const CATS = ['All', 'Music', 'Gaming', 'News', 'Education', 'Sports', 'Comedy', 'Technology', 'Live', 'Podcasts', 'Fashion', 'Food'];

interface Props { selected: string; onSelect: (c: string) => void; }

export default function CategoryChips({ selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.wrap} contentContainerStyle={st.inner}>
      {CATS.map((cat: any) => {
        const active = selected === cat;
        return (
          <TouchableOpacity key={cat} onPress={() => onSelect(cat)} style={[st.chip, active && st.chipA]} activeOpacity={0.7}>
            <Text style={[st.text, active && st.textA]}>{cat}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { maxHeight: 44 },
  inner: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  chip: { backgroundColor: '#1C1C1E', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, marginRight: 8 },
  chipA: { backgroundColor: '#fff' },
  text: { color: '#fff', fontSize: 13, fontWeight: '500' },
  textA: { color: '#000', fontWeight: '600' },
});
