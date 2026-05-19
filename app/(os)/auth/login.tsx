import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = async () => {
    try {
      await signIn(email, password);
      router.replace("/(os)");
    } catch (e) {
      console.log("LOGIN ERROR:", e);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text style={{ color: "white", fontSize: 28, marginBottom: 20 }}>
        MTAA OS
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        style={{
          backgroundColor: "#111",
          color: "white",
          padding: 14,
          borderRadius: 10,
          marginBottom: 12,
        }}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          backgroundColor: "#111",
          color: "white",
          padding: 14,
          borderRadius: 10,
          marginBottom: 20,
        }}
      />

      <Pressable
        onPress={onLogin}
        style={{
          backgroundColor: "white",
          padding: 14,
          borderRadius: 10,
        }}
      >
        <Text style={{ textAlign: "center", fontWeight: "600" }}>
          {loading ? "Signing in..." : "Unlock"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(os)/auth/reset-password")}>
        <Text style={{ color: "#888", marginTop: 16, textAlign: "center" }}>
          Forgot password?
        </Text>
      </Pressable>
    </View>
  );
}
