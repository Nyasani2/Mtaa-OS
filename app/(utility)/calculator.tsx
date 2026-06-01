import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CalculatorScreen() {
  const [display, setDisplay] = useState("0");
  const [previous, setPrevious] = useState("");
  const [operator, setOperator] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handlePress = (value: string) => {
    if (value === "C") {
      setDisplay("0");
      setPrevious("");
      setOperator("");
      return;
    }
    if (value === "⌫") {
      setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
      return;
    }
    if (["+", "-", "×", "÷"].includes(value)) {
      setPrevious(display);
      setOperator(value);
      setDisplay("0");
      return;
    }
    if (value === "=") {
      if (!previous || !operator) return;
      const a = parseFloat(previous);
      const b = parseFloat(display);
      let result = 0;
      switch (operator) {
        case "+": result = a + b; break;
        case "-": result = a - b; break;
        case "×": result = a * b; break;
        case "÷": result = b !== 0 ? a / b : 0; break;
      }
      const resultStr = result.toString();
      setHistory((prev) => [`${previous} ${operator} ${display} = ${resultStr}`, ...prev].slice(0, 10));
      setDisplay(resultStr);
      setPrevious("");
      setOperator("");
      return;
    }
    if (value === ".") {
      if (!display.includes(".")) {
        setDisplay((prev) => prev + ".");
      }
      return;
    }
    setDisplay((prev) => (prev === "0" ? value : prev + value));
  };

  const buttons = [
    ["C", "⌫", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];

  const getBtnStyle = (btn: string) => {
    if (["C", "⌫"].includes(btn)) return [styles.btn, styles.btnClear];
    if (["÷", "×", "-", "+", "="].includes(btn)) return [styles.btn, styles.btnOp];
    return [styles.btn, styles.btnNum];
  };

  const getBtnTextStyle = (btn: string) => {
    if (["C", "⌫"].includes(btn)) return [styles.btnText, styles.btnTextClear];
    if (["÷", "×", "-", "+", "="].includes(btn)) return [styles.btnText, styles.btnTextOp];
    return [styles.btnText, styles.btnTextNum];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.displayArea}>
        <Text style={styles.display}>{display}</Text>
        {operator && <Text style={styles.operator}>{previous} {operator}</Text>}
      </View>

      <TouchableOpacity style={styles.historyToggle} onPress={() => setShowHistory(!showHistory)}>
        <Text style={styles.historyToggleText}>{showHistory ? "Hide History" : "Show History"}</Text>
      </TouchableOpacity>

      {showHistory && (
        <ScrollView style={styles.historyList}>
          {history.length === 0 ? (
            <Text style={styles.historyEmpty}>No calculations yet</Text>
          ) : (
            history.map((item, i) => (
              <Text key={i} style={styles.historyItem}>{item}</Text>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.pad}>
        {buttons.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                style={[...getBtnStyle(btn), btn === "0" && styles.btnZero]}
                onPress={() => handlePress(btn)}
              >
                <Text style={getBtnTextStyle(btn)}>{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  displayArea: { flex: 1, justifyContent: "flex-end", alignItems: "flex-end", padding: 24 },
  display: { color: "#fff", fontSize: 56, fontWeight: "300", fontVariant: ["tabular-nums"] },
  operator: { color: "#94A3B8", fontSize: 20, marginTop: 8 },
  historyToggle: { paddingHorizontal: 24, paddingVertical: 8 },
  historyToggleText: { color: "#6366F1", fontSize: 14, fontWeight: "600" },
  historyList: { maxHeight: 120, paddingHorizontal: 24 },
  historyEmpty: { color: "#64748B", fontSize: 14, textAlign: "center", paddingVertical: 8 },
  historyItem: { color: "#94A3B8", fontSize: 14, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  pad: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  btn: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  btnZero: { width: 156 },
  btnNum: { backgroundColor: "#1a1a1a" },
  btnClear: { backgroundColor: "#334155" },
  btnOp: { backgroundColor: "#6366F1" },
  btnText: { fontSize: 24, fontWeight: "600" },
  btnTextNum: { color: "#fff" },
  btnTextClear: { color: "#EF4444" },
  btnTextOp: { color: "#fff" },
});
