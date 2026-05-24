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
import { supabase } from "@/lib/supabase";

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async () => {
    if (!password.trim()) {
      Alert.alert("Error", "Enter a new password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        Alert.alert(
          "Session Missing",
          "Reset link expired. Please request a new one."
        );
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      Alert.alert("Update Failed", err.message);
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
          <TouchableOpacity onPress={() => router.replace("/auth/login")}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
          <View style={{ width: 24 }} />
        </View>

        {success ? (
          <View style={styles.success}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.successText}>Password Updated</Text>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => router.replace("/auth/login")}
            >
              <Text style={styles.btnText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="New password"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Confirm password"
              placeholderTextColor="#64748B"
            />

            <TouchableOpacity
              style={styles.btn}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnText}>Update Password</Text>
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
  header: { flexDirection: "row", justifyContent: "space-between" },
  title: { color: "white", fontSize: 20, fontWeight: "700" },
  label: { color: "#94A3B8", marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    color: "white",
  },
  btn: {
    marginTop: 16,
    backgroundColor: "#6366F1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "700" },
  success: { flex: 1, justifyContent: "center", alignItems: "center" },
  successText: { color: "white", fontSize: 18, marginVertical: 12 },
});
