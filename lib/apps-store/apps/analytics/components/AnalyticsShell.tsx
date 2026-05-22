import React from 'react';
import { View, StyleSheet } from 'react-native';

interface AnalyticsShellProps {
  children: React.ReactNode;
  title?: string;
}

const AnalyticsShell: React.FC<AnalyticsShellProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default AnalyticsShell;
