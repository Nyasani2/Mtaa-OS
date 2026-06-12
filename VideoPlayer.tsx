// domains/pulse/components/VideoPlayer.tsx
// MTAA Pulse — Video Player (Web + Native Compatible)
// Uses resolved_media_url from pulse_events (set by SQL trigger)

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text, Platform } from 'react-native';
import { signalService } from '../services/signalService';

interface Ad {
  id: string;
  media_url: string;
  duration: number;
  title?: string;
  advertiser?: string;
  skip_after?: number;
}

interface VideoPlayerProps {
  content_id: string;
  video_url: string;
  thumbnail_url?: string;
  user_id: string;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}

export default function VideoPlayer({
  content_id,
  video_url,
  thumbnail_url,
  user_id,
  autoPlay = false,
  loop = false,
  style,
  onComplete,
  onProgress,
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Web video element handling
  useEffect(() => {
    if (Platform.OS !== 'web' || !videoRef.current) return;

    const video = videoRef.current;

    const handleLoaded = () => setIsLoading(false);
    const handleError = () => setError('Failed to load video');
    const handleEnded = () => {
      onComplete?.();
      if (loop) {
        video.play();
      }
    };
    const handleTimeUpdate = () => {
      if (video.duration) {
        const pct = video.currentTime / video.duration;
        setProgress(pct);
        onProgress?.(pct);
      }
    };

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    if (autoPlay) {
      video.play().catch(() => setIsPlaying(false));
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [video_url, autoPlay, loop, onComplete, onProgress]);

  // Record view signal
  useEffect(() => {
    if (!isLoading && isPlaying) {
      signalService.recordSignal(user_id, {
        action: 'video_view',
        content_id,
        metadata: { video_url },
      });
    }
  }, [isLoading, isPlaying, user_id, content_id, video_url]);

  const togglePlay = useCallback(() => {
    if (Platform.OS !== 'web' || !videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>Video unavailable</Text>
      </View>
    );
  }

  // Web: Use HTML5 video element
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        {isLoading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        <video
          ref={videoRef as any}
          src={video_url}
          poster={thumbnail_url}
          style={styles.video as any}
          playsInline
          muted={autoPlay}
          loop={loop}
          onClick={togglePlay}
        />
        <TouchableOpacity style={styles.playOverlay} onPress={togglePlay}>
          {!isPlaying && !isLoading && (
            <View style={styles.playButton}>
              <Text style={styles.playText}>▶</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    );
  }

  // Native: Fallback message (expo-av removed)
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.errorText}>Video playback requires native build</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: 9 / 16,
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    color: '#fff',
    fontSize: 24,
    marginLeft: 4,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    padding: 20,
  },
});
