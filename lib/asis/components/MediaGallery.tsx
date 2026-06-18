import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMediaContent } from '../hooks/useMediaContent';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 3;

export default function MediaGallery({ userId, onUploadPress }) {
  const { media, loading, error, refresh } = useMediaContent(userId);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredMedia =
    activeTab === 'all'
      ? media
      : media.filter((item) => item.type === activeTab);

  const tabs = [
    { key: 'all', label: `All (${media.length})` },
    {
      key: 'video',
      label: `Videos (${media.filter((m) => m.type === 'video').length})`,
    },
    {
      key: 'photo',
      label: `Photos (${media.filter((m) => m.type === 'photo').length})`,
    },
  ];

  const renderItem = ({ item }) => {
    const hasThumbnail = item.thumbnail && item.thumbnail.trim() !== '';
    const isVideo = item.type === 'video';

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => setSelectedItem(item)}
        activeOpacity={0.8}
      >
        {hasThumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : isVideo ? (
          <View style={[styles.thumbnail, styles.videoPlaceholder]}>
            <Ionicons name="videocam" size={28} color="#666" />
            <Text style={styles.videoLabel} numberOfLines={2}>
              {item.title || 'Video'}
            </Text>
          </View>
        ) : (
          <View style={[styles.thumbnail, styles.photoPlaceholder]}>
            <Ionicons name="image" size={28} color="#666" />
          </View>
        )}

        {isVideo && (
          <View style={styles.durationBadge}>
            <Ionicons name="play" size={10} color="#fff" />
            <Text style={styles.durationText}>{item.duration || '0:00'}</Text>
          </View>
        )}

        <View style={styles.statsOverlay}>
          <View style={styles.stat}>
            <Ionicons name="eye" size={10} color="#fff" />
            <Text style={styles.statText}>{formatCount(item.views)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart" size={10} color="#ff4444" />
            <Text style={styles.statText}>{formatCount(item.likes)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your content...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={32} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Content</Text>
        <TouchableOpacity onPress={onUploadPress} style={styles.uploadBtn}>
          <Ionicons name="cloud-upload" size={18} color="#007AFF" />
          <Text style={styles.uploadText}>Upload</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="albums" size={14} color="#888" />
          <Text style={styles.statItemText}>{media.length} posts</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="eye" size={14} color="#888" />
          <Text style={styles.statItemText}>
            {media.reduce((sum, m) => sum + (parseInt(m.views) || 0), 0).toLocaleString()} views
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={14} color="#ff4444" />
          <Text style={styles.statItemText}>
            {media.reduce((sum, m) => sum + (parseInt(m.likes) || 0), 0).toLocaleString()} likes
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredMedia.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images" size={48} color="#444" />
          <Text style={styles.emptyText}>
            No {activeTab === 'all' ? '' : activeTab} content yet
          </Text>
          <TouchableOpacity onPress={onUploadPress} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Upload your first content</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredMedia}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Video Player Modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedItem(null)}
        >
          <View style={styles.modalContent}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedItem(null)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Video Player */}
            {selectedItem?.type === 'video' ? (
              <View style={styles.videoContainer}>
                {Platform.OS === 'web' ? (
                  <video
                    src={selectedItem?.uri}
                    controls
                    autoPlay
                    style={{
                      width: '100%',
                      height: width * 0.9 * 0.6,
                      backgroundColor: '#000',
                      borderRadius: 8,
                    }}
                    onError={(e) => console.error('Video error:', e)}
                  />
                ) : (
                  <View style={[styles.videoPlaceholder, { height: width * 0.9 * 0.6 }]}>
                    <Ionicons name="videocam" size={64} color="#666" />
                    <Text style={styles.modalTitle}>Video playback</Text>
                    <Text style={styles.modalCaption}>
                      Native video player not available on this platform
                    </Text>
                  </View>
                )}
              </View>
            ) : selectedItem?.thumbnail ? (
              <Image
                source={{ uri: selectedItem.thumbnail }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.modalImage, styles.videoPlaceholder]}>
                <Ionicons name="image" size={64} color="#666" />
                <Text style={styles.modalTitle}>
                  {selectedItem?.title || 'Photo'}
                </Text>
              </View>
            )}

            {/* Title & Info */}
            <View style={styles.modalInfo}>
              <Text style={styles.modalTitle}>
                {selectedItem?.title || 'Untitled'}
              </Text>
              {selectedItem?.caption && (
                <Text style={styles.modalCaption} numberOfLines={3}>
                  {selectedItem.caption}
                </Text>
              )}
            </View>

            {/* Stats */}
            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Ionicons name="eye" size={16} color="#fff" />
                <Text style={styles.modalStatText}>
                  {formatCount(selectedItem?.views || 0)}
                </Text>
              </View>
              <View style={styles.modalStat}>
                <Ionicons name="heart" size={16} color="#ff4444" />
                <Text style={styles.modalStatText}>
                  {formatCount(selectedItem?.likes || 0)}
                </Text>
              </View>
              <View style={styles.modalStat}>
                <Ionicons name="chatbubble" size={16} color="#fff" />
                <Text style={styles.modalStatText}>
                  {formatCount(selectedItem?.comments || 0)}
                </Text>
              </View>
              <View style={styles.modalStat}>
                <Ionicons name="share" size={16} color="#fff" />
                <Text style={styles.modalStatText}>
                  {formatCount(selectedItem?.shares || 0)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="heart-outline" size={20} color="#ff4444" />
                <Text style={styles.actionText}>Like</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                <Text style={styles.actionText}>Comment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function formatCount(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statItemText: {
    color: '#888',
    fontSize: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#222',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  grid: {
    paddingBottom: 24,
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.2,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  videoLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    gap: 6,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    marginTop: 12,
    fontSize: 14,
  },
  emptyBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: width * 0.95,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  videoContainer: {
    width: '100%',
    backgroundColor: '#000',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: width * 0.9 * 0.6,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalInfo: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCaption: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalStatText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222',
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
