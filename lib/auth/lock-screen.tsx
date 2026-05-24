/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LOCK SCREEN — OS Unlock UI                                  ║
 * ║  Delegates lock/unlock to osShell (not identityEngine directly) ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { osShell } from "@/lib/shell/os-shell";

interface LockScreenProps {
  onUnlock?: () => void;
  userEmail?: string;
}

export function LockScreen({ onUnlock, userEmail }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const attemptsRef = useRef(0);

  const MAX_ATTEMPTS = 5;

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length >= 6) return;
      setError(false);
      setPin((prev) => prev + digit);
    },
    [pin.length]
  );

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  }, []);

  const handleBiometric = useCallback(async () => {
    const success = await osShell.unlockWithBiometric();
    if (success) {
      onUnlock?.();
    }
  }, [onUnlock]);

  const handleVerify = useCallback(async () => {
    if (pin.length < 4) return;

    const valid = await osShell.unlockWithPin(pin);

    if (valid) {
      setPin("");
      setError(false);
      attemptsRef.current = 0;
      onUnlock?.();
    } else {
      Vibration.vibrate(200);
      setError(true);
      setShake(true);
      attemptsRef.current += 1;
      setPin("");
      setTimeout(() => setShake(false), 300);

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        Alert.alert(
          "Too Many Attempts",
          "For security, you have been signed out.",
          [
            {
              text: "OK",
              onPress: async () => {
                await osShell.lock();
              },
            },
          ]
        );
      }
    }
  }, [pin, onUnlock]);

  // Auto-verify when PIN reaches max length
  React.useEffect(() => {
    if (pin.length === 6) {
      handleVerify();
    }
  }, [pin, handleVerify]);

  const dots = Array.from({ length: 6 }, (_, i) => i < pin.length);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="lock-closed" size={48} color="#6366f1" />
        <Text style={styles.title}>MTAA OS Locked</Text>
        {userEmail && (
          <Text style={styles.subtitle}>{userEmail}</Text>
        )}
      </View>

      <View style={[styles.dotsRow, shake && styles.shake]}>
        {dots.map((filled, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              filled && styles.dotFilled,
              error && styles.dotError,
            ]}
          />
        ))}
      </View>

      {error && (
        <Text style={styles.errorText}>
          Incorrect PIN ({MAX_ATTEMPTS - attemptsRef.current} attempts remaining)
        </Text>
      )}

      <View style={styles.numpad}>
        {[
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
          ["bio", "0", "del"],
        ].map((row, rowIdx) => (
          <View key={rowIdx} style={styles.numpadRow}>
            {row.map((key) => {
              if (key === "bio") {
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.numpadButton}
                    onPress={handleBiometric}
                  >
                    <Ionicons
                      name="finger-print"
                      size={28}
                      color="#6366f1"
                    />
                  </TouchableOpacity>
                );
              }

              if (key === "del") {
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.numpadButton}
                    onPress={handleDelete}
                  >
                    <Ionicons
                      name="backspace"
                      size={24}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={key}
                  style={styles.numpadButton}
                  onPress={() => handleDigit(key)}
                >
                  <Text style={styles.numpadText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await osShell.lock();
        }}
      >
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 40,
  },
  shake: {
    transform: [{ translateX: -5 }],
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#475569",
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  dotError: {
    borderColor: "#EF4444",
    backgroundColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginBottom: 24,
  },
  numpad: {
    width: "100%",
    maxWidth: 320,
    gap: 16,
  },
  numpadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  numpadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  numpadText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFF",
  },
  logoutButton: {
    marginTop: 32,
    padding: 12,
  },
  logoutText: {
    color: "#64748B",
    fontSize: 14,
  },
});
