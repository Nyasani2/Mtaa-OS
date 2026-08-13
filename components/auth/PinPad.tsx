import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface PinPadProps {
  maxLength?: number;
  onSubmit: (pin: string) => void;
  onForgot?: () => void;
  showForgot?: boolean;
}

export function PinPad({
  maxLength = 6,
  onSubmit,
  onForgot,
  showForgot = true,
}: PinPadProps) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  const handleDigit = useCallback((digit: string) => {
    setPin((prev) => {
      if (prev.length >= maxLength) return prev;
      const next = prev + digit;
      if (next.length === maxLength) {
        setTimeout(() => onSubmit(next), 150);
      }
      return next;
    });
  }, [maxLength, onSubmit]);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
  }, []);

  const dots = Array.from({ length: maxLength }, (_, i) => (
    <View
      key={i}
      style={[
        styles.dot,
        i < pin.length && styles.dotFilled,
        shake && styles.dotError,
      ]}
    />
  ));

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>{dots}</View>

      <View style={styles.keypad}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return (
                  <View key={keyIndex} style={styles.keyPlaceholder}>
                    {showForgot && onForgot && (
                      <TouchableOpacity onPress={onForgot}>
                        <Text style={styles.forgotText}>Forgot?</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }

              if (key === '⌫') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.key}
                    onPress={handleBackspace}
                    onLongPress={handleClear}
                  >
                    <Text style={styles.keyText}>⌫</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.key}
                  onPress={() => handleDigit(key)}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: width * 0.85,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  dotError: {
    borderColor: '#ff4444',
    backgroundColor: '#ff4444',
  },
  keypad: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  keyPlaceholder: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  forgotText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});
