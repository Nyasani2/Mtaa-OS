// @ts-nocheck
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  posterUri?: string;
  shouldPlay?: boolean;
  isLooping?: boolean;
  onPlaybackStatusUpdate?: (status: any) => void;
}

export default function VideoPlayer({ uri, posterUri, shouldPlay = false, isLooping = false, onPlaybackStatusUpdate }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(shouldPlay);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) { await videoRef.current.pauseAsync(); } 
    else { await videoRef.current.playAsync(); }
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        useNativeControls={false}
        resizeMode="contain"
        shouldPlay={shouldPlay}
        isLooping={isLooping}
        onPlaybackStatusUpdate={(status) => { if (onPlaybackStatusUpdate) onPlaybackStatusUpdate(status); }}
      />
      {isPlaying === false && (
        <TouchableOpacity style={styles.playOverlay} onPress={togglePlay} activeOpacity={0.7}>
          <Ionicons name="play-circle" size={64} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', backgroundColor: '#000' },
  video: { width: '100%', height: undefined, aspectRatio: 16 / 9 },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
});