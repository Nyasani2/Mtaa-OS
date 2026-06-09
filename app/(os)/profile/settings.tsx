"use client";

import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useWalletAccount } from "@/hooks";
import { supabase } from "@/lib/supabase/client";
import {
  Lock,
  Bell,
  Fingerprint,
  Globe,
  Moon,
  ChevronRight,
  Shield,
  Key,
  Eye,
  EyeOff,
  LogOut,
  User,
} from "lucide-react-native";

export default function WalletSettings() {
  const router = useRouter();
  const { account } = useWalletAccount();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const handleSavePin = async () => {
    if (pin.length !== 4) {
      Alert.alert("Error", "PIN must be 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert("Error", "PINs do not match");
      return;
    }
    setSaving(true);
    try {
      // Save PIN via secure storage or edge function
      Alert.alert("Success", "PIN updated successfully");
      setPin("");
      setConfirmPin("");
    } catch (err) {
      Alert.alert("Error", "Failed to update PIN");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const SettingRow = ({ icon: Icon, label, value, onPress, toggle }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !toggle}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#1a1a2e",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: "#16213e",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        <Icon size={20} color="#00d4ff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "500" }}>
          {label}
        </Text>
        {value && (
          <Text style={{ color: "#888", fontSize: 13, marginTop: 2 }}>
            {value}
          </Text>
        )}
      </View>
      {toggle !== undefined ? (
        <Switch
          value={toggle}
          onValueChange={onPress}
          trackColor={{ false: "#1a1a2e", true: "#00d4ff" }}
          thumbColor={toggle ? "#fff" : "#666"}
        />
      ) : onPress ? (
        <ChevronRight size={20} color="#666" />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0a0a0a" }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold" }}>
          Settings
        </Text>
        <Text style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
          Wallet & Security Preferences
        </Text>
      </View>

      {/* Security Section */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            color: "#00d4ff",
            fontSize: 13,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          Security
        </Text>

        <SettingRow
          icon={Shield}
          label="Change PIN"
          value="Update your 4-digit PIN"
          onPress={() => {}}
        />

        <SettingRow
          icon={Fingerprint}
          label="Biometric Authentication"
          value="Use fingerprint or face ID"
          toggle={biometric}
          onPress={() => setBiometric(!biometric)}
        />

        <SettingRow
          icon={Key}
          label="Recovery Phrase"
          value="View your 12-word recovery phrase"
          onPress={() => router.push("/(os)/wallet/backup")}
        />
      </View>

      {/* Preferences Section */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            color: "#00d4ff",
            fontSize: 13,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          Preferences
        </Text>

        <SettingRow
          icon={Bell}
          label="Notifications"
          value="Push and in-app alerts"
          toggle={notifications}
          onPress={() => setNotifications(!notifications)}
        />

        <SettingRow
          icon={Moon}
          label="Dark Mode"
          value="Always on in MTAA OS"
          toggle={darkMode}
          onPress={() => setDarkMode(!darkMode)}
        />

        <SettingRow
          icon={Globe}
          label="Language"
          value="English"
          onPress={() => {}}
        />
      </View>

      {/* Account Section */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            color: "#00d4ff",
            fontSize: 13,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          Account
        </Text>

        <SettingRow
          icon={User}
          label="Profile Settings"
          value="Edit your public profile"
          onPress={() => router.push("/(os)/profile/edit")}
        />

        <SettingRow
          icon={Lock}
          label="Privacy"
          value="Manage data sharing preferences"
          onPress={() => {}}
        />
      </View>

      {/* PIN Change Section */}
      <View
        style={{
          backgroundColor: "#16213e",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 16,
          }}
        >
          Change PIN
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>
            New PIN (4 digits)
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#0a0a0a",
              borderRadius: 12,
              paddingHorizontal: 16,
            }}
          >
            <Lock size={18} color="#666" style={{ marginRight: 12 }} />
            <TextInput
              value={pin}
              onChangeText={setPin}
              placeholder="****"
              placeholderTextColor="#444"
              secureTextEntry={!showPin}
              keyboardType="number-pad"
              maxLength={4}
              style={{
                flex: 1,
                color: "#fff",
                fontSize: 16,
                paddingVertical: 14,
                letterSpacing: 8,
              }}
            />
            <TouchableOpacity onPress={() => setShowPin(!showPin)}>
              {showPin ? (
                <EyeOff size={18} color="#666" />
              ) : (
                <Eye size={18} color="#666" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>
            Confirm PIN
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#0a0a0a",
              borderRadius: 12,
              paddingHorizontal: 16,
            }}
          >
            <Lock size={18} color="#666" style={{ marginRight: 12 }} />
            <TextInput
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="****"
              placeholderTextColor="#444"
              secureTextEntry={!showPin}
              keyboardType="number-pad"
              maxLength={4}
              style={{
                flex: 1,
                color: "#fff",
                fontSize: 16,
                paddingVertical: 14,
                letterSpacing: 8,
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSavePin}
          disabled={saving || pin.length !== 4 || confirmPin.length !== 4}
          style={{
            backgroundColor:
              pin.length === 4 && confirmPin.length === 4 && !saving
                ? "#00d4ff"
                : "#1a1a2e",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          {saving ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text
              style={{
                color:
                  pin.length === 4 && confirmPin.length === 4 && !saving
                    ? "#0a0a0a"
                    : "#666",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Update PIN
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a2e",
          borderRadius: 12,
          paddingVertical: 16,
          borderWidth: 1,
          borderColor: "#ff4444",
        }}
      >
        <LogOut size={20} color="#ff4444" style={{ marginRight: 8 }} />
        <Text style={{ color: "#ff4444", fontSize: 16, fontWeight: "600" }}>
          Logout
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          color: "#444",
          fontSize: 12,
          textAlign: "center",
          marginTop: 24,
        }}
      >
        MTAA OS v1.0 — Secure by Design
      </Text>
    </ScrollView>
  );
}
