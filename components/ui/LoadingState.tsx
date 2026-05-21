import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  color = '#1E40AF',
  fullScreen = true,
}) => {
  const containerStyle = fullScreen ? styles.fullScreen : styles.inline;
  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20 },
  inline: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
  message: { marginTop: 16, fontSize: 14, color: '#64748B', fontWeight: '500' },
});
