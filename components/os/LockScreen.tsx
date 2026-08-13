import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { UnlockScreen } from './UnlockScreen';

const { width, height } = Dimensions.get('window');

export function LockScreen() {
  const isAppLocked = useAuthStore((s) => s.isAppLocked);
  const [showUnlock, setShowUnlock] = React.useState(false);
  const lastTapRef = useRef<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTapRef.current;
    lastTapRef.current = now;

    if (delta < 300) {
      // Double tap detected — pulse animation then show unlock
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowUnlock(true);
      });
    }
  }, []);

  const handleUnlockSuccess = () => {
    setShowUnlock(false);
    useAuthStore.getState().unlockApp();
  };

  const handleUnlockCancel = () => {
    setShowUnlock(false);
  };

  if (!isAppLocked) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDoubleTap}
          style={styles.tapArea}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
          <Text style={styles.title}>MTAA LOCKED</Text>
          <Text style={styles.subtitle}>Double tap to unlock</Text>
          <Text style={styles.hint}>
            Your session is secure. Authenticate to continue.
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {showUnlock && (
        <UnlockScreen
          onSuccess={handleUnlockSuccess}
          onCancel={handleUnlockCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapArea: {
    width: width * 0.8,
    height: height * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  lockIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    maxWidth: 240,
    marginTop: 32,
  },
});
