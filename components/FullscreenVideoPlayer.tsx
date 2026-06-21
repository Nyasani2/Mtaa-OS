import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullscreenVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  isVisible: boolean;
  onClose: () => void;
  autoPlay?: boolean;
}

export default function FullscreenVideoPlayer({
  videoUrl,
  thumbnailUrl,
  isVisible,
  onClose,
  autoPlay = true,
}: FullscreenVideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const handlePlaybackStatusUpdate = useCallback((newStatus: any) => {
    setStatus(newStatus);
    if (newStatus.isLoaded) {
      setIsLoading(false);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;

    if (status.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  }, [status.isPlaying]);

  const toggleMute = useCallback(async () => {
    if (!videoRef.current) return;

    await videoRef.current.setIsMutedAsync(!isMuted);
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleSeek = useCallback(async (direction: 'forward' | 'backward') => {
    if (!videoRef.current || !status.positionMillis) return;

    const seekAmount = 10000; // 10 seconds
    const newPosition = direction === 'forward' 
      ? status.positionMillis + seekAmount 
      : Math.max(0, status.positionMillis - seekAmount);

    await videoRef.current.setPositionAsync(newPosition);
  }, [status.positionMillis]);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = status.durationMillis 
    ? (status.positionMillis / status.durationMillis) 
    : 0;

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Video */}
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setShowControls(!showControls)}
          style={styles.videoContainer}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            shouldPlay={autoPlay}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            useNativeControls={false}
          />

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {/* Center Play/Pause Button */}
          {showControls && !isLoading && (
            <TouchableOpacity 
              style={styles.centerButton}
              onPress={togglePlayPause}
            >
              <Ionicons 
                name={status.isPlaying ? "pause-circle" : "play-circle"} 
                size={64} 
                color="rgba(255,255,255,0.9)" 
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Bottom Controls */}
        {showControls && (
          <View style={styles.controlsContainer}>
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>

            {/* Time & Controls */}
            <View style={styles.controlsRow}>
              <Text style={styles.timeText}>
                {formatTime(status.positionMillis || 0)} / {formatTime(status.durationMillis || 0)}
              </Text>

              <View style={styles.controlButtons}>
                <TouchableOpacity onPress={() => handleSeek('backward')}>
                  <Ionicons name="play-back" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={togglePlayPause}>
                  <Ionicons 
                    name={status.isPlaying ? "pause" : "play"} 
                    size={28} 
                    color="#fff" 
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleSeek('forward')}>
                  <Ionicons name="play-forward" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleMute}>
                  <Ionicons 
                    name={isMuted ? "volume-mute" : "volume-high"} 
                    size={24} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  centerButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
});
