import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";

import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/auth-store";
import { PinStore } from "@/lib/security/pin-store";

const { height } = Dimensions.get("window");

export default function LockScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const [pin, setPin] = useState("");

  // 🔐 BIOMETRIC UNLOCK
  const biometricUnlock = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !enrolled) {
        Alert.alert("Unavailable", "Biometrics not set up");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock MTAA OS",
      });

      if (!result.success) return;

      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        Alert.alert("Error", "No session found");
        return;
      }

      setUser({
        id: data.user.id,
        email: data.user.email,
      });

      router.replace("/(os)/home");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  // 🔢 PIN UNLOCK (SECURE)
  const pinUnlock = async () => {
    if (pin.length !== 6) {
      Alert.alert("Invalid PIN", "PIN must be 6 digits");
      return;
    }

    const ok = await PinStore.verifyPin(pin);

    if (!ok) {
      Alert.alert("Wrong PIN", "Try again");
      return;
    }

    const { data } = await supabase.auth.getUser();

    if (!data?.user) {
      Alert.alert("No Session", "Please sign in again");
      return;
    }

    setUser({
      id: data.user.id,
      email: data.user.email,
    });

    router.replace("/(os)/home");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>MTAA OS</Text>
        <Text style={styles.subtitle}>Secure Unlock</Text>

        <TouchableOpacity
          style={styles.biometric}
          onPress={biometricUnlock}
        >
          <Text style={styles.biometricText}>
            Use Face ID / Fingerprint
          </Text>
        </TouchableOpacity>

        <Text style={styles.or}>or enter PIN</Text>

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

        <TouchableOpacity style={styles.unlock} onPress={pinUnlock}>
          <Text style={styles.unlockText}>Unlock</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/signup")}>
          <Text style={styles.link}>Create account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "90%",
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "700",
  },

  subtitle: {
    color: "#777",
    marginBottom: 30,
  },

  biometric: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },

  biometricText: {
    color: "#fff",
  },

  or: {
    color: "#666",
    marginVertical: 18,
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

  unlock: {
    marginTop: 18,
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 14,
    width: "60%",
  },

  unlockText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  link: {
    color: "#6366f1",
    marginTop: 18,
  },
});
