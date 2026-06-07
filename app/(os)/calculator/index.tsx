// app/(os)/calculator/index.tsx — MTAA OS Calculator
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

export default function CalculatorScreen() {
  const router = useRouter();
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [newNum, setNewNum] = useState(true);

  const press = (val: string) => {
    if (val === 'C') { setDisplay('0'); setPrev(null); setOp(null); setNewNum(true); return; }
    if (val === '±') { setDisplay(String(Number(display) * -1)); return; }
    if (val === '%') { setDisplay(String(Number(display) / 100)); return; }
    if (['+', '-', '×', '÷'].includes(val)) { setPrev(display); setOp(val); setNewNum(true); return; }
    if (val === '=') {
      if (!prev || !op) return;
      const a = Number(prev), b = Number(display);
      let res = 0;
      if (op === '+') res = a + b;
      if (op === '-') res = a - b;
      if (op === '×') res = a * b;
      if (op === '÷') res = b !== 0 ? a / b : 0;
      setDisplay(String(res).slice(0, 12));
      setPrev(null); setOp(null); setNewNum(true);
      return;
    }
    if (newNum) { setDisplay(val); setNewNum(false); }
    else { setDisplay(display === '0' ? val : (display + val).slice(0, 12)); }
  };

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calculator</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.displayWrap}>
        <Text style={styles.display}>{display}</Text>
      </View>
      <View style={styles.pad}>
        {buttons.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map(btn => (
              <TouchableOpacity
                key={btn}
                style={[styles.btn, btn === '0' && styles.btnWide, ['+', '-', '×', '÷', '='].includes(btn) && styles.btnOp, ['C', '±', '%'].includes(btn) && styles.btnGray]}
                onPress={() => press(btn)}
              >
                <Text style={[styles.btnText, ['+', '-', '×', '÷', '='].includes(btn) && styles.btnTextWhite]}>{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.md, paddingTop: SIZES.xl, paddingBottom: SIZES.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  displayWrap: { flex: 1, justifyContent: 'flex-end', padding: SIZES.lg },
  display: { fontFamily: FONTS.bold, fontSize: 64, color: COLORS.text, textAlign: 'right' },
  pad: { padding: SIZES.md, paddingBottom: SIZES.xl },
  row: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.sm },
  btn: { flex: 1, aspectRatio: 1, borderRadius: SIZES.md, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  btnWide: { flex: 2.1, aspectRatio: undefined },
  btnOp: { backgroundColor: COLORS.primary },
  btnGray: { backgroundColor: '#3A3A3C' },
  btnText: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.text },
  btnTextWhite: { color: '#fff' },
});
