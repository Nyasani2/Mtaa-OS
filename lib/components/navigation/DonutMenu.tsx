// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DonutItem {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface DonutMenuProps {
  items: DonutItem[];
  centerIcon?: string;
  centerColor?: string;
}

const { width } = Dimensions.get('window');

export default function DonutMenu({ items, centerIcon = 'add', centerColor = '#3b82f6' }: DonutMenuProps) {
  const [open, setOpen] = useState(false);
  const rotation = new Animated.Value(0);

  const toggle = () => {
    Animated.spring(rotation, {
      toValue: open ? 0 : 1,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
    setOpen(!open);
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // Position items in a circle
  const radius = 90;
  const getPositions = () => {
    const positions: { x: number; y: number }[] = [];
    const angleStep = (2 * Math.PI) / items.length;
    items.forEach((_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      positions.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    });
    return positions;
  };

  const positions = getPositions();

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Radial Items */}
      {items.map((item, i) => {
        const pos = positions[i];
        return (
          <Animated.View
            key={item.label}
            style={[
              styles.itemWrapper,
              {
                transform: [
                  { translateX: open ? pos.x : 0 },
                  { translateY: open ? pos.y : 0 },
                  { scale: open ? 1 : 0 },
                ],
                opacity: open ? 1 : 0,
              },
            ]}
            pointerEvents={open ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={[styles.itemBtn, { backgroundColor: item.color }]}
              onPress={() => {
                item.onPress();
                toggle();
              }}
            >
              <Ionicons name={item.icon as any} size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.labelBadge}>
              <Text style={styles.labelText}>{item.label}</Text>
            </View>
          </Animated.View>
        );
      })}

      {/* Center FAB */}
      <TouchableOpacity style={[styles.centerBtn, { backgroundColor: centerColor }]} onPress={toggle}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name={centerIcon as any} size={28} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  itemWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  itemBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  labelBadge: {
    position: 'absolute',
    top: -20,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  labelText: { color: '#fff', fontSize: 10, fontWeight: '600' },
});
