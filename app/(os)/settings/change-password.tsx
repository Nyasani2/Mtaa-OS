import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT: ensure you already have a central supabase client in your project
import { supabase } from "../../../lib/supabase";

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      // Force session refresh safety (important for your wallet system)
      await supabase.auth.refreshSession();

      Alert.alert(
        "Success",
        "Password updated successfully. Please log in again.",
        [
          {
            text: "OK",
            onPress: async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Password Update Failed", err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#0b0b0b" }}>
      <Text style={{ color: "white", fontSize: 22, fontWeight: "700", marginBottom: 20 }}>
        Change Password
      </Text>

      <Text style={{ color: "#aaa", marginBottom: 8 }}>New Password</Text>
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="Enter new password"
        placeholderTextColor="#555"
        style={{
          backgroundColor: "#1a1a1a",
          padding: 14,
          borderRadius: 10,
          color: "white",
          marginBottom: 15,
        }}
      />

      <Text style={{ color: "#aaa", marginBottom: 8 }}>Confirm Password</Text>
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="Confirm password"
        placeholderTextColor="#555"
        style={{
          backgroundColor: "#1a1a1a",
          padding: 14,
          borderRadius: 10,
          color: "white",
          marginBottom: 25,
        }}
      />

      <Pressable
        onPress={handleChangePassword}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#333" : "#4f46e5",
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "600" }}>
            Update Password
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        style={{ marginTop: 15, alignItems: "center" }}
      >
        <Text style={{ color: "#888" }}>Cancel</Text>
      </Pressable>
    </View>
  );
}

