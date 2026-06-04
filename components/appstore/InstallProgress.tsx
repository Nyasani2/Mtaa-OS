import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface InstallProgressProps {
  appName: string;
  appSize: string;
  progress: number; // 0-100
  status: 'downloading' | 'installing' | 'complete' | 'error';
  onCancel: () => void;
  onOpen?: () => void;
}

export function InstallProgress({ appName, appSize, progress, status, onCancel, onOpen }: InstallProgressProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    Animated.timing(animatedOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const getStatusText = () => {
    switch (status) {
      case 'downloading': return `Downloading ${appSize}...`;
      case 'installing': return 'Installing...';
      case 'complete': return 'Installation complete!';
      case 'error': return 'Installation failed';
      default: return 'Processing...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'downloading': return '#4ECDC4';
      case 'installing': return '#FFD700';
      case 'complete': return '#4ECDC4';
      case 'error': return '#FF6B6B';
      default: return '#4ECDC4';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'downloading': return 'download-cloud';
      case 'installing': return 'loader';
      case 'complete': return 'check-circle';
      case 'error': return 'alert-circle';
      default: return 'loader';
    }
  };

  const progressWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: animatedOpacity }]}>
      <View style={styles.card}>
        {/* Status Icon */}
        <View style={[styles.iconContainer, { backgroundColor: getStatusColor() + '20' }]}>
          <Feather name={getStatusIcon() as any} size={28} color={getStatusColor()} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.appName}>{appName}</Text>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        {/* Action */}
        {status === 'complete' && onOpen ? (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4ECDC4' }]} onPress={onOpen}>
            <Text style={styles.actionButtonText}>Open</Text>
          </TouchableOpacity>
        ) : status === 'error' ? (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]} onPress={onCancel}>
            <Text style={styles.actionButtonText}>Retry</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Feather name="x" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBarFill, { width: progressWidth, backgroundColor: getStatusColor() }]} />
      </View>

      {/* Progress Text */}
      <View style={styles.progressMeta}>
        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        <Text style={styles.progressSize}>{appSize}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  appName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
  actionButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#121212',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressPercent: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  progressSize: {
    color: '#666',
    fontSize: 12,
  },
});
