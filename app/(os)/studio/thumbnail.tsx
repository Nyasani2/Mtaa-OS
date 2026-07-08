import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase/client';

export default function ThumbnailScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!videoId) router.back();
  }, [videoId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const saveThumbnail = async () => {
    if (!selectedImage || !videoId) return;
    setUploading(true);
    try {
      // In production, upload to Supabase Storage here
      // For now, save the local URI
      const { error } = await supabase
        .from('studio_videos')
        .update({ thumbnail_url: selectedImage, updated_at: new Date().toISOString() })
        .eq('id', videoId);
      if (error) throw error;
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Could not save thumbnail');
    } finally {
      setUploading(false);
    }
  };

  const generateThumbnails = () => {
    // Placeholder: would generate frames from video
    Alert.alert('Coming Soon', 'Auto-generated thumbnails from video frames will be available soon.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thumbnail</Text>
        <TouchableOpacity onPress={saveThumbnail} disabled={!selectedImage || uploading}>
          <Text style={[styles.saveText, (!selectedImage || uploading) && styles.disabled]}>
            {uploading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
        {/* Preview */}
        <View style={styles.previewBox}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Feather name="image" size={48} color="#666" />
              <Text style={styles.previewText}>No thumbnail selected</Text>
            </View>
          )}
        </View>

        {/* Options */}
        <View style={styles.options}>
          <TouchableOpacity style={styles.optionBtn} onPress={pickImage}>
            <Feather name="image" size={22} color="#fff" />
            <Text style={styles.optionText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionBtn} onPress={takePhoto}>
            <Feather name="camera" size={22} color="#fff" />
            <Text style={styles.optionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionBtn} onPress={generateThumbnails}>
            <Feather name="film" size={22} color="#fff" />
            <Text style={styles.optionText}>Auto Generate from Video</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  saveText: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
  disabled: { color: '#666' },
  previewBox: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1f1f1f', marginBottom: 24 },
  previewImage: { width: '100%', height: '100%' },
  previewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  previewText: { color: '#666', fontSize: 14 },
  options: { width: '100%', gap: 12 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1f1f1f', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  optionText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});
