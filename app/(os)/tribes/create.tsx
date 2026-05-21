import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { tribeService } from '@/lib/tribes/services/tribeService';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['ethnic', 'interest', 'heritage', 'profession', 'location', 'vehicle', 'brand'];

export default function CreateTribeScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('ethnic');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !slug || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      setLoading(true);
      const tribe = await tribeService.createTribe({
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        category,
        description,
        short_description: description.slice(0, 120)
      });
      Alert.alert('Success', 'Tribe created!', [
        { text: 'OK', onPress: () => router.push(`/tribes/${tribe.slug}`) }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Create a Tribe</Text>

        <Text style={styles.label}>Tribe Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Luo Community" placeholderTextColor="#666" />

        <Text style={styles.label}>Slug *</Text>
        <TextInput style={styles.input} value={slug} onChangeText={setSlug} placeholder="luo-community" placeholderTextColor="#666" autoCapitalize="none" />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categories}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Tell people what this tribe is about..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
          <Text style={styles.createBtnText}>{loading ? 'Creating...' : 'Create Tribe'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23', padding: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  label: { color: '#a0a0a0', fontSize: 14, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1a1a3e', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  categories: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a3e', marginRight: 8, marginBottom: 8 },
  categoryBtnActive: { backgroundColor: '#e94560' },
  categoryText: { color: '#a0a0a0', fontSize: 12, textTransform: 'capitalize' },
  categoryTextActive: { color: '#fff', fontWeight: 'bold' },
  createBtn: { backgroundColor: '#e94560', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
