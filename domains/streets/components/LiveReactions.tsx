import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const REACTIONS = [
  { icon: 'heart', color: '#ff3040', label: 'Love' },
  { icon: 'flame', color: '#ff6600', label: 'Fire' },
  { icon: 'happy', color: '#ffcc00', label: 'Haha' },
  { icon: 'sad', color: '#00ccff', label: 'Sad' },
  { icon: 'thumbs-up', color: '#00ff88', label: 'Like' },
];

interface LiveReactionsProps {
  onReaction: (type: string) => void;
}

export default function LiveReactions({ onReaction }: LiveReactionsProps) {
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; type: string; color: string; anim: Animated.Value }[]>([]);
  const idRef = useRef(0);

  const triggerReaction = useCallback((type: string, color: string) => {
    onReaction(type);
    const id = idRef.current++;
    const anim = new Animated.Value(0);
    setFloatingReactions(prev => [...prev, { id, type, color, anim }]);

    Animated.timing(anim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    });
  }, [onReaction]);

  return (
    <View style={{ position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center' }}>
      {/* Floating reactions */}
      {floatingReactions.map(r => (
        <Animated.View
          key={r.id}
          style={{
            position: 'absolute',
            bottom: 40,
            transform: [
              { translateY: r.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -300] }) },
              { translateX: r.anim.interpolate({ inputRange: [0, 1], outputRange: [0, (Math.random() - 0.5) * 200] }) },
              { scale: r.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.5, 0.5] }) },
              { opacity: r.anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }) },
            ],
          }}
        >
          <Ionicons name={r.type as any} size={32} color={r.color} />
        </Animated.View>
      ))}

      {/* Reaction buttons */}
      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 28, paddingHorizontal: 8, paddingVertical: 6 }}>
        {REACTIONS.map(r => (
          <TouchableOpacity
            key={r.icon}
            onPress={() => triggerReaction(r.icon, r.color)}
            style={{ paddingHorizontal: 10, paddingVertical: 4 }}
          >
            <Ionicons name={r.icon as any} size={24} color={r.color} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
