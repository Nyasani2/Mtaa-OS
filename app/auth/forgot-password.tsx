/**
 * FORGOT PASSWORD SCREEN
 * MTAA_OS_V10 — Uses identityEngine.resetPassword()
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useIdentity } from "@/lib/auth/identity";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useIdentity();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email.trim());
      if (result.success) {
        setSent(true);
      } else {
        Alert.alert("Reset Failed", result.message);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
          <View style={{ width: 24 }} />
        </View>

        {sent ? (
          <View style={styles.successContainer}>
            <Ionicons name="mail-outline" size={64} color="#6366F1" />
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successText}>
              We have sent a password reset link to {email}. Follow the instructions to reset your password.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/auth/login")}
            >
              <Text style={styles.backText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.description}>
              Enter your email address and we will send you a link to reset your password.
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.resetText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  content: { flex: 1, padding: 24, paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "white" },
  description: {
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  label: { color: "#94A3B8", marginBottom: 8, fontSize: 14 },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    color: "white",
    fontSize: 16,
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: "#6366F1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.6 },
  resetText: { color: "white", fontWeight: "bold", fontSize: 16 },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6366F1",
    width: "100%",
  },
  backText: { color: "#6366F1", fontWeight: "600", fontSize: 16 },
});
