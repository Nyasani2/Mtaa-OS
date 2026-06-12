// domains/pulse/components/VideoPlayer.tsx
// MTAA Pulse — Video Player with Ad Injection
// Uses resolved_media_url from pulse_events (set by SQL trigger)

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
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
  video_url: string;        // Pass resolved_media_url directly
  thumbnail_url?: string;  // Pass resolved_thumbnail_url directly
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
  const videoRef = useRef<Video>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [playingAd, setPlayingAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [watchTime, setWatchTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [adSkipTimer, setAdSkipTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const watchStartRef = useRef<number>(0);
  const hasRecordedStart = useRef(false);

  // Load ads for this content
  useEffect(() => {
    loadAds();
  }, [content_id]);

  const loadAds = async () => {
    setAds([]);
  };

  // Validate video_url on mount
  useEffect(() => {
    if (!video_url) {
      setErrorMsg('No video URL available');
      setIsLoading(false);
    } else if (!video_url.startsWith('http')) {
      setErrorMsg('Invalid video URL: ' + video_url);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setErrorMsg(null);
    }
  }, [video_url]);

  const handlePlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setDuration(status.durationMillis / 1000);

      if (status.isPlaying && !hasRecordedStart.current) {
        hasRecordedStart.current = true;
        watchStartRef.current = Date.now();
        signalService.recordSignal(user_id, {
          content_id,
          action: 'watch_start',
          metadata: { position: status.positionMillis / 1000 },
        });
      }

      if (status.positionMillis) {
        const currentSeconds = status.positionMillis / 1000;
        setWatchTime(currentSeconds);
        onProgress?.(currentSeconds / (status.durationMillis / 1000));
      }

      if (status.didJustFinish) {
        const watchDuration = watchStartRef.current
          ? (Date.now() - watchStartRef.current) / 1000
          : 0;
        signalService.recordSignal(user_id, {
          content_id,
          action: 'watch_complete',
          duration: watchDuration,
        });
        onComplete?.();
      }
    }

    if (status.error) {
      setErrorMsg('Playback error: ' + status.error);
    }
  }, [content_id, user_id, onComplete, onProgress]);

  const handlePlayPress = useCallback(() => {
    if (ads.length > 0 && !playingAd) {
      const ad = ads[0];
      setPlayingAd(ad);
      setAdSkipTimer(ad.skip_after || ad.duration);

      const skipInterval = setInterval(() => {
        setAdSkipTimer(prev => {
          if (prev <= 1) {
            clearInterval(skipInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        setPlayingAd(null);
        setIsPlaying(true);
        clearInterval(skipInterval);
      }, ad.duration * 1000);

      signalService.recordSignal(user_id, {
        content_id,
        action: 'ad_click',
        metadata: { ad_id: ad.id },
      });
    } else {
      setIsPlaying(true);
    }
  }, [ads, playingAd, content_id, user_id]);

  const skipAd = useCallback(() => {
    if (adSkipTimer <= 0 && playingAd) {
      setPlayingAd(null);
      setIsPlaying(true);
    }
  }, [adSkipTimer, playingAd]);

  // Error state
  if (errorMsg) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Text style={styles.errorHint}>URL: {video_url || 'none'}</Text>
      </View>
    );
  }

  // No video URL
  if (!video_url) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorIcon}>🎬</Text>
        <Text style={styles.errorText}>No video available</Text>
      </View>
    );
  }

  // Ad player view
  if (playingAd) {
    return (
      <View style={[styles.container, style]}>
        <Video
          ref={videoRef}
          source={{ uri: playingAd.media_url }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
        />
        <View style={styles.adOverlay}>
          <Text style={styles.adLabel}>AD</Text>
          {adSkipTimer > 0 ? (
            <Text style={styles.skipText}>Skip in {adSkipTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={skipAd} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip Ad</Text>
            </TouchableOpacity>
          )}
          {playingAd.title && (
            <Text style={styles.adTitle}>{playingAd.title}</Text>
          )}
        </View>
      </View>
    );
  }

  // Main video player
  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri: video_url }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={isPlaying}
        isLooping={loop}
        usePoster
        posterSource={thumbnail_url ? { uri: thumbnail_url } : undefined}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {!isPlaying && !isLoading && (
        <TouchableOpacity
          style={styles.playOverlay}
          onPress={handlePlayPress}
          activeOpacity={0.8}
        >
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </TouchableOpacity>
      )}

      {duration > 0 && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(watchTime / duration) * 100}%` },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 16 / 9,
    padding: 20,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorText: {
    color: '#ff6b00',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorHint: {
    color: '#666',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  playOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 24,
    color: '#000',
    marginLeft: 4,
  },
  adOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  adLabel: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff6b00',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  skipText: {
    alignSelf: 'flex-end',
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  skipButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  skipButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  adTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6b00',
  },
});
