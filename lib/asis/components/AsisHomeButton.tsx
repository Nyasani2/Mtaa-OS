import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAsis } from '../hooks/useAsis';

const { width, height } = Dimensions.get('window');

interface AsisHomeButtonProps {
  userId: string;
  size?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function AsisHomeButton({ userId, size = 56, position = 'bottom-right' }: AsisHomeButtonProps) {
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showTooltip, setShowTooltip] = useState(false);

  // Pulse animation for attention
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePress = useCallback(() => {
    router.push('/(os)/asis');
  }, [router]);

  const handleLongPress = useCallback(() => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);
  }, []);

  const positionStyles = {
    'bottom-right': { bottom: 24, right: 24 },
    'bottom-left': { bottom: 24, left: 24 },
    'top-right': { top: 24, right: 24 },
    'top-left': { top: 24, left: 24 },
  };

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          positionStyles[position],
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isPressed ? '#1a5fb4' : '#3584e4',
              shadowColor: isPressed ? '#1a5fb4' : '#3584e4',
            },
          ]}
          activeOpacity={0.8}
        >
          {/* ASIS Icon - Neural Network Brain Symbol */}
          <View style={styles.iconContainer}>
            <View style={styles.brainOuter}>
              <View style={styles.brainInner}>
                <View style={styles.nodeCenter} />
                <View style={[styles.node, styles.nodeTop]} />
                <View style={[styles.node, styles.nodeBottom]} />
                <View style={[styles.node, styles.nodeLeft]} />
                <View style={[styles.node, styles.nodeRight]} />
                <View style={[styles.connection, styles.connTop]} />
                <View style={[styles.connection, styles.connBottom]} />
                <View style={[styles.connection, styles.connLeft]} />
                <View style={[styles.connection, styles.connRight]} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Tooltip */}
        {showTooltip && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>Tap to chat with ASIS</Text>
            <View style={styles.tooltipArrow} />
          </View>
        )}
      </Animated.View>

      {/* Badge for new notifications/insights */}
      <View style={[styles.badge, positionStyles[position]]}>
        <Text style={styles.badgeText}>AI</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainOuter: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainInner: {
    width: 28,
    height: 28,
    position: 'relative',
  },
  nodeCenter: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  node: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
  nodeTop: { top: 2, left: 12 },
  nodeBottom: { bottom: 2, left: 12 },
  nodeLeft: { top: 12, left: 2 },
  nodeRight: { top: 12, right: 2 },
  connection: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#ffffff',
    opacity: 0.6,
  },
  connTop: { top: 6, left: 14, width: 0, height: 6 }, // vertical
  connBottom: { bottom: 6, left: 14, width: 0, height: 6 },
  connLeft: { top: 14, left: 6, width: 6, height: 0 },
  connRight: { top: 14, right: 6, width: 6, height: 0 },
  tooltip: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    backgroundColor: '#1c1c1c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 140,
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1c1c1c',
  },
  badge: {
    position: 'absolute',
    backgroundColor: '#ff453a',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default AsisHomeButton;
