// app/(utility)/calculator/index.tsx
// MTAA Calculator

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function CalculatorScreen() {
  const router = useRouter();
  const [display, setDisplay] = useState('0');

  const handlePress = (value: string) => {
    if (value === 'C') {
      setDisplay('0');
    } else if (value === '=') {
      try {
         
        setDisplay(String(eval(display)));
      } catch {
        setDisplay('Error');
      }
    } else {
      setDisplay(display === '0' ? value : display + value);
    }
  };

  const buttons = [
    ['C', '(', ')', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', ''],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.display}>
        <Text style={styles.displayText} numberOfLines={1}>{display}</Text>
      </View>

      <View style={styles.keypad}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn, btnIndex) => (
              btn ? (
                <TouchableOpacity
                  key={btnIndex}
                  style={[
                    styles.button,
                    ['C', '(', ')', '/'].includes(btn) && styles.operatorBtn,
                    btn === '=' && styles.equalsBtn,
                  ]}
                  onPress={() => handlePress(btn)}
                >
                  <Text style={[
                    styles.buttonText,
                    ['C', '(', ')', '/'].includes(btn) && styles.operatorText,
                    btn === '=' && styles.equalsText,
                  ]}>{btn}</Text>
                </TouchableOpacity>
              ) : <View key={btnIndex} style={styles.button} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  display: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 24,
  },
  displayText: { color: '#fff', fontSize: 64, fontWeight: '300' },
  keypad: { padding: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorBtn: { backgroundColor: '#FF9500' },
  equalsBtn: { backgroundColor: '#34C759' },
  buttonText: { color: '#fff', fontSize: 28 },
  operatorText: { color: '#fff', fontSize: 24 },
  equalsText: { color: '#fff', fontSize: 28, fontWeight: '700' },
});
