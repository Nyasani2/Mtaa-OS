import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useCreditStore } from "@/lib/credit/hooks/use-credit-store";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function ApplyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { applyLoan } = useCreditStore();
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("");
  const [purpose, setPurpose] = useState("");

  const handleApply = async () => {
    if (!user) return;
    try {
      await applyLoan(user.id, parseFloat(amount), parseInt(months), purpose);
      Alert.alert("Success", "Loan application submitted");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apply for Credit</Text>
      <TextInput style={styles.input} placeholder="Amount ($)" placeholderTextColor="#64748B" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Term (months)" placeholderTextColor="#64748B" value={months} onChangeText={setMonths} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="Purpose" placeholderTextColor="#64748B" value={purpose} onChangeText={setPurpose} />
      <TouchableOpacity style={styles.button} onPress={handleApply}>
        <Text style={styles.buttonText}>Submit Application</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "white", marginTop: 60, marginBottom: 20 },
  input: { backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "white", fontSize: 16, marginBottom: 12 },
  button: { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 20 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
