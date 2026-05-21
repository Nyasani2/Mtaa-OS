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
import { pinStore } from "@/lib/security/pin-store";

export default function SetPinScreen() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const savePin = async () => {
    try {
      setLoading(true);

      if (pin.length < 4) {
        Alert.alert("Error", "PIN must be 4–6 digits");
        return;
      }

      if (pin !== confirmPin) {
        Alert.alert("Error", "PINs do not match");
        return;
      }

      await pinStore.setPin(pin);

      Alert.alert("Success", "Device secured with PIN");

      router.replace("/login");
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
        This PIN will be used for fast unlock (iOS-style security layer)
      </Text>

      <TextInput
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        secureTextEntry
        placeholder="Enter PIN"
        placeholderTextColor="#666"
        style={styles.input}
        maxLength={6}
      />

      <TextInput
        value={confirmPin}
        onChangeText={setConfirmPin}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
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
    color: "#888",
    marginBottom: 24,
  },

  input: {
    backgroundColor: "#111",
    color: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  },
});
