import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Animated, Text } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  videoUri: string;
  thumbnailUri?: string;
  postId: string;
  creatorId: string;
  isVisible?: boolean;
  style?: any;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export function PulseVideoPlayer({ videoUri, thumbnailUri, postId, creatorId, isVisible = true, style, autoPlay = true, loop = true, muted = false }: Props) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [isBuffering, setIsBuffering] = useState(true);
  const [isMuted, setIsMuted] = useState(muted);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isBuffering && status.isLoaded) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [isBuffering, status.isLoaded]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVisible && autoPlay) video.playAsync();
    else video.pauseAsync();
  }, [isVisible, autoPlay]);

  const handlePlaybackStatusUpdate = useCallback((playbackStatus: any) => {
    setStatus(playbackStatus);
    if (playbackStatus.isBuffering !== undefined) setIsBuffering(playbackStatus.isBuffering);
    if (playbackStatus.error) { setHasError(true); setIsBuffering(false); }
  }, []);

  const togglePlayPause = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (status.isPlaying) await video.pauseAsync();
    else await video.playAsync();
    showControlsTemporarily();
  }, [status.isPlaying]);

  const toggleMute = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    await video.setIsMutedAsync(newMuted);
    setIsMuted(newMuted);
    showControlsTemporarily();
  }, [isMuted]);

  const showControlsTemporarily = useCallback(() => {
    Animated.timing(controlsAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (status.isPlaying) Animated.timing(controlsAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }, 3000);
  }, [status.isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      videoRef.current?.unloadAsync();
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity activeOpacity={1} onPress={showControlsTemporarily} style={styles.videoWrapper}>
        <Animated.View style={[styles.videoContainer, { opacity: fadeAnim }]}>
          <Video ref={videoRef} source={{ uri: videoUri }} style={styles.video} resizeMode={ResizeMode.COVER}
            isLooping={loop} isMuted={isMuted} shouldPlay={isVisible && autoPlay}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate} useNativeControls={false}
            posterSource={thumbnailUri ? { uri: thumbnailUri } : undefined} posterStyle={styles.poster} usePoster={!!thumbnailUri} />
        </Animated.View>
        {isBuffering && !hasError && <View style={styles.overlay}><ActivityIndicator size="large" color="#e94560" /></View>}
        {hasError && <View style={styles.overlay}><Ionicons name="warning" size={40} color="#e94560" /></View>}
        <Animated.View style={[styles.controlsOverlay, { opacity: controlsAnim }]} pointerEvents={controlsAnim.__getValue() > 0.5 ? 'auto' : 'none'}>
          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            <Ionicons name={status.isPlaying ? 'pause' : 'play'} size={36} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={24} color="white" />
          </TouchableOpacity>
          {status.durationMillis > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(status.positionMillis / status.durationMillis) * 100}%` }]} />
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(status.positionMillis)}</Text>
                <Text style={styles.timeText}>{formatTime(status.durationMillis)}</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  videoContainer: { width: '100%', height: '100%' },
  video: { width: '100%', height: '100%' },
  poster: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  controlsOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  playButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  muteButton: { position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  progressContainer: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  progressBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#e94560' },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'monospace' },
});
