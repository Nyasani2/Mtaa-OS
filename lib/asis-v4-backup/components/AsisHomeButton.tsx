import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface AsisHomeButtonProps {
  onPress: () => void;
  unreadCount?: number;
}

export const AsisHomeButton: React.FC<AsisHomeButtonProps> = ({ onPress, unreadCount = 0 }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.icon}>🧠</Text>
      {unreadCount > 0 && (
        <Text style={styles.badge}>{unreadCount}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: { fontSize: 28 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
