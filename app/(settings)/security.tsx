import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useIdentity } from "@/lib/auth/identity";
import { pinEngine, getPinState } from "@/lib/security/pin-engine";
import { supabase } from "@/lib/supabase/client";
import { Ionicons } from "@expo/vector-icons";

export default function SecurityScreen() {
  const router = useRouter();
  const { user } = useIdentity();
  const [hasPin, setHasPin] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPinState().then((state) => setHasPin(state.isSet));
  }, []);

  const handleChangePin = () => {
    router.push("/auth/set-pin" as any);
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    Alert.alert("Check Email", "Password reset link sent");
  };

  const handleToggleBiometric = (val: boolean) => {
    setBiometricEnabled(val);
    // Store preference
    Alert.alert(val ? "Biometric Enabled" : "Biometric Disabled", "This will apply on next unlock");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Lock</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="keypad-outline" size={20} color="#6366F1" />
              <Text style={styles.rowLabel}>PIN Lock</Text>
            </View>
            <Text style={styles.rowValue}>{hasPin ? "Enabled" : "Not Set"}</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleChangePin}>
            <Text style={styles.actionText}>{hasPin ? "Change PIN" : "Set PIN"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="finger-print-outline" size={20} color="#6366F1" />
              <Text style={styles.rowLabel}>Biometric Unlock</Text>
            </View>
            <Switch value={biometricEnabled} onValueChange={handleToggleBiometric} trackColor={{ false: "#334155", true: "#6366F1" }} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Security</Text>
        <TouchableOpacity style={styles.card} onPress={handleResetPassword}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#6366F1" />
              <Text style={styles.rowLabel}>Reset Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Sessions</Text>
        <View style={styles.card}>
          <Text style={styles.sessionText}>Current Device</Text>
          <Text style={styles.sessionSub}>{user?.email} • Active now</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#64748B", paddingHorizontal: 16, paddingVertical: 8, textTransform: "uppercase", letterSpacing: 1 },
  card: { backgroundColor: "#1a1a1a", marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { color: "#fff", fontSize: 15 },
  rowValue: { color: "#94A3B8", fontSize: 14 },
  actionBtn: { marginTop: 12, backgroundColor: "#334155", padding: 12, borderRadius: 8, alignItems: "center" },
  actionText: { color: "#6366F1", fontSize: 14, fontWeight: "600" },
  sessionText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  sessionSub: { color: "#64748B", fontSize: 12, marginTop: 4 },
});
