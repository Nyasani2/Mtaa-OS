import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = (width - 48) / 4;

export default function CalculatorScreen() {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperator: string) => {
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

      setPrevValue(String(newValue));
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = () => {
    if (!operator || prevValue === null) return;
    performOperation('=');
    setOperator(null);
    setPrevValue(null);
  };

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  const getButtonStyle = (btn: string) => {
    if (['÷', '×', '-', '+', '='].includes(btn)) return [styles.button, styles.operatorButton];
    if (['C', '±', '%'].includes(btn)) return [styles.button, styles.functionButton];
    if (btn === '0') return [styles.button, styles.zeroButton];
    return [styles.button, styles.numberButton];
  };

  const getTextStyle = (btn: string) => {
    if (['÷', '×', '-', '+', '='].includes(btn)) return styles.operatorText;
    if (['C', '±', '%'].includes(btn)) return styles.functionText;
    return styles.numberText;
  };

  const handlePress = (btn: string) => {
    if (btn >= '0' && btn <= '9') inputNumber(btn);
    else if (btn === '.') inputDecimal();
    else if (btn === 'C') clear();
    else if (btn === '=') calculate();
    else if (['+', '-', '×', '÷'].includes(btn)) performOperation(btn);
  };

  return (
    <View style={styles.container}>
      {/* Display */}
      <View style={styles.display}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                style={getButtonStyle(btn)}
                onPress={() => handlePress(btn)}
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
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'flex-end' },
  display: {
    paddingHorizontal: 24, paddingVertical: 40,
    alignItems: 'flex-end', justifyContent: 'center',
  },
  displayText: { color: '#fff', fontSize: 72, fontWeight: '300' },

  buttonContainer: { paddingHorizontal: 12, paddingBottom: 30 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },

  button: {
    width: BUTTON_SIZE, height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  zeroButton: { width: BUTTON_SIZE * 2 + 12, alignItems: 'flex-start', paddingLeft: 28 },

  numberButton: { backgroundColor: '#333' },
  operatorButton: { backgroundColor: '#E91E63' },
  functionButton: { backgroundColor: '#a5a5a5' },

  numberText: { color: '#fff', fontSize: 28, fontWeight: '500' },
  operatorText: { color: '#fff', fontSize: 32, fontWeight: '500' },
  functionText: { color: '#0a0a0a', fontSize: 24, fontWeight: '500' },
});
