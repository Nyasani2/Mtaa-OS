// @ts-nocheck
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

export interface MediaUploadResult {
  type: 'image' | 'document';
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface ASISMediaUploadProps {
  onMediaSelected: (media: MediaUploadResult) => void;
}

export function ASISMediaUpload({ onMediaSelected }: ASISMediaUploadProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaUploadResult | null>(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const media: MediaUploadResult = {
          type: 'image',
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize,
        };
        setSelectedMedia(media);
        onMediaSelected(media);
      }
    } catch (error) {
      console.error('[ASIS Media] Image pick error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const media: MediaUploadResult = {
          type: 'image',
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          size: asset.fileSize,
        };
        setSelectedMedia(media);
        onMediaSelected(media);
      }
    } catch (error) {
      console.error('[ASIS Media] Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const media: MediaUploadResult = {
          type: 'document',
          uri: asset.uri,
          name: asset.name || `document_${Date.now()}`,
          size: asset.size,
          mimeType: asset.mimeType,
        };
        setSelectedMedia(media);
        onMediaSelected(media);
      }
    } catch (error) {
      console.error('[ASIS Media] Document pick error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const clearMedia = () => {
    setSelectedMedia(null);
  };

  return (
    <View style={styles.container}>
      {selectedMedia ? (
        <View style={styles.previewContainer}>
          {selectedMedia.type === 'image' ? (
            <Image 
              source={{ uri: selectedMedia.uri }} 
              style={styles.preview} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.documentPreview}>
              <Ionicons name="document-text-outline" size={32} color="#2563eb" />
              <Text style={styles.documentName} numberOfLines={1}>
                {selectedMedia.name}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={clearMedia} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttons}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={pickImage}
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={takePhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={pickDocument}
            activeOpacity={0.7}
          >
            <Ionicons name="document-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>File</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    padding: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  previewContainer: {
    position: 'relative',
    padding: 8,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    gap: 10,
    maxWidth: 300,
  },
  documentName: {
    color: '#e2e8f0',
    fontSize: 13,
    flex: 1,
  },
  clearButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
});

export default ASISMediaUpload;
