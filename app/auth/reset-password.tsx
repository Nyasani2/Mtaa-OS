/**
 * RESET PASSWORD SCREEN (from email link)
 * MTAA_OS_V10 — Uses identityEngine.updatePassword()
 * Handles deep link from Supabase password reset email
 */

import React, { useState, useEffect } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useIdentity } from "@/lib/auth/identity";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updatePassword } = useIdentity();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Verify we have a recovery token from the URL
  useEffect(() => {
    // Expo Router handles the deep link — params may contain access_token
    // Supabase auth listener will automatically process the recovery token
    // This screen is for entering the NEW password
    console.log("[ResetPassword] Params:", params);
  }, [params]);

  const handleUpdate = async () => {
    if (!password.trim()) {
      Alert.alert("Missing Password", "Please enter a new password.");
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

    setLoading(true);
    try {
      const result = await updatePassword(password.trim());
      if (result.success) {
        setSuccess(true);
      } else {
        Alert.alert("Update Failed", result.message);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update password.");
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
          <Text style={styles.title}>New Password</Text>
          <View style={{ width: 24 }} />
        </View>

        {success ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.successTitle}>Password Updated</Text>
            <Text style={styles.successText}>
              Your password has been successfully updated. You can now sign in with your new password.
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.replace("/auth/login")}
            >
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.description}>
              Enter your new password below.
            </Text>

            <Text style={styles.label}>New Password</Text>
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
              style={[styles.updateButton, loading && styles.disabledButton]}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.updateText}>Update Password</Text>
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
    marginBottom: 16,
  },
  passwordContainer: { position: "relative" },
  passwordInput: { paddingRight: 50 },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 14,
  },
  updateButton: {
    backgroundColor: "#6366F1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: { opacity: 0.6 },
  updateText: { color: "white", fontWeight: "bold", fontSize: 16 },
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
  loginButton: {
    backgroundColor: "#6366F1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  loginText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
