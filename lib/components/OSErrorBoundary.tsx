import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class OSErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Something went wrong.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#ef4444', fontSize: 16 },
});
