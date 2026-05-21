import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function TransferScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance, transfer, loading } = useWalletStore();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"input" | "confirm">("input");

  const parsedAmount = parseFloat(amount) || 0;
  const valid = recipient.length > 0 && parsedAmount > 0 && parsedAmount <= balance;

  const handleTransfer = async () => {
    if (!valid) return;
    try {
      await transfer({
        to: recipient,
        amount: parsedAmount,
        note: note || undefined,
      });
      Alert.alert("Success", `Transferred $${parsedAmount.toFixed(2)} to ${recipient}`);
      router.back();
    } catch (err: any) {
      Alert.alert("Transfer Failed", err.message || "Could not complete transfer");
    }
  };

  if (step === "confirm") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep("input")}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Confirm Transfer</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.confirmCard}>
          <Text style={styles.confirmLabel}>Amount</Text>
          <Text style={styles.confirmValue}>${parsedAmount.toFixed(2)}</Text>

          <Text style={styles.confirmLabel}>To</Text>
          <Text style={styles.confirmValue}>{recipient}</Text>

          {note && (
            <>
              <Text style={styles.confirmLabel}>Note</Text>
              <Text style={styles.confirmValue}>{note}</Text>
            </>
          )}

          <View style={styles.divider} />

          <Text style={styles.confirmLabel}>From Balance</Text>
          <Text style={[styles.confirmValue, { color: "#94A3B8" }]}>
            ${balance.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={handleTransfer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Confirm Transfer</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Transfer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
        </View>

        <Text style={styles.label}>Recipient</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone, email, or user ID"
          placeholderTextColor="#64748B"
          value={recipient}
          onChangeText={setRecipient}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#64748B"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="What's this for?"
          placeholderTextColor="#64748B"
          value={note}
          onChangeText={setNote}
          multiline
        />

        <TouchableOpacity
          style={[styles.button, !valid && styles.buttonDisabled]}
          onPress={() => setStep("confirm")}
          disabled={!valid}
        >
          <Text style={styles.buttonText}>Review Transfer</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  form: {
    paddingHorizontal: 20,
  },
  balanceCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  noteInput: {
    height: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  buttonDisabled: {
    backgroundColor: "#334155",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 24,
    margin: 20,
  },
  confirmLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  confirmValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 16,
  },
  confirmButton: {
    marginHorizontal: 20,
  },
});
