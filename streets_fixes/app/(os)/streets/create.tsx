import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { streetsService } from '@/lib/services/streets-service';

const MAX_MEDIA = 1;  // streets_posts has single media_url
const MAX_WIDTH = 1080;
const JPEG_QUALITY = 0.75;

function toast(message: string) {
  if (typeof window !== 'undefined' && document) {
    const div = document.createElement('div');
    div.textContent = message;
    div.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      background: #ff2d55; color: #fff; padding: 10px 20px; border-radius: 20px;
      font-size: 14px; font-weight: 600; z-index: 9999; pointer-events: none;
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
  } else {
    Alert.alert('', message);
  }
}

export default function StreetsCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressImage = async (uri: string): Promise<string> => {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  };

  const pickImage = useCallback(async () => {
    if (mediaUri) {
      Alert.alert('Limit reached', 'You can only attach one image/video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploading(true);
      setProgress(0);
      try {
        const compressed = await compressImage(result.assets[0].uri);
        setMediaUri(compressed);
        setProgress(100);
      } catch (e) {
        Alert.alert('Error', 'Failed to process image.');
      } finally {
        setUploading(false);
        setProgress(0);
      }
    }
  }, [mediaUri]);

  const removeMedia = useCallback(() => {
    setMediaUri(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() && !mediaUri) {
      Alert.alert('Empty post', 'Please add some text or media.');
      return;
    }
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to post.');
      return;
    }
    setUploading(true);
    try {
      await streetsService.createPost({
        content: content.trim(),
        mediaUrl: mediaUri || undefined,
        mediaType: mediaUri ? 'image' : 'text',
      });
      toast('Post created!');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create post.');
    } finally {
      setUploading(false);
    }
  }, [content, mediaUri, user, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>New Post</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={uploading || (!content.trim() && !mediaUri)}
          style={{
            backgroundColor: uploading || (!content.trim() && !mediaUri) ? '#333' : '#ff2d55',
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Avatar + Input */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#ff2d55',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {user?.display_name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <TextInput
            style={{
              flex: 1,
              color: '#fff',
              fontSize: 16,
              lineHeight: 22,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
            placeholder="What's happening on the streets?"
            placeholderTextColor="#666"
            multiline
            maxLength={500}
            value={content}
            onChangeText={setContent}
          />
        </View>

        {/* Character count */}
        <Text style={{ color: '#666', fontSize: 12, textAlign: 'right', marginTop: 4 }}>
          {content.length}/500
        </Text>

        {/* Media Preview */}
        {mediaUri && (
          <View style={{ marginTop: 12, position: 'relative', alignSelf: 'flex-start' }}>
            <Image
              source={{ uri: mediaUri }}
              style={{ width: 200, height: 200, borderRadius: 12 }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={removeMedia}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderRadius: 12,
                padding: 4,
              }}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Upload progress */}
        {uploading && progress > 0 && (
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: '#ff2d55', fontSize: 13 }}>
              Compressing... {progress}%
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Toolbar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#222',
        gap: 20,
      }}>
        <TouchableOpacity onPress={pickImage} disabled={uploading || !!mediaUri}>
          <Ionicons
            name="image"
            size={26}
            color={mediaUri ? '#333' : '#ff2d55'}
          />
        </TouchableOpacity>
        <TouchableOpacity disabled>
          <Ionicons name="location" size={26} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity disabled>
          <Ionicons name="happy" size={26} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
