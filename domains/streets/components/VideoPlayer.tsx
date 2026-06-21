import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  style?: any;
  autoPlay?: boolean;
  showControls?: boolean;
  resizeMode?: ResizeMode;
}

export default function VideoPlayer({
  uri,
  style,
  autoPlay = false,
  showControls = true,
  resizeMode = ResizeMode.COVER,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaybackStatusUpdate = useCallback((newStatus: any) => {
    setStatus(newStatus);
    if (newStatus.isLoaded) {
      setIsLoading(false);
      setError(null);
    }
    if (newStatus.error) {
      setError('Failed to load video');
      setIsLoading(false);
    }
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const handleError = useCallback((err: any) => {
    console.error('Video error:', err);
    setError('Failed to load video');
    setIsLoading(false);
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

  const isPlaying = status.isPlaying;

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={resizeMode}
        isLooping
        shouldPlay={autoPlay}
        isMuted={isMuted}
        useNativeControls={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onLoadStart={handleLoadStart}
        onError={handleError}
      />

      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {showControls && !isLoading && (
        <>
          {/* Play/Pause Overlay */}
          <TouchableOpacity
            style={styles.playOverlay}
            onPress={togglePlayPause}
            activeOpacity={0.8}
          >
            {!isPlaying && (
              <View style={styles.playButton}>
                <Play size={32} color="#fff" fill="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Controls Bar */}
          <View style={styles.controlsBar}>
            <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
              {isPlaying ? (
                <Pause size={20} color="#fff" />
              ) : (
                <Play size={20} color="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
              {isMuted ? (
                <VolumeX size={20} color="#fff" />
              ) : (
                <Volume2 size={20} color="#fff" />
              )}
            </TouchableOpacity>

            {status.durationMillis && (
              <Text style={styles.timeText}>
                {formatTime(status.positionMillis || 0)} / {formatTime(status.durationMillis)}
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

function formatTime(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlButton: {
    padding: 8,
    marginRight: 12,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 'auto',
  },
  errorContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#999',
    fontSize: 14,
  },
});
