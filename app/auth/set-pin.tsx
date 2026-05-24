/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SET PIN SCREEN — Configure Device Lock                       ║
 * ║  Called from settings or first-time setup                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { pinEngine } from "@/lib/security/pin-engine";

export default function SetPinScreen() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const savePin = async () => {
    try {
      setLoading(true);

      if (pin.length < 4 || pin.length > 6) {
        Alert.alert("Error", "PIN must be 4–6 digits");
        return;
      }

      if (pin !== confirmPin) {
        Alert.alert("Error", "PINs do not match");
        return;
      }

      await pinEngine.setPin(pin);

      Alert.alert("Success", "Device secured with PIN", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to set PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Device PIN</Text>

      <Text style={styles.subtitle}>
        This PIN will be used to unlock MTAA OS after you sign in.
        It does not replace your password.
      </Text>

      <TextInput
        value={pin}
        onChangeText={(text) => setPin(text.replace(/[^0-9]/g, ""))}
        keyboardType="numeric"
        secureTextEntry
        placeholder="Enter PIN (4–6 digits)"
        placeholderTextColor="#666"
        style={styles.input}
        maxLength={6}
      />

      <TextInput
        value={confirmPin}
        onChangeText={(text) => setConfirmPin(text.replace(/[^0-9]/g, ""))}
        keyboardType="numeric"
        secureTextEntry
        placeholder="Confirm PIN"
        placeholderTextColor="#666"
        style={styles.input}
        maxLength={6}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={savePin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Securing..." : "Secure Device"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => router.back()}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    color: "#94A3B8",
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#1E293B",
    color: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 8,
  },
  button: {
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  skipButton: {
    marginTop: 16,
    alignItems: "center",
  },
  skipText: {
    color: "#64748B",
    fontSize: 14,
  },
});
