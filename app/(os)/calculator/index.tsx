import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CalculatorScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Calculate responsive button size
  // Available height = screen height - safe areas - display area
  const availableHeight = height - insets.top - insets.bottom - 120; // 120 for display
  const availableWidth = width - insets.left - insets.right - 24; // 24 for padding

  // Button grid: 4 columns, 5 rows, with gaps
  const gap = 10;
  const cols = 4;
  const rows = 5;
  const buttonSize = Math.min(
    (availableWidth - gap * (cols - 1)) / cols,
    (availableHeight - gap * (rows - 1)) / rows
  );

  // Ensure minimum readable size
  const finalButtonSize = Math.max(Math.min(buttonSize, 85), 55);
  const fontSize = Math.max(finalButtonSize * 0.35, 20);
  const displayFontSize = Math.min(width * 0.18, 72);

  const inputNumber = useCallback((num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, waitingForOperand]);

  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const clear = useCallback(() => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const toggleSign = useCallback(() => {
    const value = parseFloat(display);
    if (value !== 0) {
      setDisplay(String(-value));
    }
  }, [display]);

  const percentage = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  }, [display]);

  const performOperation = useCallback((nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(display);
    } else if (operator) {
      const currentValue = parseFloat(prevValue);
      let newValue: number;

      switch (operator) {
        case '+': newValue = currentValue + inputValue; break;
        case '-': newValue = currentValue - inputValue; break;
        case '×': newValue = currentValue * inputValue; break;
        case '÷': newValue = inputValue !== 0 ? currentValue / inputValue : 0; break;
        default: newValue = inputValue;
      }

      const result = String(newValue);
      setPrevValue(result);
      setDisplay(result);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  }, [display, prevValue, operator]);

  const calculate = useCallback(() => {
    if (!operator || prevValue === null) return;

    const inputValue = parseFloat(display);
    const currentValue = parseFloat(prevValue);
    let newValue: number;

    switch (operator) {
      case '+': newValue = currentValue + inputValue; break;
      case '-': newValue = currentValue - inputValue; break;
      case '×': newValue = currentValue * inputValue; break;
      case '÷': newValue = inputValue !== 0 ? currentValue / inputValue : 0; break;
      default: newValue = inputValue;
    }

    const result = String(newValue);
    setHistory(prev => [...prev.slice(-4), `${prevValue} ${operator} ${display} = ${result}`]);
    setDisplay(result);
    setOperator(null);
    setPrevValue(null);
    setWaitingForOperand(true);
  }, [display, prevValue, operator]);

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  const getButtonStyle = (btn: string) => {
    const base = [styles.button, { width: finalButtonSize, height: finalButtonSize, borderRadius: finalButtonSize / 2 }];
    if (['÷', '×', '-', '+', '='].includes(btn)) return [...base, styles.operatorButton];
    if (['C', '±', '%'].includes(btn)) return [...base, styles.functionButton];
    if (btn === '0') return [...base, styles.zeroButton, { width: finalButtonSize * 2 + gap }];
    return [...base, styles.numberButton];
  };

  const getTextStyle = (btn: string) => {
    const base = { fontSize };
    if (['÷', '×', '-', '+', '='].includes(btn)) return [styles.operatorText, base];
    if (['C', '±', '%'].includes(btn)) return [styles.functionText, base];
    return [styles.numberText, base];
  };

  const handlePress = (btn: string) => {
    if (btn >= '0' && btn <= '9') inputNumber(btn);
    else if (btn === '.') inputDecimal();
    else if (btn === 'C') clear();
    else if (btn === '±') toggleSign();
    else if (btn === '%') percentage();
    else if (btn === '=') calculate();
    else if (['+', '-', '×', '÷'].includes(btn)) performOperation(btn);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* History */}
      {history.length > 0 && (
        <View style={styles.historyContainer}>
          {history.map((h, i) => (
            <Text key={i} style={styles.historyText}>{h}</Text>
          ))}
        </View>
      )}

      {/* Display */}
      <View style={styles.display}>
        <Text 
          style={[styles.displayText, { fontSize: displayFontSize }]} 
          numberOfLines={1} 
          adjustsFontSizeToFit
        >
          {display}
        </Text>
      </View>

      {/* Buttons */}
      <View style={[styles.buttonContainer, { gap }]}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={[styles.row, { gap }]}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                style={getButtonStyle(btn)}
                onPress={() => handlePress(btn)}
                activeOpacity={0.7}
              >
                <Text style={getTextStyle(btn)}>{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0a0a', 
    justifyContent: 'flex-end',
  },

  historyContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: 'flex-end',
    maxHeight: 80,
  },
  historyText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 2,
  },

  display: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 100,
  },
  displayText: { 
    color: '#fff', 
    fontWeight: '300',
    textAlign: 'right',
  },

  buttonContainer: { 
    paddingHorizontal: 12, 
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
  },

  button: {
    alignItems: 'center', 
    justifyContent: 'center',
  },
  zeroButton: { 
    alignItems: 'flex-start', 
    paddingLeft: 28,
  },

  numberButton: { backgroundColor: '#333' },
  operatorButton: { backgroundColor: '#E91E63' },
  functionButton: { backgroundColor: '#a5a5a5' },

  numberText: { color: '#fff', fontWeight: '500' },
  operatorText: { color: '#fff', fontWeight: '500' },
  functionText: { color: '#0a0a0a', fontWeight: '600' },
});
