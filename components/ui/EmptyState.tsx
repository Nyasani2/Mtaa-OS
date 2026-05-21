import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconSize?: number;
  iconColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  message,
  actionLabel,
  onAction,
  iconSize = 48,
  iconColor = '#CBD5E1',
}) => (
  <View style={styles.container}>
    <FontAwesome5 name={icon} size={iconSize} color={iconColor} />
    <Text style={styles.title}>{title}</Text>
    {message && <Text style={styles.message}>{message}</Text>}
    {actionLabel && onAction && (
      <TouchableOpacity style={styles.actionBtn} onPress={onAction}>
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, minHeight: 300 },
  title: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 16 },
  message: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  actionBtn: { marginTop: 20, backgroundColor: '#1E40AF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
