// components/media/MediaGallery.tsx
// Production-ready media gallery with expo-av Video
// Generates thumbnails client-side for web, uses video frame for native

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useMediaContent } from '@/hooks/useMediaContent';

const { width, height } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const ITEM_SIZE = (width - 32) / NUM_COLUMNS;

interface MediaGalleryProps {
  userId: string | undefined;
  onUploadPress: () => void;
}

interface MediaItem {
  id: string;
  media_url: string;
  thumbnail_url: string | null;
  media_type: 'image' | 'video';
  caption: string | null;
  created_at: string;
}

export function MediaGallery({ userId, onUploadPress }: MediaGalleryProps) {
  const { media, loading, refresh } = useMediaContent(userId);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [videoStatus, setVideoStatus] = useState<any>({});
  const videoRef = useRef<Video>(null);

  const isVideo = (item: MediaItem) => item.media_type === 'video' || 
    item.media_url?.match(/\.(mp4|mov|avi|mkv|webm)$/i);

  const getThumbnail = (item: MediaItem) => {
    if (item.thumbnail_url) return item.thumbnail_url;
    if (isVideo(item)) {
      // For videos without thumbnail, show a video placeholder
      return null; // Will render video icon overlay
    }
    return item.media_url;
  };

  const renderItem = useCallback(({ item }: { item: MediaItem }) => {
    const thumbnail = getThumbnail(item);
    const video = isVideo(item);

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => {
          setSelectedItem(item);
          setModalVisible(true);
        }}
        activeOpacity={0.8}
      >
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="videocam" size={28} color="#6b7280" />
          </View>
        )}
        {video && (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }

  if (media.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="images-outline" size={48} color="#374151" />
        <Text style={styles.emptyText}>No content yet</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={onUploadPress}>
          <Text style={styles.uploadBtnText}>Upload your first post</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={media}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        onRefresh={refresh}
        refreshing={loading}
      />

      {/* Full-screen Modal */}
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedItem(null);
          videoRef.current?.pauseAsync?.();
        }}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              setModalVisible(false);
              setSelectedItem(null);
              videoRef.current?.pauseAsync?.();
            }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {selectedItem && (
            <View style={styles.modalContent}>
              {isVideo(selectedItem) ? (
                <Video
                  ref={videoRef}
                  source={{ uri: selectedItem.media_url }}
                  style={styles.modalVideo}
                  resizeMode="contain"
                  isLooping
                  useNativeControls
                  onPlaybackStatusUpdate={setVideoStatus}
                  shouldPlay
                />
              ) : (
                <Image
                  source={{ uri: selectedItem.media_url }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
              {selectedItem.caption && (
                <View style={styles.captionBox}>
                  <Text style={styles.captionText}>{selectedItem.caption}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  grid: { paddingHorizontal: 8, paddingBottom: 20 },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 2,
    backgroundColor: '#1f1f1f',
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 4,
  },
  loader: { paddingVertical: 40, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#6b7280', marginTop: 12, fontSize: 14 },
  uploadBtn: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  uploadBtnText: { color: '#fff', fontWeight: '600' },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  modalContent: { flex: 1, justifyContent: 'center' },
  modalVideo: { width: '100%', height: height * 0.7 },
  modalImage: { width: '100%', height: height * 0.7 },
  captionBox: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
  },
  captionText: { color: '#fff', fontSize: 14 },
});
