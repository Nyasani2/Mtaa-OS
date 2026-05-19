import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [email, setEmail] = useState("");

  const sendReset = async () => {
    await supabase.auth.resetPasswordForEmail(email);
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
      <Text style={{ color: "white", fontSize: 22, marginBottom: 20 }}>
        Reset Password
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
        }}
      />

      <Pressable
        onPress={sendReset}
        style={{
          marginTop: 16,
          backgroundColor: "white",
          padding: 14,
          borderRadius: 10,
        }}
      >
        <Text style={{ textAlign: "center" }}>Send Reset Link</Text>
      </Pressable>
    </View>
  );
}
