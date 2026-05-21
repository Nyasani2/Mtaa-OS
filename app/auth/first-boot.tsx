import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { PinStore } from "@/lib/security/pin-store";

export default function FirstBoot() {
  const [step, setStep] = useState<"welcome" | "pin" | "biometric" | "done">(
    "welcome"
  );

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 CREATE PIN
  const createPin = async () => {
    if (pin.length !== 6) {
      Alert.alert("Invalid PIN", "PIN must be 6 digits");
      return;
    }

    setLoading(true);

    try {
      await PinStore.setPin(pin);
      setStep("biometric");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 ENABLE BIOMETRICS (OPTIONAL BUT RECOMMENDED)
  const enableBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !enrolled) {
      setStep("done");
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Enable Face ID / Fingerprint for MTAA OS",
    });

    if (!result.success) {
      setStep("done");
      return;
    }

    setStep("done");
  };

  // 🚀 FINISH SETUP
  const finishSetup = () => {
    router.replace("/auth/lock-screen");
  };

  return (
    <View style={styles.container}>
      {/* WELCOME */}
      {step === "welcome" && (
        <View style={styles.center}>
          <Text style={styles.title}>Welcome to MTAA OS</Text>
          <Text style={styles.subtitle}>Your personal operating system</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setStep("pin")}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PIN SETUP */}
      {step === "pin" && (
        <View style={styles.center}>
          <Text style={styles.title}>Create Passcode</Text>
          <Text style={styles.subtitle}>
            This protects your device
          </Text>

          <TextInput
            style={styles.pin}
            placeholder="••••••"
            placeholderTextColor="#555"
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            value={pin}
            onChangeText={setPin}
          />

          <TouchableOpacity style={styles.button} onPress={createPin}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* BIOMETRICS */}
      {step === "biometric" && (
        <View style={styles.center}>
          <Text style={styles.title}>Face ID</Text>
          <Text style={styles.subtitle}>
            Unlock MTAA OS faster and securely
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={enableBiometrics}
          >
            <Text style={styles.buttonText}>Enable Face ID</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep("done")}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* DONE */}
      {step === "done" && (
        <View style={styles.center}>
          <Text style={styles.title}>All Set</Text>
          <Text style={styles.subtitle}>Welcome to your OS</Text>

          <TouchableOpacity style={styles.button} onPress={finishSetup}>
            <Text style={styles.buttonText}>Enter</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
  },

  subtitle: {
    color: "#777",
    marginTop: 10,
    marginBottom: 30,
    textAlign: "center",
  },

  pin: {
    width: "60%",
    backgroundColor: "#111",
    color: "#fff",
    textAlign: "center",
    fontSize: 22,
    letterSpacing: 10,
    padding: 16,
    borderRadius: 14,
  },

  button: {
    marginTop: 20,
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 14,
    width: "60%",
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  skip: {
    color: "#666",
    marginTop: 20,
  },
});
