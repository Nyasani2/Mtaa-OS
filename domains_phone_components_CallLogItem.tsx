import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  // TODO: add props
}

export default function CallLogItem(props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>CallLogItem</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  text: { color: '#fff', fontSize: 14 },
});
