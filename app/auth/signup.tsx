/**
 * SIGNUP SCREEN
 * MTAA_OS_V10 — Uses identityEngine (sole auth authority)
 * Handles email confirmation flow
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

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useIdentity();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter email and password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setLocalLoading(true);
    try {
      const result = await signUp(email.trim(), password.trim());

      if (result.confirmationRequired) {
        Alert.alert(
          "Check Your Email",
          result.message,
          [
            {
              text: "OK",
              onPress: () => router.replace("/auth/login"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Welcome!",
          "Your account has been created successfully.",
          [
            {
              text: "Continue",
              onPress: () => {
                // Auth listener will handle redirect to OS
              },
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Sign Up Failed",
        err.message || "Could not create account. Please try again."
      );
    } finally {
      setLocalLoading(false);
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
          <Text style={styles.title}>Create Account</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
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

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              placeholderTextColor="#64748B"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            placeholderTextColor="#64748B"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.signupButton, localLoading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={localLoading || isLoading}
          >
            {localLoading || isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signupText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  content: { flex: 1, justifyContent: "center", padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "white" },
  form: { width: "100%" },
  label: { color: "#94A3B8", marginBottom: 8, fontSize: 14 },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    color: "white",
    fontSize: 16,
    marginBottom: 16,
  },
  passwordContainer: { position: "relative" },
  passwordInput: { paddingRight: 50 },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 14,
  },
  signupButton: {
    backgroundColor: "#6366F1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: { opacity: 0.6 },
  signupText: { color: "white", fontWeight: "bold", fontSize: 16 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: { color: "#64748B", fontSize: 14 },
  footerLink: { color: "#6366F1", fontSize: 14, fontWeight: "600" },
});
