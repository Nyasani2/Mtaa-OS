import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

const SUBLABELS: Record<string, string> = {
  '1': '', '2': 'ABC', '3': 'DEF',
  '4': 'GHI', '5': 'JKL', '6': 'MNO',
  '7': 'PQRS', '8': 'TUV', '9': 'WXYZ',
  '*': '', '0': '+', '#': '',
};

interface Props {
  onPress: (digit: string) => void;
  onLongPress?: (digit: string) => void;
}

export function DialerPad({ onPress, onLongPress }: Props) {
  return (
    <View style={styles.container}>
      {KEYS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.key}
              onPress={() => onPress(key)}
              onLongPress={() => onLongPress?.(key)}
              activeOpacity={0.6}
            >
              <Text style={styles.keyText}>{key}</Text>
              {SUBLABELS[key] ? (
                <Text style={styles.subLabel}>{SUBLABELS[key]}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  key: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 32, fontWeight: '400', color: '#000' },
  subLabel: { fontSize: 10, color: '#8E8E93', marginTop: -4 },
});
