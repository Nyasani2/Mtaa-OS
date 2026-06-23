import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';

interface VideoPlayerProps {
  uri: string;
  isVisible?: boolean;
}

export default function VideoPlayer({ uri, isVisible = true }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !videoRef.current) return;
    if (isVisible) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isVisible]);

  if (Platform.OS !== 'web') {
    // Native: Use expo-av Video (already installed in your project)
    try {
      const { Video } = require('expo-av');
      return (
        <Video
          source={{ uri }}
          style={styles.video}
          resizeMode="cover"
          isLooping
          shouldPlay={isVisible}
          isMuted={false}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
        />
      );
    } catch {
      return (
        <View style={[styles.video, styles.fallback]}>
          <ActivityIndicator color="#fff" />
        </View>
      );
    }
  }

  // Web: Native HTML5 video
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
      {error ? (
        <View style={styles.fallback}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <video
          ref={videoRef}
          src={uri}
          style={styles.video}
          muted
          loop
          playsInline
          autoPlay={isVisible}
          onLoadedData={() => setLoading(false)}
          onError={() => setError(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
});
