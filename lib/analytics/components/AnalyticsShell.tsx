import React from 'react';
import { View, StyleSheet } from 'react-native';

interface AnalyticsShellProps {
  children?: React.ReactNode;
  title?: string;
}

export const AnalyticsShell: React.FC<AnalyticsShellProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

export default AnalyticsShell;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
