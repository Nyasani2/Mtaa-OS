import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light' | 'dark';
  statusBarColor?: string;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children, backgroundColor = '#F8FAFC', statusBarStyle = 'dark', statusBarColor = '#FFFFFF',
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { backgroundColor, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle={statusBarStyle === 'dark' ? 'dark-content' : 'light-content'} backgroundColor={statusBarColor} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 } });
