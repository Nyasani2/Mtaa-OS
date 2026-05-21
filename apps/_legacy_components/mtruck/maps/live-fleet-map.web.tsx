import React from 'react';
import { View, Text } from 'react-native';

export default function LiveFleetMap() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Text
        style={{
          color: '#888',
          fontSize: 16,
          textAlign: 'center',
        }}
      >
        Fleet Map is available only on Android and iOS.
      </Text>
    </View>
  );
}
