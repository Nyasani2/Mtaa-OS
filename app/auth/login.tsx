/**
 * LOGIN SCREEN
 * MTAA_OS_V10 — Uses identityEngine (sole auth authority)
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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useIdentity();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setLocalLoading(true);
    try {
      await signIn(email.trim(), password.trim());
      // Success: auth listener updates state → OSGate redirects to OS
    } catch (err: any) {
      Alert.alert(
        "Sign In Failed",
        err.message || "Invalid email or password. Please try again."
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
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.title}>MTAA OS</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
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
              placeholder="Enter your password"
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

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.push("/auth/forgot-password")}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, localLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={localLoading || isLoading}
          >
            {localLoading || isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.push("/auth/signup")}
          >
            <Text style={styles.signupText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  content: { flex: 1, justifyContent: "center", padding: 24 },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: { fontSize: 40, fontWeight: "800", color: "#FFF" },
  title: { fontSize: 28, fontWeight: "800", color: "#FFF", letterSpacing: 2 },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 8 },
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
  forgotButton: { alignSelf: "flex-end", marginBottom: 20 },
  forgotText: { color: "#6366F1", fontSize: 14 },
  loginButton: {
    backgroundColor: "#6366F1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.6 },
  loginText: { color: "white", fontWeight: "bold", fontSize: 16 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#334155" },
  dividerText: { color: "#64748B", marginHorizontal: 12, fontSize: 14 },
  signupButton: {
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6366F1",
  },
  signupText: { color: "#6366F1", fontWeight: "600", fontSize: 16 },
});
