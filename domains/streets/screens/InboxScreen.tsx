import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InboxList } from '../components/InboxList';

export default function InboxScreen() {
  return (
    <View style={styles.container}>
      <InboxList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
