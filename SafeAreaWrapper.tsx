import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: any;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export default function SafeAreaWrapper({ children, style, edges = ['top', 'bottom'] }: SafeAreaWrapperProps) {
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.container, padding, style]}>
      <StatusBar barStyle="dark-content" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
